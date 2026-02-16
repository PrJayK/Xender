import { useState, useCallback, useEffect } from "react"
import { DeviceList } from "@/components/device-list"
import { SendFilePanel } from "@/components/send-file-panel"
import { TransferStatus } from "@/components/transfer-status"
import type { Device } from "@/types/device"
import { IncomingTransfer, OutgoingTransfer } from "@/types/transfer"
import { getDevices } from "@/api/devices"
import { IncomingRequest } from "@/types/request"
import { IncomingFileModal } from "@/components/transfer-request-modal"
import { respond_to_transfer_request, send_file } from "@/api/transfer"
import { LocalFile } from "@/types/file"
import { listen } from "@tauri-apps/api/event"
import { errorToast, infoToast } from "@/lib/toasts"
import { downloadDir } from '@tauri-apps/api/path'
import { openPath } from '@tauri-apps/plugin-opener'

export default function Home() {
	const [availableDevices, setAvailableDevices] = useState<Device[]>([])
	const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
	const [selectedFile, setSelectedFile] = useState<LocalFile | null>(null)
	const [incomingRequest, setIncomingRequest] = useState<IncomingRequest | null>(null)
	const [incomingTransfer, setIncomingTransfer] = useState<IncomingTransfer | null>(null)
	const [outgoingTransfer, setOutgoingTransfer] = useState<OutgoingTransfer | null>(null)

	useEffect(() => {
		const interval = setInterval(() => {
			getDevices().then(setAvailableDevices)
		}, 2000)

		return () => clearInterval(interval)
	}, [])

	useEffect(() => {
		let unlisten: (() => void) | undefined;

		(async () => {
			unlisten = await listen("INCOMING_TRANSFER", (event) => {
				const transfer = event.payload as {
					transferId: string;
					filename: string;
					fileSize: number;
					senderHostname: string;
					senderIp: string;
				};

				setIncomingRequest({
					transferId: transfer.transferId,
					senderDevice: { hostname: transfer.senderHostname, ip: transfer.senderIp },
					fileName: transfer.filename,
					fileSize: transfer.fileSize,
				});
			});
		})();

		return () => {
			if (unlisten) unlisten();
		};
	}, []);

	useEffect(() => {
		let unlisten: (() => void) | undefined;

		(async () => {
			unlisten = await listen("INCOMING_TRANSFER_PROGRESS", (event) => {
				const progress = event.payload as {
					transferId: string;
					percent: number;
				};

				if (progress.percent >= 100) {
					progress.percent = 100
					setIncomingTransfer((prev) =>
						prev ? { ...prev, progress: 100, status: "completed", savedPath: "Downloads" } : null,
					)
				} else {
					setIncomingTransfer((prev) => (prev ? { ...prev, progress: progress.percent, status: "receiving" } : null))
				}
			});
		})();

		return () => {
			if (unlisten) unlisten();
		};
	}, []);

	useEffect(() => {
		let unlisten: (() => void) | undefined;

		(async () => {
			unlisten = await listen("INCOMING_TRANSFER_FAILED", () => {
				errorToast("File transfer failed.");

				setIncomingTransfer((prev) =>
					prev ? { ...prev, status: "failed" } : null,
				)
			});
		})();

		return () => {
			if (unlisten) unlisten();
		};
	}, []);

	useEffect(() => {
		let unlisten: (() => void) | undefined;

		(async () => {
			unlisten = await listen("OUTGOING_TRANSFER_PROGRESS", (event) => {
				const progress = event.payload as {
					transferId: string;
					percent: number;
				};

				if (progress.percent >= 100) {
					progress.percent = 100
					setOutgoingTransfer((prev) =>
						prev ? { ...prev, progress: 100, status: "completed", savedPath: "Downloads" } : null,
					)
				} else {
					setOutgoingTransfer((prev) => (prev ? { ...prev, progress: progress.percent, status: "sending" } : null))
				}
			});
		})();

		return () => {
			if (unlisten) unlisten();
		};
	}, []);

	useEffect(() => {
		let unlisten: (() => void) | undefined;

		(async () => {
			unlisten = await listen("OUTGOING_TRANSFER_REJECTED", () => {
				setOutgoingTransfer((prev) =>
					prev ? { ...prev, progress: 0, status: "failed" } : null,
				)

				errorToast("File transfer rejected.");
			});
		})();

		return () => {
			if (unlisten) unlisten();
		};
	}, []);

	useEffect(() => {
		let unlisten: (() => void) | undefined;

		(async () => {
			unlisten = await listen("OUTGOING_TRANSFER_FAILED", () => {
				errorToast("File transfer failed.");

				setOutgoingTransfer((prev) =>
					prev ? { ...prev, status: "failed" } : null,
				)
			});
		})();

		return () => {
			if (unlisten) unlisten();
		};
	}, []);

	const handleAcceptIncoming = useCallback(() => {
		if (!incomingRequest) return

		const request = incomingRequest
		setIncomingRequest(null)

		respond_to_transfer_request(request.transferId, true)

		setOutgoingTransfer(null)

		setIncomingTransfer({
			transferId: request.transferId,
			fileName: request.fileName,
			senderDeviceName: request.senderDevice.hostname,
			progress: 0,
			status: "waiting",
		})

	}, [incomingRequest])

	const handleRejectIncoming = useCallback(() => {
		if (!incomingRequest) return

		respond_to_transfer_request(incomingRequest.transferId, false)
		setIncomingRequest(null)
		infoToast("Incoming file transfer request rejected.")
	}, [incomingRequest])

	const handleOpenFolder = useCallback(async () => {
		const downloads = await downloadDir();
		openPath(downloads);
	}, []);

	const handleDismissReceiving = useCallback(() => {
		setIncomingTransfer(null)
		setOutgoingTransfer(null)
	}, [])

	const handleSendFile = useCallback(() => {
		if (!selectedFile || !selectedDevice) return

		setIncomingTransfer(null)

		setOutgoingTransfer({
			fileName: selectedFile.name,
			progress: 0,
			receiverDeviceName: selectedDevice.hostname,
			status: "waiting",
		})

		send_file(selectedDevice, selectedFile)

	}, [selectedFile, selectedDevice])

	return (
		<div className="h-screen flex flex-col bg-background">
			<header className="h-12 flex items-center px-4 border-b border-border shrink-0">
				<h1 className="text-sm font-semibold text-foreground">
					Xhare
				</h1>
			</header>

			<main className="flex-1 flex min-h-0">
				<DeviceList
					devices={availableDevices.sort((a, b) => a.hostname.localeCompare(b.hostname))}
					selectedDevice={selectedDevice}
					onSelectDevice={setSelectedDevice}
				/>

				<div className="w-px bg-border" />

				<SendFilePanel
					selectedDevice={selectedDevice}
					selectedFile={selectedFile}
					onFileSelect={setSelectedFile}
					onSendFile={handleSendFile}
					isTransferring={
						outgoingTransfer?.status === "sending" ||
						outgoingTransfer?.status === "waiting"
					}
				/>
			</main>

			<TransferStatus
				outgoingTransfer={outgoingTransfer}
				incomingTransfer={incomingTransfer}
				onOpenFolder={handleOpenFolder}
				onDismissReceiving={handleDismissReceiving}
			/>

			<IncomingFileModal incomingRequest={incomingRequest} onAccept={handleAcceptIncoming} onReject={handleRejectIncoming} />
		</div>
	)
}
