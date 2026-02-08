
import { OrderStatus } from "@/data/orders";
import { cn } from "@/lib/utils";

const statusStyles: Record<OrderStatus, string> = {
    'Pending Shipment': 'bg-amber-50 text-amber-700 border-amber-200',
    'Shipped': 'bg-blue-50 text-blue-700 border-blue-200',
    'In Transit': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'RTO': 'bg-red-50 text-red-700 border-red-200',
};

export function ShipmentStatusBadge({ status, className }: { status: OrderStatus, className?: string }) {
    return (
        <span className={cn(
            "px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1.5",
            statusStyles[status] || 'bg-gray-50 text-gray-700 border-gray-200',
            className
        )}>
            <span className="relative flex h-2 w-2">
                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    status === 'Delivered' ? 'bg-emerald-400' :
                        status === 'RTO' ? 'bg-red-400' : 'bg-blue-400'
                )}></span>
                <span className={cn("relative inline-flex rounded-full h-2 w-2",
                    status === 'Delivered' ? 'bg-emerald-500' :
                        status === 'RTO' ? 'bg-red-500' : 'bg-blue-500'
                )}></span>
            </span>
            {status}
        </span>
    );
}
