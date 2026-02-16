use std::io;
use std::sync::{Arc, Mutex};

use crate::app_state::{AppState, DeviceDto};
use crate::services::transfer::sender;
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub fn get_devices(state: State<Arc<Mutex<AppState>>>) -> Vec<DeviceDto> {
    let state = state.lock().unwrap();
    state.snapshot_dto()
}

#[tauri::command]
pub fn send_file(
    app: AppHandle,
    state: State<'_, Arc<Mutex<AppState>>>,
    device_ip: String,
    file_path: String,
) -> Result<(), String> {
    let path = std::path::PathBuf::from(file_path);

    let state = state.inner().clone();
    // spawn background task
    std::thread::spawn(move || {
        if let Err(e) = sender::send_file(app.clone(), state, &device_ip, &path) {
            if e.kind() == io::ErrorKind::ConnectionReset {
                let _ = app.emit(
                    "OUTGOING_TRANSFER_FAILED",
                    format!("Connection reset by peer: {}", device_ip),
                );
            }
        }

    });

    Ok(())
}

#[tauri::command]
pub fn respond_to_transfer_request(
    transfer_id: String,
    accepted: bool,
    state: tauri::State<'_, Arc<Mutex<AppState>>>,
) {
    if let Some(tx) = state.lock().unwrap().pending_transfers.remove(&transfer_id) {
        let _ = tx.send(accepted);
    }
}
