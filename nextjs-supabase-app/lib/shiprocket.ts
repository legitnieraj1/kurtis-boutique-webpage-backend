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
} from './shiprocket-types';

const BASE_URL = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';

export class ShiprocketService {
    private static token: string | null = null;
    private static tokenExpiry: number | null = null;

    private static async getToken(): Promise<string> {
        // Check if token exists and is valid (buffer of 1 hour)
        if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry - 3600000) {
            return this.token;
        }

        const email = process.env.SHIPROCKET_EMAIL;
        const password = process.env.SHIPROCKET_PASSWORD;

        if (!email || !password) {
            throw new Error('Shiprocket credentials not configured');
        }

        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error(`Auth failed: ${response.statusText}`);
            }

            const data: ShiprocketAuthResponse = await response.json();
            this.token = data.token;
            // Token is usually valid for 10 days, setting expiry to 9 days from now for safety
            this.tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;

            console.log('Shiprocket auth token generated successfully');
            return this.token;
        } catch (error) {
            console.error('Error generating Shiprocket token:', error);
            throw error;
        }
    }

    private static async request<T>(endpoint: string, method: string, body?: any): Promise<T> {
        const token = await this.getToken();

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        // Handle 401 specifically to retry once with new token could be added here
        if (response.status === 401) {
            this.token = null; // Clear token
            // Retry logic could go here, but for now throwing error to let caller handle or fail
            throw new Error('Shiprocket Unauthorized - Token might be expired');
        }

        if (!response.ok) {
            const errorText = await response.text();
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

    static async trackByAWB(awb: string) {
        return this.request(`/courier/track/awb/${awb}`, 'GET');
    }
}
