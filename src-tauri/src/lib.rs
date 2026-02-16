use std::sync::{Arc, Mutex};

use tauri::Manager;

use crate::app_state::AppState;

mod app_state;
mod application;
mod commands;
mod services;
mod types;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let state: Arc<Mutex<AppState>> = Arc::new(Mutex::new(AppState::new()));
            app.manage(state.clone());
            let _ = application::run_application(app.handle(), state);
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_devices,
            commands::send_file,
            commands::respond_to_transfer_request
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
