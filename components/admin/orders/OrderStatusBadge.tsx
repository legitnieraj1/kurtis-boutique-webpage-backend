
import { OrderStatus } from "@/data/orders";

const statusColors: Record<OrderStatus, string> = {
    'Pending Shipment': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Shipped': 'bg-blue-100 text-blue-800 border-blue-200',
    'In Transit': 'bg-purple-100 text-purple-800 border-purple-200',
    'Delivered': 'bg-green-100 text-green-800 border-green-200',
    'RTO': 'bg-red-100 text-red-800 border-red-200',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
            {status}
        </span>
    );
}
