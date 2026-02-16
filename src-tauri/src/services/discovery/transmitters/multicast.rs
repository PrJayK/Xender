use std::net::{Ipv4Addr, UdpSocket};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use crate::app_state::AppState;

pub fn start_transmitter(state: Arc<Mutex<AppState>>) -> std::io::Result<()> {
    let hostname = hostname::get()
        .unwrap_or_default()
        .to_string_lossy()
        .into_owned();

    const DISCOVERY_PORT: u16 = 53029;
    let multicast_ip = Ipv4Addr::new(239, 255, 77, 77);
    let message = {
        let state = state.lock().unwrap();
        format!("HERE:{}:{hostname}:{}", state.instance_id(), state.port())
    };
    let socket = UdpSocket::bind("0.0.0.0:0")?;

    socket.set_multicast_ttl_v4(1)?;

    socket.set_multicast_loop_v4(true)?;

    let multicast_addr = (multicast_ip, DISCOVERY_PORT);

    loop {
        socket.send_to(message.as_bytes(), multicast_addr)?;
        std::thread::sleep(Duration::from_secs(2));
    }
}
