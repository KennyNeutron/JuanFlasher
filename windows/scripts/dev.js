const { spawn } = require("child_process");
const { createServer } = require("vite");
const electron = require("electron");
const { watch } = require("fs");

const PORT = 5173;
let electronProcess = null;
let isRestarting = false;

async function startVite() {
  const server = await createServer({
    configFile: "./vite.config.ts",
    server: {
      port: PORT,
    },
  });

  await server.listen();
  console.log(`Vite dev server running at http://localhost:${PORT}`);
  return server;
}

function compileElectron() {
  return new Promise((resolve, reject) => {
    const tsc = spawn("npx", ["tsc", "-p", "tsconfig.electron.json"], {
      shell: true,
      stdio: "pipe",
    });

    let output = "";
    tsc.stdout?.on("data", (data) => {
      output += data.toString();
    });

    tsc.stderr?.on("data", (data) => {
      output += data.toString();
    });

    tsc.on("close", (code) => {
      if (code === 0) {
        console.log("✓ Electron main process compiled");
        resolve();
      } else {
        console.error("✗ Electron compilation failed:");
        console.error(output);
        reject(new Error(`TypeScript compilation failed with code ${code}`));
      }
    });
  });
}

function killElectron() {
  return new Promise((resolve) => {
    if (!electronProcess) {
      resolve();
      return;
    }

    electronProcess.removeAllListeners();
    electronProcess.on("close", () => {
      electronProcess = null;
      resolve();
    });

    // Force kill on Windows
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", electronProcess.pid, "/f", "/t"], {
        shell: true,
      });
    } else {
      electronProcess.kill();
    }
  });
}

async function startElectron() {
  if (isRestarting) return;

  await compileElectron();

  electronProcess = spawn(electron, ["."], {
    stdio: "inherit",
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: `http://localhost:${PORT}`,
    },
  });

  electronProcess.on("close", () => {
    if (!isRestarting) {
      process.exit();
    }
  });
}

async function restartElectron() {
  if (isRestarting) return;

  isRestarting = true;
  console.log("\n🔄 Restarting Electron...");

  await killElectron();
  await startElectron();

  isRestarting = false;
}

function watchElectron() {
  let timeout;

  const watcher = watch(
    "./electron",
    { recursive: true },
    async (eventType, filename) => {
      if (filename && filename.endsWith(".ts")) {
        console.log(`\n📝 Detected change in electron/${filename}`);

        // Debounce rapid changes
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
          await restartElectron();
        }, 500);
      }
    },
  );

  console.log("👀 Watching electron/*.ts files for changes...");
  return watcher;
}

async function main() {
  try {
    await startVite();
    await startElectron();
    watchElectron();

    console.log("\n✨ Development server ready!");
    console.log("   - Vite dev server: http://localhost:5173");
    console.log("   - Electron window should now be open");
    console.log("   - Edit electron/*.ts files to auto-restart");
    console.log("   - Edit src/*.vue files for hot reload\n");
  } catch (error) {
    console.error("Error starting dev server:", error);
    process.exit(1);
  }
}

main();
