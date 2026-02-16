import { cn } from "@/lib/utils"
import { Device } from "@/types/device"


interface DeviceListProps {
	devices: Device[]
	selectedDevice: Device | null
	onSelectDevice: (device: Device) => void
}

export function DeviceList({
	devices,
	selectedDevice,
	onSelectDevice,
}: DeviceListProps) {
	return (
		<section className="w-64 flex flex-col shrink-0">
			<div className="px-3 py-2 border-b border-border">
				<h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
					Devices
				</h2>
			</div>

			<div className="flex-1 overflow-y-auto p-2">
				{
					devices.length === 0 ? (
						<div className="px-1">
							<p className="text-sm text-muted-foreground">
								No devices found
							</p>
						</div>
					) :
						devices.map((device) => (
							<button
								key={device.ip}
								onClick={() => onSelectDevice(device)}
								className={cn(
									"w-full text-left px-3 py-2 rounded-md",
									"hover:bg-muted",
									selectedDevice?.ip === device.ip && "bg-muted"
								)}
							>
								<div className="flex items-center gap-2">
									<span
										className={cn(
											"w-2 h-2 rounded-full shrink-0 bg-emerald-500"
										)}
									/>
									<div className="min-w-0 flex-1">
										<p className="text-sm font-medium text-foreground truncate">
											{device.hostname}
										</p>
										<p className="text-xs text-muted-foreground">
											{device.ip}
										</p>
									</div>
								</div>
							</button>
						))
				}
			</div>
		</section>
	)
}
