// src/api/devices.ts
import { invoke } from "@tauri-apps/api/core";
import type { DeviceDto, Device } from "../types/device";

export async function getDevices(): Promise<Device[]> {
    const deviceDtos = await invoke<DeviceDto[]>("get_devices");

    return deviceDtos.map((dto) => ({
        ip: dto.ip,
        hostname: dto.hostname,
    }));
}
