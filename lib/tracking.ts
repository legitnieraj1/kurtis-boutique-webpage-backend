/**
 * Order tracking utilities
 */

export function getTrackingUrl(awb: string | null, courier: string | null): string {
    if (!awb || !courier) return '#';

    // Generic tracking URL placeholder
    // Can be updated when a shipping provider is integrated
    return `/orders`;
}

export function getStatusDescription(status: string): string {
    switch (status) {
        case 'pending':
            return 'Your order has been placed and is awaiting confirmation.';
        case 'confirmed':
            return 'Your order has been confirmed.';
        case 'processing':
            return 'We are preparing your order for shipment.';
        case 'shipped':
            return 'Your order has been shipped and is on its way.';
        case 'in_transit':
            return 'Your order is in transit and will reach you soon.';
        case 'delivered':
            return 'Your order has been delivered.';
        case 'cancelled':
            return 'Your order has been cancelled.';
        case 'refunded':
            return 'Your order has been refunded.';
        default:
            return 'Status update available soon.';
    }
}
