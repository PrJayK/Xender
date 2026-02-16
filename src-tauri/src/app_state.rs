use std::collections::HashMap;
use std::net::IpAddr;
use std::path::PathBuf;
use std::time::Instant;
use serde::Serialize;
use tokio::sync::oneshot;

#[derive(Debug, Clone)]
pub struct Device {
    pub ip: IpAddr,
    pub hostname: String,
    pub tcp_port: u16,
    pub last_seen: Instant,
}

#[derive(Debug, Clone, Serialize)]
pub struct DeviceDto {
    pub ip: String,
    pub hostname: String,
}

impl Device {
    pub fn to_dto(&self) -> DeviceDto {
        DeviceDto {
            ip: self.ip.to_string(),
            hostname: self.hostname.clone(),
        }
    }
}

#[derive(Debug)]
pub struct AppState {
    instance_id: String,
    port: u16,
    devices: HashMap<IpAddr, Device>,
    pub pending_transfers: HashMap<String, oneshot::Sender<bool>>,
    download_directory: PathBuf,
}

impl AppState {
    pub fn new() -> Self {        
        let download_dir = dirs::download_dir()
            .unwrap_or_else(|| std::env::current_dir().unwrap());

        Self {
            instance_id: String::new(),
            port: 0,
            devices: HashMap::new(),
            pending_transfers: HashMap::new(),
            download_directory: download_dir,
        }
    }

    pub fn instance_id(&self) -> &str {
        &self.instance_id
    }
    
    pub fn download_dir(&self) -> &PathBuf {
        &self.download_directory
    }

    // pub fn set_download_dir<P: Into<PathBuf>>(&mut self, path: P) {
    //     self.download_directory = path.into();
    // }

    pub fn set_instance_id(&mut self, id: String) {
        self.instance_id = id;
    }

    pub fn port(&self) -> u16 {
        self.port
    }

    pub fn set_port(&mut self, port: u16) {
        self.port = port;
    }

    pub fn upsert_device(&mut self, ip: IpAddr, hostname: String, tcp_port: u16) {
        self.devices.insert(
            ip,
            Device {
                ip,
                hostname,
                tcp_port,
                last_seen: Instant::now(),
            },
        );
    }

    pub fn remove_device(&mut self, ip: IpAddr) {
        self.devices.remove(&ip);
    }

    pub fn snapshot(&self) -> HashMap<IpAddr, Device> {
        self.devices.clone()
    }

    pub fn snapshot_dto(&self) -> Vec<DeviceDto> {
        self.devices.values().map(|d| d.to_dto()).collect()
    }
}
