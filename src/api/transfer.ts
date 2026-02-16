import { Device } from "@/types/device";
import { LocalFile } from "@/types/file";
import { invoke } from "@tauri-apps/api/core";

export async function send_file(device: Device, file: LocalFile): Promise<void> {
    invoke("send_file", {
        deviceIp: device.ip,
        filePath: file.path,
    })
}

export async function respond_to_transfer_request(transferId: string, accepted: boolean): Promise<void> {
    invoke("respond_to_transfer_request", {
        transferId,
        accepted
    })
}