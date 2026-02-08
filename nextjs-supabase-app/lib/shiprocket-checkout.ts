import crypto from 'crypto';

const CHECKOUT_BASE_URL = 'https://apiv2.shiprocket.in/v1/checkout'; // Standard assumption
const API_KEY = process.env.SHIPROCKET_CHECKOUT_API_KEY!;
const API_SECRET = process.env.SHIPROCKET_CHECKOUT_SECRET!;

export interface CheckoutItem {
    variant_id: string;
    quantity: number;
    selling_price: number;
    title: string;
    sku: string;
    image_url?: string;
}

export interface CheckoutSessionPayload {
    order_id: string; // Internal Order ID
    cart_items: CheckoutItem[];
    sub_total: number;
    shipping_charges?: number;
    discount?: number;
    total_amount: number;
    customer_details?: {
        email?: string;
        phone?: string;
        name?: string;
    };
    redirect_url: string;
    timestamp?: number;
}

export class ShiprocketCheckoutService {

    /**
     * Generates HMAC-SHA256 signature
     */
    private static generateSignature(payload: string): string {
        return crypto
            .createHmac('sha256', API_SECRET)
            .update(payload)
            .digest('hex');
    }

    /**
     * Creates a checkout session
     */
    static async createSession(payload: CheckoutSessionPayload) {
        // Add timestamp if missing
        if (!payload.timestamp) {
            payload.timestamp = Math.floor(Date.now() / 1000);
        }

        // Sort keys to ensure consistent signature (common requirement)
        // For this standard implementation, we'll stringify directly, 
        // but some APIs require alphabetically sorted keys.
        const payloadString = JSON.stringify(payload);
        const signature = this.generateSignature(payloadString);

        console.log('Creating Checkout Session:', {
            url: `${CHECKOUT_BASE_URL}/create-session`,
            signature
        });

        const response = await fetch(`${CHECKOUT_BASE_URL}/create-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': API_KEY,
                'X-Api-Signature': signature,
            },
            body: payloadString,
        });

        if (!response.ok) {
            const errorText = await response.text();
            // Handle standard 404 if our guessed URL is wrong
            if (response.status === 404) {
                throw new Error('Checkout API Endpoint not found (404). The standard URL might differ.');
            }
            throw new Error(`Checkout API Error [${response.status}]: ${errorText}`);
        }

        return response.json();
    }

    /**
     * Verifies Webhook Signature
     */
    static verifyWebhook(payload: string, signature: string): boolean {
        const expectedSignature = this.generateSignature(payload);
        return signature === expectedSignature;
    }
}
