
export type OrderStatus = 'Pending Shipment' | 'Shipped' | 'In Transit' | 'Delivered' | 'RTO';

export interface ShipmentDetails {
    created: boolean;
    awb: string | null;
    courier: string | null;
    pickupScheduled: boolean;
    pickupDate: string | null;
    trackingId: string | null;
    trackingStatus: string | null;
    labelUrl: string | null;
    invoiceUrl: string | null;
}

export interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
}

export interface AdminOrder {
    id: string;
    customer: {
        name: string;
        email: string;
        phone: string;
    };
    address: {
        line1: string;
        city: string;
        state: string;
        pincode: string;
    };
    items: OrderItem[];
    totalAmount: number;
    orderStatus: OrderStatus;
    date: string;
    shipment: ShipmentDetails;
}

export const MOCK_ORDERS: AdminOrder[] = [
    {
        id: "ORD-001",
        customer: {
            name: "Aisha Khan",
            email: "aisha@example.com",
            phone: "+91 9876543210"
        },
        address: {
            line1: "123, Palm Grove Heights",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400050"
        },
        items: [
            { id: "p1", name: "Premium Cotton Kurti", quantity: 2, price: 1299 }
        ],
        totalAmount: 2598,
        orderStatus: "Pending Shipment",
        date: "2024-03-10",
        shipment: {
            created: false,
            awb: null,
            courier: null,
            pickupScheduled: false,
            pickupDate: null,
            trackingId: null,
            trackingStatus: null,
            labelUrl: null,
            invoiceUrl: null
        }
    },
    {
        id: "ORD-002",
        customer: {
            name: "Sneha Patel",
            email: "sneha@example.com",
            phone: "+91 9876543211"
        },
        address: {
            line1: "45, Green Avenue",
            city: "Ahmedabad",
            state: "Gujarat",
            pincode: "380001"
        },
        items: [
            { id: "p2", name: "Floral Maxi Dress", quantity: 1, price: 2499 }
        ],
        totalAmount: 2499,
        orderStatus: "Shipped",
        date: "2024-03-08",
        shipment: {
            created: true,
            awb: "DEL123456789",
            courier: "Delhivery",
            pickupScheduled: true,
            pickupDate: "2024-03-09",
            trackingId: "TRK987654321",
            trackingStatus: "In Transit",
            labelUrl: "/mock-label.pdf",
            invoiceUrl: "/mock-invoice.pdf"
        }
    },
    {
        id: "ORD-003",
        customer: {
            name: "Priya Sharma",
            email: "priya@example.com",
            phone: "+91 9876543212"
        },
        address: {
            line1: "Flat 4B, Sunshine Towers",
            city: "Bangalore",
            state: "Karnataka",
            pincode: "560001"
        },
        items: [
            { id: "p3", name: "Embroidered Festive Set", quantity: 1, price: 4999 }
        ],
        totalAmount: 4999,
        orderStatus: "Delivered",
        date: "2024-03-01",
        shipment: {
            created: true,
            awb: "BLU987654321",
            courier: "Bluedart",
            pickupScheduled: true,
            pickupDate: "2024-03-02",
            trackingId: "TRK123456789",
            trackingStatus: "Delivered",
            labelUrl: "/mock-label.pdf",
            invoiceUrl: "/mock-invoice.pdf"
        }
    }
];
