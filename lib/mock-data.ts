export interface TrackingTimeline {
    status: string;
    date: string;
    description: string;
}

export function getMockTracking(awbIdOrOrderId: string): {
    status: 'Pending' | 'Shipped' | 'In Transit' | 'Delivered' | 'Cancelled';
    timeline: TrackingTimeline[];
    awbId: string;
} {
    // Deterministic mock based on ID length or value to simulate different states
    const isDelivered = awbIdOrOrderId.endsWith('1');
    const isShipped = awbIdOrOrderId.endsWith('2');
    const isCancelled = awbIdOrOrderId.endsWith('3');
    const isPending = awbIdOrOrderId.endsWith('4');

    if (isDelivered) {
        return {
            status: 'Delivered',
            awbId: 'AWB' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            timeline: [
                { status: 'Order Placed', date: 'Oct 24, 2024, 10:00 AM', description: 'Your order has been placed successfully.' },
                { status: 'Shipped', date: 'Oct 25, 2024, 02:00 PM', description: 'Your order has been shipped via Bluedart.' },
                { status: 'In Transit', date: 'Oct 26, 2024, 09:00 AM', description: 'Your order has reached the local hub.' },
                { status: 'Delivered', date: 'Oct 27, 2024, 01:15 PM', description: 'Your order has been delivered.' },
            ],
        };
    }

    if (isShipped) {
        return {
            status: 'Shipped',
            awbId: 'AWB' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            timeline: [
                { status: 'Order Placed', date: 'Oct 26, 2024, 11:30 AM', description: 'Your order has been placed successfully.' },
                { status: 'Shipped', date: 'Oct 27, 2024, 04:45 PM', description: 'Your order has been shipped via Delhivery.' },
            ],
        };
    }

    if (isCancelled) {
        return {
            status: 'Cancelled',
            awbId: 'N/A',
            timeline: [
                { status: 'Order Placed', date: 'Oct 28, 2024, 09:15 AM', description: 'Your order has been placed successfully.' },
                { status: 'Cancelled', date: 'Oct 28, 2024, 10:00 AM', description: 'Order was cancelled by user.' },
            ],
        };
    }

    if (isPending) {
        return {
            status: 'Pending',
            awbId: 'N/A',
            timeline: [
                { status: 'Order Placed', date: 'Today, 10:00 AM', description: 'Your order has been placed successfully.' },
            ],
        };
    }

    // Default to In Transit for others
    return {
        status: 'In Transit',
        awbId: 'AWB' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        timeline: [
            { status: 'Order Placed', date: 'Oct 20, 2024, 10:00 AM', description: 'Your order has been placed successfully.' },
            { status: 'Shipped', date: 'Oct 21, 2024, 06:00 PM', description: 'Your order has been shipped via DTDC.' },
            { status: 'In Transit', date: 'Oct 22, 2024, 08:30 AM', description: 'Shipment is out for delivery.' },
        ],
    };
}
