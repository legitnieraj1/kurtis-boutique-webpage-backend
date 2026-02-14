
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
    'pending': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'confirmed': 'bg-blue-50 text-blue-700 border-blue-200',
    'processing': 'bg-purple-50 text-purple-700 border-purple-200',
    'shipped': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'in_transit': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'cancelled': 'bg-red-50 text-red-700 border-red-200',
    'refunded': 'bg-gray-50 text-gray-700 border-gray-200',
    'rto': 'bg-red-50 text-red-700 border-red-200',
    // Fallback for old/mock statuses
    'Pending Shipment': 'bg-amber-50 text-amber-700 border-amber-200',
    'Shipped': 'bg-blue-50 text-blue-700 border-blue-200',
    'In Transit': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'RTO': 'bg-red-50 text-red-700 border-red-200',
};

export function ShipmentStatusBadge({ status, className }: { status: string, className?: string }) {
    const normalizedStatus = status?.toLowerCase().replace(' ', '_') || 'pending';
    // Check for exact match first (for old statuses), then normalized
    const style = statusStyles[status] || statusStyles[normalizedStatus] || 'bg-gray-50 text-gray-700 border-gray-200';

    const isLive = ['shipped', 'in_transit', 'delivered'].includes(normalizedStatus);
    const isError = ['cancelled', 'rto', 'refunded'].includes(normalizedStatus);
    const isSuccess = normalizedStatus === 'delivered';

    return (
        <span className={cn(
            "px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1.5 capitalize",
            style,
            className
        )}>
            {isLive && (
                <span className="relative flex h-2 w-2">
                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                        isSuccess ? 'bg-emerald-400' : 'bg-blue-400'
                    )}></span>
                    <span className={cn("relative inline-flex rounded-full h-2 w-2",
                        isSuccess ? 'bg-emerald-500' : 'bg-blue-500'
                    )}></span>
                </span>
            )}
            {status?.replace(/_/g, ' ')}
        </span>
    );
}
