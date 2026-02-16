
use std::sync::{Arc, Mutex};
use tauri::{AppHandle};
use uuid::Uuid;

use crate::app_state::AppState;
use crate::services::discovery;
use crate::services::transfer;

pub fn run_application(app: &AppHandle, state: Arc<Mutex<AppState>>) -> std::io::Result<()> {

    let instance_id = Uuid::new_v4().to_string();
    {
        let mut state = state.lock().unwrap();
        state.set_instance_id(instance_id);
    }

    transfer::receiver::start_receiver(Arc::clone(&state), app.clone())?;

    {
        let state = Arc::clone(&state);
        std::thread::spawn(move || {
            discovery::receivers::receiver::start_receiver(state).unwrap();
        });
    }

    {
        let state = Arc::clone(&state);
        std::thread::spawn(move || {
            discovery::receivers::cleaner::start_cleaner(state).unwrap();
        });
    }

    {
        let state = Arc::clone(&state);
        std::thread::spawn(move || {
            discovery::transmitters::broadcast::start_transmitter(state).unwrap();
        });
    }

    {
        let state = Arc::clone(&state);
        std::thread::spawn(move || {
            discovery::transmitters::multicast::start_transmitter(state).unwrap();
        });
    }

    Ok(())
}
