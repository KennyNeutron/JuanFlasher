import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
console.log("PRELOAD SCRIPT EXECUTING...");

// Use contextBridge to securely expose ipcRenderer methods
contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) =>
      ipcRenderer.invoke(channel, ...args),
    send: (channel: string, ...args: any[]) =>
      ipcRenderer.send(channel, ...args),
    on: (
      channel: string,
      func: (event: IpcRendererEvent, ...args: any[]) => void,
    ) => {
      const subscription = (event: IpcRendererEvent, ...args: any[]) =>
        func(event, ...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    },
    once: (
      channel: string,
      func: (event: IpcRendererEvent, ...args: any[]) => void,
    ) => {
      ipcRenderer.once(channel, (event, ...args) => func(event, ...args));
    },
    removeListener: (
      channel: string,
      func: (event: IpcRendererEvent, ...args: any[]) => void,
    ) => {
      ipcRenderer.removeListener(channel, func);
    },
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    },
  },
});
