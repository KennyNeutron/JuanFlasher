import { app, BrowserWindow, ipcMain, dialog, Menu, nativeImage } from "electron";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import * as crypto from "crypto";
import { listPorts, spawnAvrdude, stopAvrdude } from "./avrdude-handler.js";
import {
  connectSerial,
  disconnectSerial,
  writeSerial,
} from "./serial-handler.js";
import { readFileSync } from "fs";

// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// In CommonJS, __dirname is available globally or injected by wrapper
const packageJsonPath = path.join(__dirname, "../package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const APP_VERSION = packageJson.version;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const iconPath = path.join(__dirname, "../assets/juanrobotix_icon.ico");
  const appIcon = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    title: `Juan Flasher v${APP_VERSION} | By KennyNeutron`,
    icon: appIcon,
    backgroundColor: "#1a1a1a",
    webPreferences: {
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  console.log("Main process __dirname:", __dirname);
  console.log("Preload path:", path.join(__dirname, "preload.js"));

  // Load from Vite dev server in development, or from built files in production
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Prevent the renderer from changing the window title
  mainWindow.on("page-title-updated", (e) => {
    e.preventDefault();
  });

  // Set custom menu to remove Help contents
  const template: any[] = [
    {
      label: "File",
      submenu: [{ role: "quit" }],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // --- IPC Handlers ---

  // 1. List Ports
  ipcMain.handle("list-ports", async () => {
    return await listPorts();
  });

  // 2. Upload Firmware (UART)
  ipcMain.handle(
    "upload-firmware",
    async (event, { port, hexPath, mcu, baud }) => {
      const args = [
        "-v",
        "-p",
        mcu || "m328p",
        "-c",
        "arduino",
        "-P",
        port,
        "-b",
        baud || "115200",
        "-D", // Disable auto erase for arduino
        "-U",
        `flash:w:${hexPath}:i`,
      ];
      return await spawnAvrdude(event, args);
    },
  );

  // 3. ISP Upload (USBTiny/ASP)
  ipcMain.handle(
    "isp-upload",
    async (event, { programmer, hexPath, mcu, port }) => {
      // Programmer mapping
      const progType =
        programmer === "USBtinyISP"
          ? "usbtiny"
          : programmer === "AVRISP mkII"
            ? "avrispmkII"
            : "stk500v1"; // Arduino as ISP

      const args = ["-v", "-p", mcu || "m328p", "-c", progType];

      // Add port for Arduino as ISP
      if (programmer === "Arduino as ISP" && port) {
        args.push("-P", port, "-b", "19200");
      }

      // For AVRISP mkII, use USB
      if (progType === "avrispmkII") {
        args.push("-P", "usb");
      }

      // Add flash write command
      args.push("-U", `flash:w:${hexPath}:i`);

      return await spawnAvrdude(event, args);
    },
  );

  // 4. Burn Bootloader
  ipcMain.handle(
    "burn-bootloader",
    async (event, { programmer, mcu, port }) => {
      // In production, tools are in extraResources (outside asar)
      // In development, tools are in the project root
      const basePath = app.isPackaged
        ? process.resourcesPath
        : app.getAppPath();
      // Assuming folder structure is tools/bootloaders/atmega328p/optiboot.hex
      // We will default to m328p for now
      const bootloaderPath = path.join(
        basePath,
        "tools",
        "bootloaders",
        "atmega328p",
        "optiboot.hex",
      );

      let progType = "usbtiny";
      let extraArgs: string[] = [];

      if (programmer === "Arduino as ISP") {
        progType = "stk500v1";
        if (port) {
          extraArgs.push("-P", port, "-b", "19200");
        }
      } else if (programmer === "AVRISP mkII") {
        progType = "avrispmkII";
        extraArgs.push("-P", "usb");
      }

      const args = [
        "-v",
        "-p",
        mcu || "m328p",
        "-c",
        progType,
        ...extraArgs,
        // Set fuses for 16MHz external crystal and bootloader
        "-U",
        "lfuse:w:0xFF:m", // Low fuse: 16MHz ext crystal, slow startup
        "-U",
        "hfuse:w:0xDE:m", // High fuse: 2KB bootloader, EESAVE enabled
        "-U",
        "efuse:w:0xFD:m", // Extended fuse: BOD 2.7V
        // Write bootloader
        "-U",
        `flash:w:${bootloaderPath}:i`,
      ];
      return await spawnAvrdude(event, args);
    },
  );

  // 5. Test Wiring
  ipcMain.handle("test-wiring", async (event, { programmer, mcu, port }) => {
    let progType = "usbtiny";
    let extraArgs: string[] = [];

    if (programmer === "Arduino as ISP") {
      progType = "stk500v1";
      if (port) {
        extraArgs.push("-P", port, "-b", "19200");
      }
    } else if (programmer === "AVRISP mkII") {
      progType = "avrispmkII";
      extraArgs.push("-P", "usb");
    }

    const args = ["-c", progType, "-p", mcu || "m328p", ...extraArgs];
    return await spawnAvrdude(event, args);
  });

  // 6. Stop Operation
  ipcMain.handle("stop-operation", () => {
    const killed = stopAvrdude();
    return killed;
  });

  // 7. Serial Monitor
  ipcMain.handle("serial-connect", async (event, { port, baud }) => {
    const br = parseInt(baud);
    return await connectSerial(port, isNaN(br) ? 115200 : br, event);
  });

  ipcMain.handle("serial-disconnect", async () => {
    await disconnectSerial();
    return true;
  });

  ipcMain.handle("serial-write", async (event, data) => {
    try {
      await writeSerial(data);
      return true;
    } catch (err: any) {
      throw new Error(err.message);
    }
  });

  // 8. Open File Dialog
  ipcMain.handle("dialog:open-file", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Hex Files", extensions: ["hex"] }],
    });
    if (result.canceled) {
      return null;
    } else {
      return result.filePaths[0];
    }
  });

  // 9. Save Cloud Firmware to temp file (returns local path for avrdude)
  //    Uses a randomized temp directory to prevent path prediction by other processes.
  ipcMain.handle("save-cloud-firmware", async (_event, { fileName, base64Data }: { fileName: string; base64Data: string }) => {
    const randomId = crypto.randomBytes(16).toString("hex");
    const tempDir = path.join(os.tmpdir(), `jf-${randomId}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
    return filePath;
  });

  // 10. Clear cached cloud firmware files
  //    Cleans up all randomized jf-* temp directories to prevent firmware exposure.
  ipcMain.handle("clear-firmware-cache", async () => {
    const tmpDir = os.tmpdir();
    try {
      const entries = fs.readdirSync(tmpDir);
      for (const entry of entries) {
        if (entry.startsWith("jf-")) {
          const dirPath = path.join(tmpDir, entry);
          try {
            fs.rmSync(dirPath, { recursive: true, force: true });
          } catch {}
        }
      }
    } catch {}
    return true;
  });

  mainWindow.on("closed", () => {
    stopAvrdude();
    disconnectSerial();
  });
}

if (process.platform === 'win32') {
  app.setAppUserModelId("com.kennyneutron.juan-flasher");
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
