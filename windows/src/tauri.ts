import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";

export interface PortInfo {
  path: string;
  manufacturer?: string;
  vendorId?: string;
  productId?: string;
}

export const native = {
  listPorts: () => invoke<PortInfo[]>("list_ports"),
  uploadFirmware: (args: { port: string; hexPath: string; mcu: string; baud: string }) => invoke<void>("upload_firmware", { args }),
  ispUpload: (args: { programmer: string; hexPath: string; mcu: string; port: string }) => invoke<void>("isp_upload", { args }),
  burnBootloader: (args: { programmer: string; mcu: string; port: string }) => invoke<void>("burn_bootloader", { args }),
  testWiring: (args: { programmer: string; mcu: string; port: string }) => invoke<void>("test_wiring", { args }),
  stopOperation: () => invoke<boolean>("stop_operation"),
  serialConnect: (port: string, baud: number) => invoke<boolean>("serial_connect", { port, baud }),
  serialDisconnect: () => invoke<boolean>("serial_disconnect"),
  serialWrite: (data: string) => invoke<boolean>("serial_write", { data }),
  saveCloudFirmware: (fileName: string, base64Data: string) => invoke<string>("save_cloud_firmware", { fileName, base64Data }),
  clearFirmwareCache: () => invoke<boolean>("clear_firmware_cache"),
  openHexFile: () => open({ multiple: false, directory: false, filters: [{ name: "Hex Files", extensions: ["hex"] }] }),
};

export const subscribeNativeEvents = async (handlers: {
  onSerialData: (data: string) => void;
  onSerialError: (message: string) => void;
  onSerialClosed: () => void;
}): Promise<UnlistenFn[]> => Promise.all([
  listen<string>("serial-data", ({ payload }) => handlers.onSerialData(payload)),
  listen<string>("serial-error", ({ payload }) => handlers.onSerialError(payload)),
  listen("serial-closed", () => handlers.onSerialClosed()),
]);
