import React, { useCallback, useEffect } from "react"
import type { Device } from "@/types/device"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { open } from "@tauri-apps/plugin-dialog";
import { LocalFile } from "@/types/file";
import { stat } from "@tauri-apps/plugin-fs";
import { getCurrentWindow } from "@tauri-apps/api/window";


interface SendFilePanelProps {
	selectedDevice: Device | null
	selectedFile: LocalFile | null
	onFileSelect: (file: LocalFile | null) => void
	onSendFile: () => void
	isTransferring: boolean
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function SendFilePanel({
	selectedDevice,
	selectedFile,
	onFileSelect,
	onSendFile,
	isTransferring,
}: SendFilePanelProps) {

	useEffect(() => {
		const appWindow = getCurrentWindow();

		const unlisten = appWindow.onDragDropEvent(async (event) => {
			if (event.payload.type === "drop") {
				const paths = event.payload.paths;

				if (paths.length > 0) {
					const file = await getLocalFile(paths[0]);
					if (file) onFileSelect(file);
				}
			}
		});

		return () => {
			unlisten.then((f) => f());
		};
	}, [onFileSelect]);


	const getLocalFile = async (path: string): Promise<LocalFile | null> => {

		const info = await stat(path);

		return {
			path,
			name: path.split(/[\\/]/).pop()!,
			size: info.size
		};
	}

	const handleDragOver = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault()
		},
		[]
	)

	const handleFileInput = useCallback(
		async (filePath: string) => {
			const file = await getLocalFile(filePath)
			if (file) onFileSelect(file)
		},
		[onFileSelect]
	)

	const canSend = Boolean(selectedDevice && selectedFile && !isTransferring)

	return (
		<section className="flex-1 flex flex-col p-4">
			<div className="mb-4">
				<h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
					Send File
				</h2>

				{selectedDevice ? (
					<p className="text-sm text-foreground">
						To: <span className="font-medium">{selectedDevice.hostname}</span>
					</p>
				) : (
					<p className="text-sm text-muted-foreground">
						Select a device first
					</p>
				)}
			</div>

			{/* Drop zone */}
			<div
				onDragOver={handleDragOver}
				className={cn(
					"flex-1 min-h-32 border border-dashed border-border rounded-md",
					"flex flex-col items-center justify-center gap-3",
					"text-muted-foreground"
				)}
			>
				{selectedFile ? (
					<div className="text-center px-4">
						<p className="text-sm text-foreground font-medium truncate max-w-xs">
							{selectedFile.name}
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							{formatFileSize(selectedFile.size)}
						</p>
						<button
							onClick={() => onFileSelect(null)}
							className="text-xs text-muted-foreground hover:text-foreground mt-2 underline"
						>
							Remove
						</button>
					</div>
				) : (
					<>
						<p className="text-sm">Drop a file here</p>
						<p className="text-xs">or</p>
						<label className="cursor-pointer">
							<button
								type="button"
								className="text-sm underline hover:text-foreground"
								onClick={async () => {
									const filePath = await open({
										multiple: false,
										directory: false,
									});

									if (!filePath) return;

									handleFileInput(filePath);
								}}
							>
								Browse files
							</button>
						</label>
					</>
				)}
			</div>

			{/* Send button */}
			<div className="mt-4">
				<Button
					onClick={onSendFile}
					disabled={!canSend}
					className="w-full"
				>
					{isTransferring ? "Sending..." : "Send File"}
				</Button>
			</div>
		</section>
	)
}
