# Juan Flasher

Juan Flasher is a Windows desktop utility for programming and diagnosing AVR-based boards. It combines a Vue 3 user interface with Electron's native Windows capabilities to provide firmware flashing, ISP programming, bootloader installation, and serial monitoring in one application.

## Features

- Upload Intel HEX firmware over an Arduino-compatible bootloader
- Program devices through ISP using:
  - USBtinyISP
  - AVRISP mkII
  - Arduino as ISP
- Burn the bundled Optiboot bootloader for ATmega328P targets
- Test ISP wiring and programmer connectivity
- Detect available serial ports
- Connect to a serial port and use the integrated monitor/terminal
- Select firmware from the local filesystem
- Browse and download firmware from a private Supabase Storage bucket
- Authenticate users with Supabase
- Manage temporary users from an administrator account
- Package the application as a Windows NSIS installer

## Technology stack

- [Electron](https://www.electronjs.org/) 28
- [Vue](https://vuejs.org/) 3
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) 5
- [AVRDUDE](https://github.com/avrdudes/avrdude)
- [Node SerialPort](https://serialport.io/)
- [Supabase](https://supabase.com/)

## Project layout

```text
.
├── windows/
│   ├── electron/              # Electron main process, preload, AVR and serial handlers
│   ├── src/                   # Vue renderer and application UI
│   ├── scripts/               # Development and packaging helpers
│   ├── supabase/              # Supabase Edge Functions
│   ├── tools/                 # Bundled AVRDUDE and bootloader files
│   ├── assets/                # Application icons and branding
│   ├── database_setup.sql     # Supabase schema, policies, and RPC functions
│   └── package.json           # Windows app scripts and dependencies
└── README.md
```

## Requirements

- Windows 10 or later
- Node.js LTS, preferably Node.js 18 or 20
- npm
- An AVR board and compatible programmer when using hardware features
- Supabase credentials for authentication and cloud firmware features

## Development setup

From the `windows/` directory:

```bash
npm install
npm run dev
```

The development script starts Vite on `http://localhost:5173`, compiles the Electron process, and launches the desktop application with hot reload for renderer changes.

## Configuration

The renderer reads the following environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

These variables are used by `windows/src/supabase.ts`. Cloud firmware and user administration also require the Supabase database and storage configuration described in `windows/database_setup.sql`.

The firmware storage bucket should be named `firmware` and configured as a private bucket. Review the SQL file and Supabase policies before deploying the application.

## Build and package

From `windows/`:

```bash
npm run build
npm start
```

To create a Windows installer:

```bash
npm run dist:win
```

The packaged application includes the renderer, Electron process, branding assets, AVRDUDE files, and bootloader resources. Build output is written to `windows/release/`.

## Hardware notes

The current bootloader workflow is configured around an ATmega328P and the bundled Optiboot image. The fuse values and bootloader image should be verified for the specific board and clock configuration before programming hardware.

AVR programming operations can permanently change device configuration. Confirm the selected MCU, programmer, port, firmware file, and fuse settings before starting an operation.

## Security and deployment notes

- Keep Supabase service-role credentials out of the renderer and out of distributed builds.
- Review Row Level Security and Storage policies before enabling cloud firmware access.
- Treat firmware files and programmer operations as trusted inputs.
- Do not distribute modified AVRDUDE binaries or firmware without checking the applicable licenses and permissions.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
