import { SerialPort } from "serialport";
import { IpcMainInvokeEvent } from "electron";

let activePort: SerialPort | null = null;

export function connectSerial(
  path: string,
  baudRate: number,
  event: IpcMainInvokeEvent,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    // Close existing if open
    if (activePort && activePort.isOpen) {
      activePort.close();
    }

    try {
      activePort = new SerialPort({ path, baudRate, autoOpen: false });

      activePort.open((err) => {
        if (err) {
          console.error("Error opening serial port: ", err);
          event.sender.send("serial-error", err.message);
          resolve(false);
          return;
        }

        console.log(`Connected to ${path} at ${baudRate}`);

        // Handle incoming data
        activePort?.on("data", (data: Buffer) => {
          event.sender.send("serial-data", data.toString());
        });

        activePort?.on("error", (err) => {
          event.sender.send("serial-error", err.message);
        });

        activePort?.on("close", () => {
          event.sender.send("serial-closed");
          activePort = null;
        });

        resolve(true);
      });
    } catch (e: any) {
      console.error("Exception opening serial port: ", e);
      reject(e);
    }
  });
}

export function disconnectSerial(): Promise<void> {
  return new Promise((resolve) => {
    if (activePort && activePort.isOpen) {
      activePort.close((err) => {
        if (err) console.error("Error closing port", err);
        activePort = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

export function writeSerial(data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!activePort || !activePort.isOpen) {
      reject(new Error("Serial port not open"));
      return;
    }

    activePort.write(data, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
