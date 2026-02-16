use std::net::{Ipv4Addr, UdpSocket};
use std::str;
use std::sync::{Arc, Mutex};

use crate::app_state::AppState;

const DISCOVERY_PORT: u16 = 53029;

pub fn start_receiver(state: Arc<Mutex<AppState>>) -> std::io::Result<()> {
    let socket = UdpSocket::bind(("0.0.0.0", DISCOVERY_PORT))?;

    socket.join_multicast_v4(
        &Ipv4Addr::new(239, 255, 77, 77),
        &Ipv4Addr::UNSPECIFIED,
    )?;

    let mut buf = [0u8; 1024];
    loop {
        let (len, src) = socket.recv_from(&mut buf)?;
        let msg = str::from_utf8(&buf[..len]).unwrap_or("<invalid>");
        let parts: Vec<&str> = msg.split(":").collect();
        
        if parts.len() == 4 && parts[0] == "HERE" {
            let instance_id = parts[1];
            if instance_id == state.lock().unwrap().instance_id() {
                continue; // Ignore messages from self
            }

            let hostname = Some(parts[2].to_string());

            let tcp_port = match parts[3].parse::<u16>() {
                Ok(port) => port,
                Err(_) => continue,
            };

            let mut state = state.lock().unwrap();
            state.upsert_device(src.ip(), hostname.unwrap_or_else(|| "Unknown".to_string()), tcp_port);
        }
    }
}
