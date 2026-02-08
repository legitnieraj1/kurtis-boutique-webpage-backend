
import { OrderStatus, ShipmentDetails } from "@/data/orders";
import { cn } from "@/lib/utils";
import { Check, Truck, Package, Home } from "lucide-react";

export function StatusTimeline({ status, shipment }: { status: OrderStatus, shipment: ShipmentDetails }) {

    // Define steps logic
    const steps = [
        {
            id: 'confirmed',
            label: 'Order Confirmed',
            icon: Package,
            completed: true, // Always confirmed if existing
            date: null
        },
        {
            id: 'shipped',
            label: 'Shipped',
            icon: Truck,
            completed: shipment.created || status === 'Shipped' || status === 'In Transit' || status === 'Delivered',
            date: shipment.created ? 'Ready for pickup' : null
        },
        {
            id: 'out_for_delivery',
            label: 'In Transit',
            icon: Truck, // Could be a different icon
            completed: status === 'In Transit' || status === 'Delivered',
            date: shipment.trackingStatus
        },
        {
            id: 'delivered',
            label: 'Delivered',
            icon: Home,
            completed: status === 'Delivered',
            date: null
        }
    ];

    // Calculate progress for bar
    const completedIndex = steps.findLastIndex(s => s.completed);
    const progressPercent = (completedIndex / (steps.length - 1)) * 100;

    return (
        <div className="w-full py-6">
            <div className="relative flex items-center justify-between">
                {/* Background Line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full -z-10" />

                {/* Active Progress Line */}
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full -z-10 transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                />

                {steps.map((step, idx) => {
                    const Icon = step.icon;
                    return (
                        <div key={step.id} className="group relative flex flex-col items-center">
                            {/* Icon Circle */}
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-colors duration-300 bg-background",
                                step.completed ? "border-primary bg-primary text-primary-foreground" : "border-muted text-muted-foreground"
                            )}>
                                {step.completed ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                            </div>

                            {/* Label */}
                            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-32 text-center">
                                <p className={cn(
                                    "text-xs font-semibold whitespace-nowrap",
                                    step.completed ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    {step.label}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Spacing for labels */}
            <div className="h-8" />
        </div>
    );
}
