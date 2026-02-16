use std::net::UdpSocket;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use crate::app_state::AppState;

pub fn start_transmitter(state: Arc<Mutex<AppState>>) -> std::io::Result<()> {
    let hostname = hostname::get()
        .unwrap_or_default()
        .to_string_lossy()
        .into_owned();

    const DISCOVERY_PORT: u16 = 53029;
    let message = {
        let state = state.lock().unwrap();
        format!("HERE:{}:{hostname}:{}", state.instance_id(), state.port())
    };
    let socket = UdpSocket::bind("0.0.0.0:0")?;

    socket.set_broadcast(true)?;

    let broadcast_addr = format!("255.255.255.255:{}", DISCOVERY_PORT);

    loop {
        socket.send_to(message.as_bytes(), &broadcast_addr)?;
        std::thread::sleep(Duration::from_secs(2));
    }
}
