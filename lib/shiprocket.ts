import {
    ShiprocketAuthResponse,
    ShiprocketOrderPayload,
    ShiprocketOrderResponse,
    GenerateAWBPayload,
    GenerateAWBResponse,
    GeneratePickupPayload,
    GeneratePickupResponse,
    GenerateLabelPayload,
    GenerateLabelResponse,
    GenerateInvoicePayload,
    GenerateInvoiceResponse,
} from './shiprocket-types';

// Helper to sanitize URL
const getBaseUrl = () => {
    let url = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
    // Remove wrapping quotes if present (common env var mistake)
    url = url.replace(/^['"]|['"]$/g, '').trim();
    // Remove trailing slash if present
    return url.replace(/\/$/, '');
};

const BASE_URL = getBaseUrl();

export class ShiprocketService {
    private static token: string | null = null;
    private static tokenExpiry: number | null = null;

    private static async getToken(): Promise<string> {
        // 1. Check for hardcoded token in env (User provided)
        if (process.env.SHIPROCKET_TOKEN) {
            return process.env.SHIPROCKET_TOKEN;
        }

        // 2. Check if cached token exists and is valid (buffer of 1 hour)
        if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry - 3600000) {
            return this.token;
        }

        // Sanitize credentials
        const email = (process.env.SHIPROCKET_EMAIL || '').replace(/^['"]|['"]$/g, '').trim();
        const password = (process.env.SHIPROCKET_PASSWORD || '').replace(/^['"]|['"]$/g, '').trim();

        if (!email || !password) {
            console.warn('Shiprocket credentials not configured. Skipping Shiprocket calls. Email:', !!email, 'Password:', !!password);
            return ''; // Return empty to allow graceful degradation
        }

        console.log('[Shiprocket] Attempting to generate token with email:', email);
        console.log('[Shiprocket] Using Base URL:', BASE_URL);

        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Shiprocket] Auth failed: ${response.status} ${response.statusText}`, errorText);
                throw new Error(`Auth failed: ${response.statusText} - ${errorText}`);
            }

            const data: ShiprocketAuthResponse = await response.json();
            this.token = data.token;
            // Token is usually valid for 10 days, setting expiry to 9 days from now for safety
            this.tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;

            console.log('Shiprocket auth token generated successfully');
            return this.token;
        } catch (error) {
            console.error('[Shiprocket] Error generating Shiprocket token:', error);
            throw error;
        }
    }

    private static async request<T>(endpoint: string, method: string, body?: any): Promise<T> {
        const token = await this.getToken();

        if (!token) {
            throw new Error('No Shiprocket token available');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            cache: 'no-store' // Ensure we don't cache Shiprocket responses
        });

        console.log(`[Shiprocket] Request to ${endpoint} status:`, response.status);


        // Handle 401 specifically to retry once with new token could be added here
        if (response.status === 401) {
            console.error('[Shiprocket] Unauthorized access. Token might be expired or invalid.');
            this.token = null; // Clear token
            // Retry logic could go here, but for now throwing error to let caller handle or fail
            throw new Error('Shiprocket Unauthorized - Token might be expired');
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Shiprocket] API Error [${response.status}] for ${endpoint}:`, errorText);
            throw new Error(`Shiprocket API Error [${response.status}]: ${errorText}`);
        }

        return response.json();
    }

    static async checkServiceability(payload: {
        pickup_postcode: number;
        delivery_postcode: number;
        weight: number;
        cod: number; // 1 for COD, 0 for Prepaid
    }) {
        // GET request with query params
        const query = new URLSearchParams({
            pickup_postcode: payload.pickup_postcode.toString(),
            delivery_postcode: payload.delivery_postcode.toString(),
            weight: payload.weight.toString(),
            cod: payload.cod.toString(),
        });

        return this.request(`/courier/serviceability?${query.toString()}`, 'GET');
    }

    static async createOrder(orderData: ShiprocketOrderPayload): Promise<ShiprocketOrderResponse> {
        return this.request<ShiprocketOrderResponse>('/orders/create/adhoc', 'POST', orderData);
    }

    static async assignAWB(payload: GenerateAWBPayload): Promise<GenerateAWBResponse> {
        return this.request<GenerateAWBResponse>('/courier/assign/awb', 'POST', payload);
    }

    static async generatePickup(payload: GeneratePickupPayload): Promise<GeneratePickupResponse> {
        return this.request<GeneratePickupResponse>('/courier/generate/pickup', 'POST', payload);
    }

    static async generateLabel(payload: GenerateLabelPayload): Promise<GenerateLabelResponse> {
        return this.request<GenerateLabelResponse>('/courier/generate/label', 'POST', payload);
    }

    static async generateManifest(shipmentIds: string[]) {
        return this.request('/manifests/generate', 'POST', { shipment_id: shipmentIds });
    }

    static async generateInvoice(payload: GenerateInvoicePayload): Promise<GenerateInvoiceResponse> {
        return this.request<GenerateInvoiceResponse>('/orders/print/invoice', 'POST', payload);
    }

    static async trackByAWB(awb: string) {
        return this.request(`/courier/track/awb/${awb}`, 'GET');
    }
}
