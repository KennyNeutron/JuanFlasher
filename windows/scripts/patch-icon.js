/**
 * Patches the dev electron.exe with the app's custom icon.
 * Runs automatically via postinstall so the taskbar shows
 * the correct icon during development on Windows.
 */
const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");

if (process.platform !== "win32") {
  console.log("⏭  Icon patching skipped (not Windows)");
  process.exit(0);
}

const electronExe = path.join(
  __dirname,
  "..",
  "node_modules",
  "electron",
  "dist",
  "electron.exe",
);

const rcedit = path.join(
  __dirname,
  "..",
  "node_modules",
  "electron-winstaller",
  "vendor",
  "rcedit.exe",
);

const icon = path.join(__dirname, "..", "assets", "juanrobotix_icon.ico");

if (!fs.existsSync(electronExe)) {
  console.log("⏭  electron.exe not found, skipping icon patch");
  process.exit(0);
}

if (!fs.existsSync(rcedit)) {
  console.log("⏭  rcedit.exe not found, skipping icon patch");
  process.exit(0);
}

if (!fs.existsSync(icon)) {
  console.log("⏭  juanrobotix_icon.ico not found, skipping icon patch");
  process.exit(0);
}

try {
  execFileSync(rcedit, [electronExe, "--set-icon", icon]);
  console.log("✓ Patched electron.exe with juanrobotix icon");
} catch (err) {
  console.error("⚠  Failed to patch electron.exe icon:", err.message);
}
