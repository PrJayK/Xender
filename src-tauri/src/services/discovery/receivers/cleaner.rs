use std::sync::{Arc, Mutex};
use crate::app_state::AppState;

pub fn start_cleaner(state: Arc<Mutex<AppState>>) -> std::io::Result<()> {
    loop {
        std::thread::sleep(std::time::Duration::from_secs(2));

        let now = std::time::Instant::now();
        let timeout = std::time::Duration::from_secs(6);

        let mut state = state.lock().unwrap();
        let ips_to_remove: Vec<std::net::IpAddr> = state
            .snapshot()
            .values()
            .into_iter()
            .filter(|device| now.duration_since(device.last_seen) > timeout)
            .map(|device| device.ip)
            .collect();

        for ip in ips_to_remove {
            state.remove_device(ip);
        }
    }
}