use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use rand::{distributions::Alphanumeric, Rng};
use serde::Serialize;
use serialport::SerialPort;
use std::{
    fs,
    io::{Read, Write},
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::{Arc, Mutex},
    thread,
    time::Duration,
};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;
use tauri::{AppHandle, Emitter, Manager, State};
use thiserror::Error;

#[derive(Debug, Error)]
enum CommandError {
    #[error("{0}")]
    Message(String),
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
}

impl Serialize for CommandError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

type Result<T> = std::result::Result<T, CommandError>;

type ProcessState = Arc<Mutex<Option<Child>>>;
type SerialState = Arc<Mutex<Option<Box<dyn SerialPort>>>>;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PortInfo {
    pub path: String,
    pub manufacturer: Option<String>,
    pub vendor_id: Option<String>,
    pub product_id: Option<String>,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FirmwareArgs {
    port: String,
    hex_path: String,
    mcu: String,
    baud: String,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IspArgs {
    programmer: String,
    hex_path: String,
    mcu: String,
    port: String,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgrammerArgs {
    programmer: String,
    mcu: String,
    port: String,
}

fn validate_mcu(mcu: &str) -> Result<()> {
    if matches!(mcu, "m328p" | "atmega328p") {
        Ok(())
    } else {
        Err(CommandError::Message("Unsupported MCU".into()))
    }
}

fn validate_port(port: &str) -> Result<()> {
    if port.is_empty() || port.len() > 64 || port.contains(['\\', '/', ':', '"']) {
        Err(CommandError::Message("Invalid serial port".into()))
    } else {
        Ok(())
    }
}

fn validate_hex_path(path: &str) -> Result<PathBuf> {
    let path = PathBuf::from(path);
    if path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.eq_ignore_ascii_case("hex"))
        != Some(true)
    {
        return Err(CommandError::Message(
            "Only .hex firmware files are supported".into(),
        ));
    }
    let canonical = fs::canonicalize(&path)
        .map_err(|_| CommandError::Message("Firmware file does not exist".into()))?;
    if !canonical.is_file() {
        return Err(CommandError::Message("Firmware path is not a file".into()));
    }
    Ok(canonical)
}

fn resource_root(app: &AppHandle) -> Result<PathBuf> {
    let mut candidates = Vec::new();

    if let Ok(resource_dir) = app.path().resource_dir() {
        candidates.push(resource_dir.clone());
        // Tauri external resources can be staged beneath `_up_` during
        // development and in some packaged layouts.
        candidates.push(resource_dir.join("_up_"));
    }

    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent() {
            candidates.push(parent.to_path_buf());
            candidates.push(parent.join("_up_"));
            if let Some(grandparent) = parent.parent() {
                candidates.push(grandparent.to_path_buf());
                candidates.push(grandparent.join("_up_"));
            }
        }
    }

    if let Ok(cwd) = std::env::current_dir() {
        candidates.push(cwd.clone());
        if let Some(parent) = cwd.parent() {
            candidates.push(parent.to_path_buf());
        }
    }

    for candidate in &candidates {
        if candidate
            .join("tools")
            .join("avrdude")
            .join("avrdude.exe")
            .is_file()
            && candidate
                .join("tools")
                .join("avrdude")
                .join("avrdude.conf")
                .is_file()
        {
            return Ok(candidate.clone());
        }
    }

    let checked = candidates
        .iter()
        .map(|path| path.display().to_string())
        .collect::<Vec<_>>()
        .join("; ");
    Err(CommandError::Message(format!(
        "Unable to locate bundled AVRDUDE tools. Checked: {checked}"
    )))
}

fn drain_avrdude_output<R>(mut stream: R)
where
    R: Read + Send + 'static,
{
    thread::spawn(move || {
        let mut buf = [0_u8; 4096];
        loop {
            match stream.read(&mut buf) {
                Ok(0) | Err(_) => break,
                Ok(_) => {}
            }
        }
    });
}

fn run_avrdude(app: &AppHandle, state: &State<'_, ProcessState>, args: Vec<String>) -> Result<()> {
    let root = resource_root(app)?;
    let tools = root.join("tools").join("avrdude");
    let exe = tools.join("avrdude.exe");
    let conf = tools.join("avrdude.conf");
    if !exe.exists() || !conf.exists() {
        return Err(CommandError::Message("AVRDUDE files are missing".into()));
    }
    let mut guard = state
        .lock()
        .map_err(|_| CommandError::Message("AVRDUDE state unavailable".into()))?;
    if guard.is_some() {
        return Err(CommandError::Message(
            "A process is already running.".into(),
        ));
    }
    let final_args = [
        &["-C".to_string(), conf.to_string_lossy().into_owned()][..],
        args.as_slice(),
    ]
    .concat();
    let mut command = Command::new(&exe);
    command
        .args(&final_args)
        .current_dir(&tools)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    #[cfg(windows)]
    command.creation_flags(CREATE_NO_WINDOW);

    let mut child = command.spawn()?;
    if let Some(stream) = child.stdout.take() {
        drain_avrdude_output(stream);
    }
    if let Some(stream) = child.stderr.take() {
        drain_avrdude_output(stream);
    }
    *guard = Some(child);
    drop(guard);

    let status = loop {
        let maybe_status = {
            let mut process = state
                .lock()
                .map_err(|_| CommandError::Message("AVRDUDE state unavailable".into()))?;
            match process.as_mut() {
                Some(child) => child.try_wait()?,
                None => return Err(CommandError::Message("AVRDUDE process stopped".into())),
            }
        };
        if let Some(status) = maybe_status {
            let mut process = state
                .lock()
                .map_err(|_| CommandError::Message("AVRDUDE state unavailable".into()))?;
            process.take();
            break status;
        }
        thread::sleep(Duration::from_millis(50));
    };

    if status.success() {
        Ok(())
    } else {
        Err(CommandError::Message(format!(
            "AVRDUDE failed with exit code {:?}",
            status.code()
        )))
    }
}

fn programmer_type(programmer: &str) -> Result<&'static str> {
    match programmer {
        "USBtinyISP" => Ok("usbtiny"),
        "AVRISP mkII" => Ok("avrispmkII"),
        "Arduino as ISP" => Ok("stk500v1"),
        _ => Err(CommandError::Message("Unsupported programmer".into())),
    }
}

#[tauri::command]
fn list_ports() -> Vec<PortInfo> {
    serialport::available_ports()
        .unwrap_or_default()
        .into_iter()
        .map(|p| match p.port_type {
            serialport::SerialPortType::UsbPort(info) => PortInfo {
                path: p.port_name,
                manufacturer: info.manufacturer,
                vendor_id: Some(info.vid.to_string()),
                product_id: Some(info.pid.to_string()),
            },
            _ => PortInfo {
                path: p.port_name,
                manufacturer: None,
                vendor_id: None,
                product_id: None,
            },
        })
        .collect()
}

#[tauri::command]
fn upload_firmware(
    app: AppHandle,
    state: State<'_, ProcessState>,
    args: FirmwareArgs,
) -> Result<()> {
    validate_port(&args.port)?;
    validate_mcu(&args.mcu)?;
    let hex = validate_hex_path(&args.hex_path)?;
    let baud = args
        .baud
        .parse::<u32>()
        .map_err(|_| CommandError::Message("Invalid baud rate".into()))?;
    run_avrdude(
        &app,
        &state,
        vec![
            "-v".into(),
            "-p".into(),
            args.mcu,
            "-c".into(),
            "arduino".into(),
            "-P".into(),
            args.port,
            "-b".into(),
            baud.to_string(),
            "-D".into(),
            "-U".into(),
            format!("flash:w:{}:i", hex.display()),
        ],
    )
}

#[tauri::command]
fn isp_upload(app: AppHandle, state: State<'_, ProcessState>, args: IspArgs) -> Result<()> {
    validate_mcu(&args.mcu)?;
    let hex = validate_hex_path(&args.hex_path)?;
    let prog = programmer_type(&args.programmer)?;
    let mut av = vec!["-v".into(), "-p".into(), args.mcu, "-c".into(), prog.into()];
    if args.programmer == "Arduino as ISP" {
        validate_port(&args.port)?;
        av.extend(["-P".into(), args.port, "-b".into(), "19200".into()]);
    }
    if args.programmer == "AVRISP mkII" {
        av.extend(["-P".into(), "usb".into()]);
    }
    av.extend(["-U".into(), format!("flash:w:{}:i", hex.display())]);
    run_avrdude(&app, &state, av)
}

#[tauri::command]
fn burn_bootloader(
    app: AppHandle,
    state: State<'_, ProcessState>,
    args: ProgrammerArgs,
) -> Result<()> {
    validate_mcu(&args.mcu)?;
    let root = resource_root(&app)?;
    let boot = root.join("tools/bootloaders/atmega328p/optiboot.hex");
    if !boot.exists() {
        return Err(CommandError::Message("Bootloader file is missing".into()));
    }
    let prog = programmer_type(&args.programmer)?;
    let mut av = vec!["-v".into(), "-p".into(), args.mcu, "-c".into(), prog.into()];
    if args.programmer == "Arduino as ISP" {
        validate_port(&args.port)?;
        av.extend(["-P".into(), args.port, "-b".into(), "19200".into()]);
    }
    if args.programmer == "AVRISP mkII" {
        av.extend(["-P".into(), "usb".into()]);
    }
    av.extend([
        "-U".into(),
        "lfuse:w:0xFF:m".into(),
        "-U".into(),
        "hfuse:w:0xDE:m".into(),
        "-U".into(),
        "efuse:w:0xFD:m".into(),
        "-U".into(),
        format!("flash:w:{}:i", boot.display()),
    ]);
    run_avrdude(&app, &state, av)
}

#[tauri::command]
fn test_wiring(app: AppHandle, state: State<'_, ProcessState>, args: ProgrammerArgs) -> Result<()> {
    validate_mcu(&args.mcu)?;
    let prog = programmer_type(&args.programmer)?;
    let mut av = vec!["-c".into(), prog.into(), "-p".into(), args.mcu];
    if args.programmer == "Arduino as ISP" {
        validate_port(&args.port)?;
        av.extend(["-P".into(), args.port, "-b".into(), "19200".into()]);
    }
    if args.programmer == "AVRISP mkII" {
        av.extend(["-P".into(), "usb".into()]);
    }
    run_avrdude(&app, &state, av)
}

#[tauri::command]
fn stop_operation(state: State<'_, ProcessState>) -> bool {
    state
        .lock()
        .ok()
        .and_then(|mut g| g.take())
        .map(|mut child| child.kill().is_ok())
        .unwrap_or(false)
}

#[tauri::command]
fn serial_connect(
    app: AppHandle,
    state: State<'_, SerialState>,
    port: String,
    baud: u32,
) -> Result<bool> {
    validate_port(&port)?;
    let serial = serialport::new(&port, baud)
        .timeout(Duration::from_millis(100))
        .open()
        .map_err(|e| CommandError::Message(e.to_string()))?;
    let reader = serial
        .try_clone()
        .map_err(|e| CommandError::Message(e.to_string()))?;
    *state
        .lock()
        .map_err(|_| CommandError::Message("Serial state unavailable".into()))? = Some(serial);
    thread::spawn(move || {
        let mut reader = reader;
        let mut buf = [0_u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(n) if n > 0 => {
                    let _ = app.emit(
                        "serial-data",
                        String::from_utf8_lossy(&buf[..n]).to_string(),
                    );
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => {}
                Err(e) => {
                    let _ = app.emit("serial-error", e.to_string());
                    let _ = app.emit("serial-closed", ());
                    break;
                }
                _ => {}
            }
        }
    });
    Ok(true)
}

#[tauri::command]
fn serial_disconnect(app: AppHandle, state: State<'_, SerialState>) -> Result<bool> {
    let _ = state
        .lock()
        .map_err(|_| CommandError::Message("Serial state unavailable".into()))?
        .take();
    let _ = app.emit("serial-closed", ());
    Ok(true)
}

#[tauri::command]
fn serial_write(state: State<'_, SerialState>, data: String) -> Result<bool> {
    let mut guard = state
        .lock()
        .map_err(|_| CommandError::Message("Serial state unavailable".into()))?;
    let port = guard
        .as_mut()
        .ok_or_else(|| CommandError::Message("Serial port not open".into()))?;
    port.write_all(data.as_bytes())?;
    Ok(true)
}

#[tauri::command]
fn save_cloud_firmware(file_name: String, base64_data: String) -> Result<String> {
    let name = Path::new(&file_name)
        .file_name()
        .and_then(|n| n.to_str())
        .filter(|n| n.ends_with(".hex"))
        .ok_or_else(|| CommandError::Message("Invalid firmware filename".into()))?;
    let dir = std::env::temp_dir().join(format!(
        "jf-{}",
        rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(32)
            .map(char::from)
            .collect::<String>()
    ));
    fs::create_dir_all(&dir)?;
    let path = dir.join(name);
    fs::write(
        &path,
        BASE64
            .decode(base64_data)
            .map_err(|_| CommandError::Message("Invalid firmware data".into()))?,
    )?;
    Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]
fn clear_firmware_cache() -> Result<bool> {
    for entry in fs::read_dir(std::env::temp_dir())? {
        let path = entry?.path();
        if path
            .file_name()
            .and_then(|n| n.to_str())
            .map(|n| n.starts_with("jf-"))
            .unwrap_or(false)
            && path.is_dir()
        {
            let _ = fs::remove_dir_all(path);
        }
    }
    Ok(true)
}

pub fn run() {
    let process_state: ProcessState = Arc::new(Mutex::new(None));
    let serial_state: SerialState = Arc::new(Mutex::new(None));
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(process_state)
        .manage(serial_state)
        .invoke_handler(tauri::generate_handler![
            list_ports,
            upload_firmware,
            isp_upload,
            burn_bootloader,
            test_wiring,
            stop_operation,
            serial_connect,
            serial_disconnect,
            serial_write,
            save_cloud_firmware,
            clear_firmware_cache
        ])
        .run(tauri::generate_context!())
        .expect("error while running Juan Flasher");
}
