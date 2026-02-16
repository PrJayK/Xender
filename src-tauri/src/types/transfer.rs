use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IncomingTransfer {
    pub transfer_id: String,
    pub filename: String,
    pub file_size: u64,
    pub sender_hostname: String,
    pub sender_ip: String
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferProgress {
    pub transfer_id: String,
    pub percent: f32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferAccepted {
    pub transfer_id: String,
    pub accepted: bool,
}