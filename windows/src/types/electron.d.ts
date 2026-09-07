export {};

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke: (channel: string, ...args: any[]) => Promise<any>;
        send: (channel: string, ...args: any[]) => void;
        on: (channel: string, callback: (...args: any[]) => void) => void;
        once: (channel: string, callback: (...args: any[]) => void) => void;
        removeListener: (
          channel: string,
          callback: (...args: any[]) => void,
        ) => void;
        removeAllListeners: (channel: string) => void;
      };
    };
  }
}
