import { Device } from "./device"

export interface IncomingRequest {
	transferId: string
	senderDevice: Device
	fileName: string
	fileSize: number
}