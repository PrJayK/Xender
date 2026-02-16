
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { IncomingRequest } from "@/types/request"

interface IncomingFileModalProps {
    incomingRequest: IncomingRequest | null
    onAccept: () => void
    onReject: () => void
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function IncomingFileModal({ incomingRequest, onAccept, onReject }: IncomingFileModalProps) {
    if (!incomingRequest) return null

    return (
        <Dialog open={!!incomingRequest} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Incoming File</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 py-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">From</span>
                        <span className="text-foreground font-medium">{incomingRequest.senderDevice.hostname}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">IP Address</span>
                        <span className="text-foreground font-mono text-xs">{incomingRequest.senderDevice.ip}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">File Name</span>
                        <span className="text-foreground truncate max-w-48">{incomingRequest.fileName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">File Size</span>
                        <span className="text-foreground">{formatFileSize(incomingRequest.fileSize)}</span>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onReject}>
                        Reject
                    </Button>
                    <Button className="ml-2" onClick={onAccept}>Accept</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
