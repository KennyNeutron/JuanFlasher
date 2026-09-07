-- =====================================================================
-- DATABASE SETUP: ADMIN & EXPIRING TEMPORARY USERS FOR JUAN FLASHER
-- Execute this script in your Supabase SQL Editor (Dashboard > SQL Editor)
-- =====================================================================
--
-- IMPORTANT: STORAGE BUCKET SETUP (Manual Step)
-- ==============================================
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New Bucket", name it: firmware
-- 3. Set it to PRIVATE (not public)
-- 4. After creating the bucket, go to Storage > Policies and create:
--
--    Policy 1: "Authenticated users can list and download firmware"
--      - Allowed operation: SELECT
--      - Target roles: authenticated
--      - Policy: (bucket_id = 'firmware')
--
--    Policy 2: "Authenticated users can download firmware"
--      - Allowed operation: SELECT (for objects)
--      - Target roles: authenticated
--      - Policy: (bucket_id = 'firmware')
--
--    Policy 3: "Admins can upload firmware"
--      - Allowed operation: INSERT
--      - Target roles: authenticated
--      - Policy: (bucket_id = 'firmware' AND public.is_admin())
--
--    Policy 4: "Admins can delete firmware"
--      - Allowed operation: DELETE
--      - Target roles: authenticated
--      - Policy: (bucket_id = 'firmware' AND public.is_admin())
--
-- OR run the SQL below after creating the bucket:
-- =====================================================================

-- 1. Create Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text not null check (role in ('admin', 'temp')),
  expires_at timestamp with time zone, -- NULL for admins, future timestamp for temporary users
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row-Level Security
alter table public.profiles enable row level security;

-- 2. Create Profile Access Policies
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

create policy "Users can view their own profile"
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Admins can view all profiles"
  on public.profiles for select
  using ( public.is_admin() );

-- 3. Automatic Profile Creation Trigger
-- This function automatically creates a public.profile entry when a user is created in auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, expires_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'temp'), -- Defaults to 'temp'
    case 
      when new.raw_user_meta_data->>'expires_at' is not null 
      then (new.raw_user_meta_data->>'expires_at')::timestamp with time zone
      else null
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Bind trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Helper function to check if an admin account exists
-- (Useful if you want to set the first signed-up account as admin automatically)
create or replace function public.set_first_user_as_admin()
returns trigger as $$
begin
  -- If this is the only profile in the database, make it an admin
  if (select count(*) from public.profiles) = 1 then
    update public.profiles set role = 'admin' where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_created_set_admin on public.profiles;
create trigger on_profile_created_set_admin
  after insert on public.profiles
  for each row execute procedure public.set_first_user_as_admin();

-- 5. INSERT policy so the trigger (handle_new_user) can write profiles for new users
create policy "Service role can insert profiles"
  on public.profiles for insert
  with check ( true );

-- 6. RPC: Create Temporary User (replaces Edge Function)
-- This function runs as the `postgres` superuser role via SECURITY DEFINER,
-- allowing it to insert into auth.users and auth.identities directly.
-- Only callable by authenticated admins (verified via is_admin()).
create or replace function public.create_temp_user(
  p_email text,
  p_password text,
  p_duration_hours int
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  new_user_id uuid;
  identity_id uuid;
  expires timestamptz;
  encrypted_pw text;
begin
  -- Verify the caller is an admin
  if not public.is_admin() then
    raise exception 'Forbidden: Admin privileges required.';
  end if;

  -- Validate inputs
  if p_email is null or p_password is null or p_duration_hours is null then
    raise exception 'Missing required fields: email, password, duration_hours.';
  end if;

  new_user_id := gen_random_uuid();
  identity_id := gen_random_uuid();
  expires := now() + (p_duration_hours || ' hours')::interval;
  encrypted_pw := crypt(p_password, gen_salt('bf'));

  -- Insert into auth.users
  insert into auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    role,
    aud,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) values (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    encrypted_pw,
    now(),
    jsonb_build_object('role', 'temp', 'expires_at', expires::text),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- Insert into auth.identities (required for email/password login)
  insert into auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    identity_id,
    new_user_id,
    p_email,
    'email',
    jsonb_build_object('sub', new_user_id::text, 'email', p_email, 'email_verified', true),
    now(),
    now(),
    now()
  );

  -- profiles row is created automatically by the handle_new_user trigger,
  -- but we need to ensure expires_at is set. The trigger reads raw_user_meta_data.
  -- Verify it was created:
  if not exists (select 1 from public.profiles where id = new_user_id) then
    insert into public.profiles (id, email, role, expires_at)
    values (new_user_id, p_email, 'temp', expires);
  end if;

  return jsonb_build_object(
    'message', 'Temporary user created successfully.',
    'userId', new_user_id,
    'email', p_email,
    'expiresAt', expires::text
  );
end;
$$;

-- 7. RPC: Disable Temporary User (expire immediately)
create or replace function public.disable_temp_user(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden: Admin privileges required.';
  end if;

  -- Set expires_at to now, effectively disabling the session
  update public.profiles
    set expires_at = now()
    where id = p_user_id and role = 'temp';

  if not found then
    raise exception 'Temporary user not found.';
  end if;

  return jsonb_build_object(
    'message', 'Temporary user disabled successfully.',
    'userId', p_user_id
  );
end;
$$;

-- 8. RPC: Renew Temporary User (extend expiration from now)
create or replace function public.renew_temp_user(
  p_user_id uuid,
  p_duration_hours int
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  new_expires timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Forbidden: Admin privileges required.';
  end if;

  if p_duration_hours is null or p_duration_hours < 1 then
    raise exception 'Duration must be at least 1 hour.';
  end if;

  -- Verify target is a temp user
  if not exists (select 1 from public.profiles where id = p_user_id and role = 'temp') then
    raise exception 'Temporary user not found.';
  end if;

  new_expires := now() + (p_duration_hours || ' hours')::interval;

  update public.profiles
    set expires_at = new_expires
    where id = p_user_id and role = 'temp';

  return jsonb_build_object(
    'message', 'Temporary user renewed successfully.',
    'userId', p_user_id,
    'expiresAt', new_expires::text
  );
end;
$$;

-- 9. RPC: Delete Temporary User (remove entirely)
create or replace function public.delete_temp_user(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden: Admin privileges required.';
  end if;

  -- Verify target is a temp user
  if not exists (select 1 from public.profiles where id = p_user_id and role = 'temp') then
    raise exception 'Temporary user not found.';
  end if;

  -- Delete from auth.users (cascades to profiles and identities)
  delete from auth.users where id = p_user_id;

  return jsonb_build_object(
    'message', 'Temporary user deleted successfully.',
    'userId', p_user_id
  );
end;
$$;

