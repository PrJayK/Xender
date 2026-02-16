export interface OutgoingTransfer {
  fileName: string;
  progress: number;
  receiverDeviceName: string;
  status: "waiting" | "sending" | "completed" | "failed";
}

export interface IncomingTransfer {
  transferId: string
  fileName: string
  senderDeviceName: string
  progress: number
  status: "waiting" | "receiving" | "completed" | "failed"
  savedPath?: string
}
