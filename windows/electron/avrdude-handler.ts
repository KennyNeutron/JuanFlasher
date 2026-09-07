import { SerialPort } from "serialport";
import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import { app, BrowserWindow, IpcMainInvokeEvent } from "electron";

let runningProcess: ChildProcess | null = null;

export interface PortInfo {
  path: string;
  manufacturer?: string;
  vendorId?: string;
  productId?: string;
}

/**
 * Lists available serial ports
 */
export async function listPorts(): Promise<PortInfo[]> {
  try {
    const ports = await SerialPort.list();
    return ports.map((p) => ({
      path: p.path,
      manufacturer: p.manufacturer,
      vendorId: p.vendorId,
      productId: p.productId,
    }));
  } catch (err) {
    console.error("Failed to list ports:", err);
    return [];
  }
}

/**
 * Spawns the avrdude process with the given arguments
 */
export function spawnAvrdude(
  event: IpcMainInvokeEvent,
  args: string[],
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (runningProcess) {
      reject(new Error("A process is already running."));
      return;
    }

    // Resolve paths strictly relative to app root
    // In production, tools are in extraResources (outside asar)
    // In development, tools are in the project root
    const basePath = app.isPackaged ? process.resourcesPath : app.getAppPath();
    const toolsPath = path.join(basePath, "tools", "avrdude");
    const avrdudeExe = path.join(toolsPath, "avrdude.exe");
    const avrdudeConf = path.join(toolsPath, "avrdude.conf");

    // Ensure we run from the correct directory so libusb0.dll is found
    const spawnOptions = {
      cwd: toolsPath,
    };

    // Construct final args: always inject config path
    const finalArgs = ["-C", avrdudeConf, ...args];

    console.log(`Spawning: ${avrdudeExe} ${finalArgs.join(" ")}`);
    event.sender.send("avrdude-log", `> ${avrdudeExe} ${finalArgs.join(" ")}`);

    runningProcess = spawn(avrdudeExe, finalArgs, spawnOptions);

    if (!runningProcess) {
      reject(new Error("Failed to spawn process"));
      return;
    }

    runningProcess.stdout?.on("data", (data) => {
      const str = data.toString();
      // Stream logging to renderer
      event.sender.send("avrdude-log", str);
    });

    runningProcess.stderr?.on("data", (data) => {
      const str = data.toString();
      // Avrdude sends progress and info to stderr too
      event.sender.send("avrdude-log", str);
    });

    runningProcess.on("close", (code) => {
      runningProcess = null;
      if (code === 0) {
        event.sender.send(
          "avrdude-log",
          `> Process finished with success (Exit Code: 0)`,
        );
        resolve();
      } else {
        const msg = `> Process failed with exit code ${code}`;
        event.sender.send("avrdude-log", msg);
        reject(new Error(msg));
      }
    });

    runningProcess.on("error", (err) => {
      runningProcess = null;
      event.sender.send("avrdude-log", `> Process Error: ${err.message}`);
      reject(err);
    });
  });
}

/**
 * Kills the currently running avrdude process
 */
export function stopAvrdude() {
  if (runningProcess) {
    runningProcess.kill();
    runningProcess = null;
    return true;
  }
  return false;
}
