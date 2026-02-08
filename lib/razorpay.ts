import Razorpay from 'razorpay';
import crypto from 'crypto';

const KEY_ID = process.env.RAZORPAY_KEY_ID!;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

export interface RazorpayOrderOptions {
    amount: number; // Amount in paise (e.g., 50000 for ₹500)
    currency?: string;
    receipt: string;
    notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    created_at: number;
}

export class RazorpayService {
    private static instance: Razorpay | null = null;

    /**
     * Validate environment variables are set
     */
    static validateConfig(): { valid: boolean; missing: string[] } {
        const missing: string[] = [];
        if (!KEY_ID) missing.push('RAZORPAY_KEY_ID');
        if (!KEY_SECRET) missing.push('RAZORPAY_KEY_SECRET');
        return { valid: missing.length === 0, missing };
    }

    /**
     * Get Razorpay instance
     */
    private static getInstance(): Razorpay {
        if (!this.instance) {
            const config = this.validateConfig();
            if (!config.valid) {
                throw new Error(`Missing Razorpay credentials: ${config.missing.join(', ')}`);
            }
            this.instance = new Razorpay({
                key_id: KEY_ID,
                key_secret: KEY_SECRET,
            });
        }
        return this.instance;
    }

    /**
     * Create a Razorpay order
     */
    static async createOrder(options: RazorpayOrderOptions): Promise<RazorpayOrderResponse> {
        try {
            const razorpay = this.getInstance();

            const orderOptions = {
                amount: options.amount,
                currency: options.currency || 'INR',
                receipt: options.receipt,
                notes: options.notes || {},
            };

            console.log('[Razorpay] Creating order:', orderOptions);

            const order = await razorpay.orders.create(orderOptions);

            console.log('[Razorpay] Order created:', order.id);

            return order as RazorpayOrderResponse;
        } catch (error) {
            console.error('[Razorpay] Create Order Error:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to create Razorpay order');
        }
    }

    /**
     * Verify payment signature
     */
    static verifyPaymentSignature(
        orderId: string,
        paymentId: string,
        signature: string
    ): boolean {
        try {
            const config = this.validateConfig();
            if (!config.valid) {
                throw new Error(`Missing Razorpay credentials: ${config.missing.join(', ')}`);
            }

            const body = orderId + '|' + paymentId;
            const expectedSignature = crypto
                .createHmac('sha256', KEY_SECRET)
                .update(body)
                .digest('hex');

            const isValid = expectedSignature === signature;

            console.log('[Razorpay] Payment verification:', isValid ? 'SUCCESS' : 'FAILED');

            return isValid;
        } catch (error) {
            console.error('[Razorpay] Verification Error:', error);
            return false;
        }
    }

    /**
     * Get public key for frontend
     */
    static getPublicKey(): string {
        return KEY_ID;
    }

    /**
     * Fetch payment details from Razorpay (Step 1.6 - Verify Payment Status)
     */
    static async fetchPayment(paymentId: string): Promise<{
        id: string;
        status: string;
        order_id: string;
        amount: number;
        currency: string;
        method: string;
        captured: boolean;
    }> {
        try {
            const razorpay = this.getInstance();
            const payment = await razorpay.payments.fetch(paymentId);
            console.log('[Razorpay] Payment fetched:', payment.id, payment.status);
            return payment as {
                id: string;
                status: string;
                order_id: string;
                amount: number;
                currency: string;
                method: string;
                captured: boolean;
            };
        } catch (error) {
            console.error('[Razorpay] Fetch Payment Error:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch payment');
        }
    }

    /**
     * Fetch order details from Razorpay
     */
    static async fetchOrder(orderId: string): Promise<RazorpayOrderResponse> {
        try {
            const razorpay = this.getInstance();
            const order = await razorpay.orders.fetch(orderId);
            console.log('[Razorpay] Order fetched:', order.id, order.status);
            return order as RazorpayOrderResponse;
        } catch (error) {
            console.error('[Razorpay] Fetch Order Error:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch order');
        }
    }
}

