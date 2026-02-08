declare module 'razorpay' {
    interface RazorpayConfig {
        key_id: string;
        key_secret: string;
    }

    interface OrderCreateOptions {
        amount: number;
        currency: string;
        receipt?: string;
        notes?: Record<string, string>;
        partial_payment?: boolean;
    }

    interface Order {
        id: string;
        entity: string;
        amount: number;
        amount_paid: number;
        amount_due: number;
        currency: string;
        receipt: string;
        status: string;
        attempts: number;
        notes: Record<string, string>;
        created_at: number;
    }

    interface Payment {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        method: string;
        captured: boolean;
        description: string;
        card_id: string | null;
        bank: string | null;
        wallet: string | null;
        vpa: string | null;
        email: string;
        contact: string;
        notes: Record<string, string>;
        fee: number;
        tax: number;
        error_code: string | null;
        error_description: string | null;
        created_at: number;
    }

    interface Orders {
        create(options: OrderCreateOptions): Promise<Order>;
        fetch(orderId: string): Promise<Order>;
        all(options?: { from?: number; to?: number; count?: number; skip?: number }): Promise<{ items: Order[] }>;
    }

    interface Payments {
        fetch(paymentId: string): Promise<Payment>;
        capture(paymentId: string, amount: number, currency?: string): Promise<Payment>;
        all(options?: { from?: number; to?: number; count?: number; skip?: number }): Promise<{ items: Payment[] }>;
    }

    class Razorpay {
        constructor(config: RazorpayConfig);
        orders: Orders;
        payments: Payments;
    }

    export = Razorpay;
}
