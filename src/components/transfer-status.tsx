
import type { OutgoingTransfer, IncomingTransfer } from "@/types/transfer"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { FolderOpen, X } from "lucide-react"

interface TransferStatusProps {
	outgoingTransfer: OutgoingTransfer | null
	incomingTransfer: IncomingTransfer | null
	onOpenFolder?: () => void
	onDismissReceiving?: () => void
}

const sendStatusLabels: Record<OutgoingTransfer["status"], string> = {
	waiting: "Waiting...",
	sending: "Sending...",
	completed: "Completed",
	failed: "Failed",
}

const receiveStatusLabels: Record<IncomingTransfer["status"], string> = {
	waiting: "Waiting...",
	receiving: "Receiving...",
	completed: "Completed",
	failed: "Failed",
}

export function TransferStatus({ outgoingTransfer, incomingTransfer, onOpenFolder, onDismissReceiving }: TransferStatusProps) {
	const hasTransfers = outgoingTransfer || incomingTransfer

	if (!hasTransfers) return null

	return (
		<footer className="border-t border-border px-4 py-3 shrink-0 space-y-3">
			{outgoingTransfer && (
				<div className="space-y-2">


					<div className="flex items-center gap-4">
						<div className="min-w-0 flex-1">
							<div className="flex items-center justify-between gap-4 h-6">
								<p className="flex items-center gap-2 text-sm leading-none">
									<span>{outgoingTransfer.fileName}</span>
									<span className="text-muted-foreground text-xs leading-none">
										to {outgoingTransfer.receiverDeviceName}
									</span>
								</p>

								<div className="flex items-center gap-4 h-6">
									{(outgoingTransfer.status === "completed" ||
										outgoingTransfer.status === "failed") && (
											<div className="flex items-center gap-1 h-6 shrink-0">
												<button
													onClick={onDismissReceiving}
													className="h-6 w-6 p-0 flex items-center justify-center hover:bg-muted rounded"
												>
													<X className="w-4 h-4 leading-none" />
												</button>
											</div>
										)}

									<span
										className={cn(
											"text-xs font-medium leading-none shrink-0",
											outgoingTransfer.status === "completed" && "text-emerald-600",
											outgoingTransfer.status === "failed" && "text-destructive",
											(outgoingTransfer.status === "waiting" ||
												outgoingTransfer.status === "sending") &&
											"text-muted-foreground"
										)}
									>
										{sendStatusLabels[outgoingTransfer.status]}
									</span>
								</div>
							</div>
							<Progress value={outgoingTransfer.progress} className="h-1.5 mt-1.5" />
						</div>
					</div>
				</div>
			)}

			{incomingTransfer && (
				<div className="flex items-center gap-4">
					<div className="min-w-0 flex-1">
						<div className="flex items-center justify-between gap-4 h-6">
							<p className="flex items-center gap-2 text-sm leading-none">
								<span>{incomingTransfer.fileName}</span>
								<span className="text-muted-foreground text-xs leading-none">
									from {incomingTransfer.senderDeviceName}
								</span>
							</p>

							<div className="flex items-center gap-4 h-6">
								{(incomingTransfer.status === "completed" ||
									incomingTransfer.status === "failed") && (
										<div className="flex items-center gap-1 h-6 shrink-0">
											{incomingTransfer.status === "completed" && (
												<>
													<span className="text-xs text-muted-foreground leading-none">
														Saved to Downloads
													</span>
													<button
														onClick={onOpenFolder}
														className="h-6 w-6 p-0 flex items-center justify-center hover:bg-muted rounded"
													>
														<FolderOpen className="w-4 h-4 leading-none" />
													</button>
												</>
											)}
											<button
												onClick={onDismissReceiving}
												className="h-6 w-6 p-0 flex items-center justify-center hover:bg-muted rounded"
											>
												<X className="w-4 h-4 leading-none" />
											</button>
										</div>
									)}

								<span
									className={cn(
										"text-xs font-medium leading-none shrink-0",
										incomingTransfer.status === "completed" && "text-emerald-600",
										incomingTransfer.status === "failed" && "text-destructive",
										(incomingTransfer.status === "waiting" ||
											incomingTransfer.status === "receiving") &&
										"text-muted-foreground"
									)}
								>
									{receiveStatusLabels[incomingTransfer.status]}
								</span>
							</div>
						</div>
						<Progress value={incomingTransfer.progress} className="h-1.5 mt-1.5" />
					</div>
				</div>
			)}
		</footer>
	)
}
