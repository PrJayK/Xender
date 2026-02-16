use std::fs::File;
use std::io::{self, Error, ErrorKind, Read, Result, Write};
use std::net::{TcpListener, TcpStream};
use std::sync::{Arc, Mutex};

use tauri::{AppHandle, Emitter};
use tokio::sync::oneshot;
use uuid::Uuid;

use crate::app_state::AppState;
use crate::types::transfer::{IncomingTransfer, TransferProgress};

const HEADER_ACCEPTED: u8 = 0x01;
const HEADER_REJECTED: u8 = 0x00;
const TRANSFER_COMPLETE: u8 = 0x02;

pub fn start_receiver(state: Arc<Mutex<AppState>>, app: AppHandle) -> io::Result<()> {
    let listener = TcpListener::bind("0.0.0.0:0")?;

    let port = listener.local_addr()?.port();
    state.lock().unwrap().set_port(port);

    {
        let state = Arc::clone(&state);
        std::thread::spawn(move || {
            let _ = start_listening(state, listener.try_clone().unwrap(), app.clone());
        });
    }

    Ok(())
}

pub fn start_listening(
    state: Arc<Mutex<AppState>>,
    listener: TcpListener,
    app: AppHandle,
) -> Result<()> {
    for stream in listener.incoming() {
        match stream {
            Ok(stream) => {
                let app_handle = app.clone();
                let peer_addr = stream.peer_addr().unwrap().to_string();
                {
                    let state = Arc::clone(&state);
                    std::thread::spawn(move || {
                        if let Err(e) = handle_tcp_connection(state, stream, app_handle.clone()) {
                            if e.kind() == io::ErrorKind::ConnectionReset {
                                let _ = app_handle.emit(
                                    "INCOMING_TRANSFER_FAILED",
                                    format!("Connection reset by peer: {}", peer_addr),
                                );
                            }
                        }
                    });
                }
            }
            Err(e) => {
                return Err(e);
            }
        }
    }

    Ok(())
}

pub fn handle_tcp_connection(
    state: Arc<Mutex<AppState>>,
    mut stream: TcpStream,
    app: AppHandle,
) -> Result<()> {
    let transfer_id = Uuid::new_v4().to_string();
    let (tx, rx) = oneshot::channel::<bool>();

    state
        .lock()
        .unwrap()
        .pending_transfers
        .insert(transfer_id.clone(), tx);

    let peer_device = state
        .lock()
        .unwrap()
        .snapshot()
        .get(&stream.peer_addr().unwrap().ip())
        .unwrap()
        .clone();

    let (filename, file_size) = read_transfer_request(&mut stream)?;

    let _ = app.emit(
        "INCOMING_TRANSFER",
        IncomingTransfer {
            transfer_id: transfer_id.clone(),
            filename: filename.clone(),
            file_size: file_size,
            sender_hostname: peer_device.hostname.clone(),
            sender_ip: peer_device.ip.to_string(),
        },
    );

    let accept = rx.blocking_recv().unwrap_or(false);

    if !accept {
        stream.write_all(&[HEADER_REJECTED])?;
        return Ok(());
    }

    // 3. Send ACCEPT
    stream.write_all(&[HEADER_ACCEPTED])?;

    // 4. Receive file
    receive_file(state, app, &mut stream, transfer_id, filename, file_size)?;

    // 5. Send completion ACK
    stream.write_all(&[TRANSFER_COMPLETE])?;

    Ok(())
}

fn receive_file(
    state: Arc<Mutex<AppState>>,
    app: AppHandle,
    stream: &mut TcpStream,
    transfer_id: String,
    filename: String,
    file_size: u64,
) -> Result<()> {
    let mut file = File::create(state.lock().unwrap().download_dir().join(filename.clone()))?;
    let mut buffer = [0u8; 1024 * 1024];
    let mut received = 0u64;
    let mut last_emitted = 0u64;

    while received < file_size {
        let to_read = std::cmp::min(1024 * 1024, (file_size - received) as usize);
        let n = stream.read(&mut buffer[..to_read])?;
        if n == 0 {
            return Err(Error::new(ErrorKind::UnexpectedEof, "Connection closed"));
        }
        file.write_all(&buffer[..n])?;
        received += n as u64;

        // Emit every ~1MB
        if received - last_emitted >= 1_048_576 || received == file_size {
            last_emitted = received;

            let percent = (received as f32 / file_size as f32) * 100.0;

            let _ = app.emit(
                "INCOMING_TRANSFER_PROGRESS",
                TransferProgress {
                    transfer_id: transfer_id.clone(),
                    percent,
                },
            );
        }
    }

    let _ = app.emit("TRANSFER_COMPLETE", transfer_id.clone());

    Ok(())
}

fn read_transfer_request(stream: &mut TcpStream) -> Result<(String, u64)> {
    let mut len_buf = [0u8; 2];
    stream.read_exact(&mut len_buf)?;
    let name_len = u16::from_be_bytes(len_buf) as usize;

    let mut name_buf = vec![0u8; name_len];
    stream.read_exact(&mut name_buf)?;
    let filename = String::from_utf8(name_buf)
        .map_err(|_| Error::new(ErrorKind::InvalidData, "Invalid filename"))?;

    let mut size_buf = [0u8; 8];
    stream.read_exact(&mut size_buf)?;
    let file_size = u64::from_be_bytes(size_buf);

    Ok((filename, file_size))
}
