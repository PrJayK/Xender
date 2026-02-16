# 📁 LAN File Sharing App (Rust + Tauri)

A lightweight, fast, cross-platform desktop application for **sharing files directly over a Local Area Network (LAN)**.

Built using **Rust** for performance and safety, and **Tauri** for a minimal and efficient desktop UI.

This project allows devices connected to the same network to automatically discover each other and transfer files seamlessly — with **no cloud, no external servers, and no middleman**.

---

## 🚀 Features

- 🔍 **Automatic LAN Discovery**  
  Devices on the same Wi-Fi/LAN detect each other in real time using UDP broadcast.

- 📤 **Direct Peer-to-Peer File Transfer**  
  Files are transferred directly between devices using TCP sockets.

- ⚡ **Fast & Lightweight**  
  Powered by Rust with minimal overhead compared to Electron-based alternatives.

- 🖥 **Cross-Platform Support**  
  Works on Windows, Linux, and macOS via Tauri.

- 🔒 **Fully Local Transfers**  
  Everything happens inside your network — no uploads to third-party services.

---

## 🛠 Tech Stack

| Layer              | Technology |
|-------------------|------------|
| Backend            | Rust       |
| Desktop Framework  | Tauri      |
| Device Discovery   | UDP Broadcast |
| File Transfer      | TCP Streaming |
| Frontend UI        | Tauri WebView (HTML/JS/React) |

---

## 📡 How It Works

### 1. LAN Discovery (UDP)

Each device periodically broadcasts its availability over the local network:

- Announces presence  
- Shares IP address and listening port  
- Other devices detect and list available peers  

---

### 2. Direct File Transfer (TCP)

Once a peer is selected:

1. Sender establishes a TCP connection  
2. Sends file metadata (name, size)  
3. Streams the file in chunks  
4. Receiver saves the incoming file locally  

This ensures fast and reliable peer-to-peer transfers.

---