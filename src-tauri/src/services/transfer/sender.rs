use std::fs::File;
use std::io::{self, Read, Write};
use std::net::TcpStream;
use std::path::Path;
use std::sync::{Arc, Mutex};

use tauri::{AppHandle, Emitter};
use uuid::Uuid;

use crate::app_state::AppState;
use crate::types::transfer::{TransferAccepted, TransferProgress};

const HEADER_ACCEPTED: u8 = 0x01;
const HEADER_REJECTED: u8 = 0x00;
const TRANSFER_COMPLETE: u8 = 0x02;

pub fn send_file(
    app: AppHandle,
    state: Arc<Mutex<AppState>>,
    receiver_ip: &str,
    file_path: &Path,
) -> io::Result<()> {
    let mut file = File::open(file_path)?;
    let metadata = file.metadata()?;
    let file_size = metadata.len();

    let filename = file_path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "Invalid filename"))?;

    let filename_bytes = filename.as_bytes();
    let filename_len = filename_bytes.len() as u16;

    let transfer_id = Uuid::new_v4().to_string();

    let receiver_port = state
        .lock()
        .unwrap()
        .snapshot()
        .get(&receiver_ip.parse().unwrap())
        .unwrap()
        .clone()
        .tcp_port;

    let mut stream = TcpStream::connect(format!("{}:{}", receiver_ip, receiver_port))?;
    stream.set_nodelay(true)?;

    
    send_header(&mut stream, filename_len, filename_bytes, file_size)?;

    wait_for_permission(app.clone(), &mut stream, transfer_id.clone())?;

    send_file_bytes(app.clone(), &mut stream, transfer_id.clone(), &mut file, file_size)?;

    wait_for_completion(&mut stream)?;

    Ok(())
}

fn send_header(
    stream: &mut TcpStream,
    filename_len: u16,
    filename_bytes: &[u8],
    file_size: u64,
) -> io::Result<()> {
    stream.write_all(&filename_len.to_be_bytes())?;
    stream.write_all(filename_bytes)?;
    stream.write_all(&file_size.to_be_bytes())?;

    Ok(())
}

fn wait_for_permission(app: AppHandle, stream: &mut TcpStream, transfer_id: String) -> io::Result<()> {
    let mut response = [0u8; 1];
    stream.read_exact(&mut response)?;

    match response[0] {
        HEADER_ACCEPTED => {
            Ok(())
        }
        HEADER_REJECTED => {

            let _ = app.emit(
                "OUTGOING_TRANSFER_REJECTED",
                TransferAccepted {
                    transfer_id: transfer_id.clone(),
                    accepted: false,
                },
            );

            Err(io::Error::new(
                io::ErrorKind::PermissionDenied,
                "Receiver rejected transfer",
            ))
        }
        other => Err(io::Error::new(
            io::ErrorKind::InvalidData,
            format!("Invalid permission byte: {}", other),
        )),
    }
}

fn send_file_bytes(
    app: AppHandle,
    stream: &mut TcpStream,
    transfer_id: String,
    file: &mut File,
    file_size: u64,
) -> io::Result<()> {
    let mut buffer = [0u8; 1024 * 1024]; // 1 MB
    let mut sent: u64 = 0;
    let mut last_emitted: u64 = 0;

    while sent < file_size {
        let n = file.read(&mut buffer)?;
        if n == 0 {
            break;
        }

        stream.write_all(&buffer[..n])?;
        sent += n as u64;

        if sent - last_emitted >= 1_048_576 || sent == file_size {
            last_emitted = sent;
            let percent = (sent as f32 / file_size as f32) * 100.0;

            let _ = app.emit(
                "OUTGOING_TRANSFER_PROGRESS",
                TransferProgress {
                    transfer_id: transfer_id.clone(),
                    percent,
                },
            );
        }
    }

    if sent != file_size {
        
        return Err(io::Error::new(
            io::ErrorKind::UnexpectedEof,
            "File read incomplete",
        ));
    }

    Ok(())
}

fn wait_for_completion(stream: &mut TcpStream) -> io::Result<()> {
    let mut response = [0u8; 1];
    stream.read_exact(&mut response)?;

    if response[0] != TRANSFER_COMPLETE {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "Transfer completion not acknowledged",
        ));
    }

    Ok(())
}
