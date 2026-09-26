# Juan Flasher

Juan Flasher is a Windows desktop utility for programming and diagnosing AVR-based boards. It combines a Vue 3/Vite interface with a Rust-powered Tauri desktop backend for firmware flashing, ISP programming, bootloader installation, serial communication, and Supabase-backed firmware and account management.

**Current release:** `4.0.2`

> Windows is the currently supported desktop target. Support for other operating systems can be added later without changing the Vue/Vite frontend.

## Features

- Upload Intel HEX firmware over an Arduino-compatible bootloader
- Program devices through ISP using:
  - USBtinyISP
  - AVRISP mkII
  - Arduino as ISP
- Burn the bundled Optiboot bootloader for ATmega328P targets
- Test ISP wiring and programmer connectivity
- Detect available serial ports
- Connect to a serial port and use the integrated serial monitor
- Select firmware from the local filesystem
- Browse and download firmware from a private Supabase Storage bucket
- Authenticate users with Supabase
- Manage temporary users from an administrator account
- Package the application as a Windows NSIS installer
- Bundle AVRDUDE and required Windows USB resources with the application

## Technology stack

- [Tauri 2](https://tauri.app/) and Rust — Windows desktop shell and native operations
- [Vue](https://vuejs.org/) 3 — application UI
- [Vite](https://vitejs.dev/) 5 — frontend development and production bundling
- [TypeScript](https://www.typescriptlang.org/)
- [AVRDUDE](https://github.com/avrdudes/avrdude) — AVR programming
- Rust [`serialport`](https://crates.io/crates/serialport) — serial-port access
- [Supabase](https://supabase.com/) — authentication, firmware storage, and account administration

## Project layout

```text
.
├── README.md
├── LICENSE
└── windows/
    ├── src/                   # Vue application and Tauri frontend bridge
    │   ├── App.vue            # Main UI, state, and user workflows
    │   ├── tauri.ts           # Typed Tauri command/event wrapper
    │   └── supabase.ts        # Supabase client
    ├── src-tauri/             # Rust/Tauri desktop backend
    │   ├── src/lib.rs         # Native commands, AVRDUDE, serial, and resources
    │   ├── src/main.rs        # Tauri entry point
    │   ├── tauri.conf.json    # Window, resource, icon, and NSIS configuration
    │   └── capabilities/      # Tauri permissions
    ├── tools/                 # Bundled AVRDUDE and bootloader resources
    ├── assets/                # Application icons and branding
    ├── supabase/              # Supabase Edge Functions
    ├── database_setup.sql     # Profiles, roles, policies, and RPC functions
    ├── vite.config.ts         # Vue/Vite configuration
    └── package.json           # Frontend and Tauri scripts/dependencies
```

The repository may still contain legacy Electron source files under `windows/electron/` for historical reference. They are not part of the active Tauri build or runtime.

## Requirements

- Windows 10 or later
- Node.js LTS, preferably Node.js 18 or 20+
- npm
- Rust and Cargo with the Windows MSVC toolchain
- Tauri prerequisites for Windows, including WebView2
- An AVR board and compatible programmer when using hardware features
- Supabase credentials for authentication and cloud firmware features

See the [Tauri prerequisites guide](https://v2.tauri.app/start/prerequisites/) if the Rust or Windows desktop toolchain is not installed.

## Development setup

From the `windows/` directory:

```bash
npm install
npm run dev
```

This starts Vite at `http://localhost:5173`, compiles the Rust Tauri backend, and opens the Juan Flasher desktop window with frontend hot reload and Tauri file watching.

To run only the Vue/Vite frontend:

```bash
npm run dev:web
```

## Configuration

Create a local environment file at `windows/.env.local` with:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These values are read by `windows/src/supabase.ts`. The Supabase anonymous key is intended for the client; never place a service-role key in the renderer, `.env.local` committed to source control, or a distributed application.

Cloud firmware and temporary-user administration also require the database and storage configuration described in [`windows/database_setup.sql`](./windows/database_setup.sql).

The firmware storage bucket should be named `firmware` and configured as a private bucket. Review the Row Level Security, Storage, and RPC policies before deployment.

## Build and package

From `windows/`:

```bash
# Build the Vue frontend only
npm run build:web

# Build the Tauri application and Windows installer
npm run build
```

The full Tauri build produces:

- Application executable:
  `windows/src-tauri/target/release/juan-flasher.exe`
- Windows NSIS installer:
  `windows/src-tauri/target/release/bundle/nsis/Juan Flasher_4.0.2_x64-setup.exe`

Other available scripts:

```bash
npm run start       # Start the Tauri development application
npm run dist        # Build the Tauri application
npm run dist:win    # Build the Windows NSIS bundle
```

The package includes the Vue frontend, Rust/Tauri backend, application icons, AVRDUDE files, USB support library, and bootloader resources.

## Bundled hardware resources

The current resource set is under `windows/tools/`:

```text
windows/tools/
├── avrdude/
│   ├── avrdude.exe
│   ├── avrdude.conf
│   └── libusb0.dll
└── bootloaders/
    └── atmega328p/
        └── optiboot.hex
```

The Tauri backend resolves these resources for both development and packaged layouts. The AVRDUDE working directory is set to its resource directory so its Windows USB dependency can be loaded correctly.

## Hardware and safety notes

The bootloader workflow is currently configured around an ATmega328P and the bundled Optiboot image. Its fuse values are board-specific and should be verified against the target board, clock configuration, and bootloader layout before programming.

AVR programming can permanently change device configuration. Confirm the selected MCU, programmer, port, firmware file, and operation before starting. Hardware-dependent flashing and serial behavior should be tested with the intended programmer and target board.

## Security and deployment notes

- Keep Supabase service-role credentials on the server or Edge Function only.
- Review Supabase Row Level Security, Storage policies, and temporary-user expiration rules before production use.
- Firmware paths, filenames, MCU values, programmer values, and serial settings are validated by the Tauri backend.
- Treat firmware and programmer operations as trusted hardware actions.
- Review the license and redistribution terms for bundled AVRDUDE, USB libraries, bootloaders, and firmware files before distributing builds.
- Do not commit `node_modules/`, `.env.local`, Rust `target/` output, or generated release artifacts.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).


LU: 09262026
