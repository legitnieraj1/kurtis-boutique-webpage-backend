import { create } from 'zustand';
import { AdminOrder, MOCK_ORDERS, OrderStatus } from '@/data/orders';

interface ShippingStoreState {
    orders: AdminOrder[];
    isLoading: boolean;

    // Actions
    updateOrderStatus: (orderId: string, status: OrderStatus) => void;

    // Shipping Actions (Mock Async)
    createShipment: (orderId: string) => Promise<void>;
    generateAWB: (orderId: string) => Promise<void>;
    assignCourier: (orderId: string, courier: string) => void;
    requestPickup: (orderId: string, date: string) => Promise<void>;

    // Helpers
    getOrder: (orderId: string) => AdminOrder | undefined;
}

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useShippingStore = create<ShippingStoreState>((set, get) => ({
    orders: MOCK_ORDERS,
    isLoading: false,

    updateOrderStatus: (orderId, status) => set((state) => ({
        orders: state.orders.map(o =>
            o.id === orderId ? { ...o, orderStatus: status } : o
        )
    })),

    getOrder: (orderId) => get().orders.find(o => o.id === orderId),

    createShipment: async (orderId) => {
        set({ isLoading: true });
        await delay(1500); // Simulate API call

        set((state) => ({
            isLoading: false,
            orders: state.orders.map(o => {
                if (o.id !== orderId) return o;
                return {
                    ...o,
                    shipment: {
                        ...o.shipment,
                        created: true
                    }
                };
            })
        }));
    },

    assignCourier: (orderId, courier) => set((state) => ({
        orders: state.orders.map(o =>
            o.id === orderId ? {
                ...o,
                shipment: { ...o.shipment, courier }
            } : o
        )
    })),

    generateAWB: async (orderId) => {
        set({ isLoading: true });
        await delay(1500);

        const mockAWB = "AWB" + Math.random().toString().slice(2, 11);
        const mockTracking = "TRK" + Math.random().toString().slice(2, 11);

        set((state) => ({
            isLoading: false,
            orders: state.orders.map(o => {
                if (o.id !== orderId) return o;
                return {
                    ...o,
                    shipment: {
                        ...o.shipment,
                        awb: mockAWB,
                        trackingId: mockTracking,
                        trackingStatus: 'Booked'
                    }
                };
            })
        }));
    },

    requestPickup: async (orderId, date) => {
        set({ isLoading: true });
        await delay(1500);

        set((state) => ({
            isLoading: false,
            orders: state.orders.map(o => {
                if (o.id !== orderId) return o;
                return {
                    ...o,
                    orderStatus: 'Shipped', // Automatically update status
                    shipment: {
                        ...o.shipment,
                        pickupScheduled: true,
                        pickupDate: date,
                        labelUrl: "/dummy-label.pdf",
                        invoiceUrl: "/dummy-invoice.pdf"
                    }
                };
            })
        }));
    }
}));
