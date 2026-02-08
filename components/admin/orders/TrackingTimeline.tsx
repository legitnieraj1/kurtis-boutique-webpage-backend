
import { CheckCircle2 } from "lucide-react";
import { ShipmentDetails } from "@/data/orders";
import { cn } from "@/lib/utils";

export function TrackingTimeline({ shipment }: { shipment: ShipmentDetails }) {
    const steps = [
        { label: 'Order Confirmed', completed: true, date: 'Mar 10' },
        { label: 'Shipment Created', completed: shipment.created, date: 'Mar 11' },
        { label: 'Picked Up', completed: shipment.pickupScheduled, date: shipment.pickupDate },
        { label: 'In Transit', completed: !!shipment.trackingStatus && shipment.trackingStatus !== 'Booked', date: null },
        { label: 'Delivered', completed: shipment.trackingStatus === 'Delivered', date: null },
    ];

    return (
        <div className="relative border-l-2 border-muted ml-3 space-y-8 my-4">
            {steps.map((step, idx) => (
                <div key={idx} className="ml-6 relative">
                    <span
                        className={cn(
                            "absolute -left-[32px] top-0 bg-background border-2 rounded-full w-4 h-4 flex items-center justify-center transition-colors",
                            step.completed ? "border-primary bg-primary" : "border-muted"
                        )}
                    >
                        {step.completed && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                    </span>
                    <div className="flex justify-between items-start -mt-1">
                        <div>
                            <h4 className={cn("text-sm font-medium", step.completed ? "text-foreground" : "text-muted-foreground")}>
                                {step.label}
                            </h4>
                            {step.date && step.completed && (
                                <span className="text-xs text-muted-foreground">{step.date}</span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
