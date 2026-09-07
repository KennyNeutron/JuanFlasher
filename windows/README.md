# Juan Flasher Desktop

A modern desktop utility for AVR development featuring unified port management, HEX firmware uploading, ISP programming, bootloader burning, wiring diagnostics, and an integrated serial monitor, rebuilt from scratch for speed, reliability, and production workflow.

## Current Status: Environment Validation Phase

This is a minimal Electron + Vue 3 + TypeScript + Vite setup to validate the development environment. No AVR features are implemented yet—this phase confirms that all tools are wired correctly.

## Project Structure

```
AVR_QuickLoader_V3/
├── electron/
│   └── main.ts              # Electron main process (1200×800 window, dark background)
├── scripts/
│   └── dev.js               # Development launcher (Vite + Electron with hot reload)
├── src/
│   ├── App.vue              # Main Vue component (centered "Hello World")
│   ├── main.ts              # Vue entry point
│   └── style.css            # Global styles (dark theme)
├── index.html               # HTML entry point
├── package.json             # Dependencies and npm scripts
├── tsconfig.json            # TypeScript config (Vue renderer)
├── tsconfig.node.json       # TypeScript config (Vite tooling)
├── tsconfig.electron.json   # TypeScript config (Electron main)
└── vite.config.ts           # Vite configuration
```

## Prerequisites

- **Node.js LTS** (v18 or v20 recommended)
- **npm** (comes with Node.js)
- **Windows 11** (target platform)

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run in development mode:**

   ```bash
   npm run dev
   ```

   This will:
   - Start Vite dev server on `http://localhost:5173`
   - Compile Electron TypeScript main process
   - Launch Electron window (1200×800, titled "AVR QuickLoader V3")
   - Enable hot reload for Vue components
   - Auto-open DevTools

3. **Expected Result:**
   - Desktop window opens with dark background
   - "Hello World" text centered perfectly (Flexbox)
   - Hot reload works—edit `src/App.vue` and see changes instantly

## NPM Scripts

- `npm run dev` - Launch Vite dev server + Electron with hot reload
- `npm run build` - Build Vue renderer and Electron main process for production
- `npm start` - Run the built application (after `npm run build`)

## Development Configuration

### Electron Window

- **Size**: 1200×800 pixels
- **Title**: "AVR QuickLoader V3"
- **Background**: `#1a1a1a` (dark)
- **Node Integration**: Enabled (simplified for development)
- **Context Isolation**: Disabled (will be re-enabled for production)

### Current Features

- ✅ Electron + Vite integration
- ✅ Vue 3 with TypeScript
- ✅ Hot reload for renderer
- ✅ Dark theme baseline
- ✅ Centered Hello World (environment validation)

### Not Implemented (Future Phases)

- ❌ AVR flashing functionality
- ❌ ISP programming interface
- ❌ Serial port communication
- ❌ Hex file parsing
- ❌ UI components/routing
- ❌ Production packaging with electron-builder

## Tech Stack

- **Electron 28** - Desktop application framework
- **Vue 3** - Reactive UI framework (Composition API)
- **TypeScript 5** - Type-safe development
- **Vite 5** - Fast build tool and dev server
- **Node.js LTS** - Runtime environment

## Next Steps

After confirming the environment works:

1. Add Vue Router for navigation
2. Implement serial port detection
3. Create AVR flashing UI
4. Add ISP programming logic
5. Configure electron-builder for Windows installer

## Troubleshooting

**Window doesn't open:**

- Ensure no other process is using port 5173
- Check that all dependencies installed correctly (`npm install`)

**Hot reload not working:**

- Restart with `npm run dev`
- Check Vite dev server is running in console output

**TypeScript errors:**

- Run `npx tsc --noEmit` to check for type errors
- Ensure all `.ts` and `.vue` files are properly typed

## License

MIT
