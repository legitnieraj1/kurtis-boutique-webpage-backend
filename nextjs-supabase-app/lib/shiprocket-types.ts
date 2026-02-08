export interface ShiprocketAuthConfig {
    email: string;
    password: string;
}

export interface ShiprocketAuthResponse {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    token: string;
    created_at: string;
}

export interface ShiprocketOrderItem {
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount?: number;
    tax?: number;
    hsn?: number;
}

export interface ShiprocketOrderPayload {
    order_id: string; // Your internal order ID
    order_date: string; // YYYY-MM-DD HH:MM
    pickup_location: string;
    channel_id?: string;
    comment?: string;
    billing_customer_name: string;
    billing_last_name?: string;
    billing_address: string;
    billing_address_2?: string;
    billing_city: string;
    billing_pincode: string;
    billing_state: string;
    billing_country: string;
    billing_email: string;
    billing_phone: string;
    shipping_is_billing: boolean;
    shipping_customer_name?: string;
    shipping_last_name?: string;
    shipping_address?: string;
    shipping_address_2?: string;
    shipping_city?: string;
    shipping_pincode?: string;
    shipping_state?: string;
    shipping_country?: string;
    shipping_email?: string;
    shipping_phone?: string;
    order_items: ShiprocketOrderItem[];
    payment_method: 'Prepaid' | 'COD';
    shipping_charges?: number;
    giftwrap_charges?: number;
    transaction_charges?: number;
    total_discount?: number;
    sub_total: number;
    length: number;
    breadth: number;
    height: number;
    weight: number; // in kg
}

export interface ShiprocketOrderResponse {
    order_id: number; // Shiprocket's ID
    shipment_id: number;
    status: string;
    statusCode: number;
    onboarding_completed_now: number;
    awb_code?: string;
    courier_company_id?: string;
    courier_name?: string;
}

export interface GenerateAWBPayload {
    shipment_id: string;
    courier_id?: string;
    status?: string;
}

export interface GenerateAWBResponse {
    awb_assign_status: number;
    response: {
        data: {
            awb_code: string;
            courier_company_id: string;
            courier_name: string;
            shipment_id: number;
        };
    };
}

export interface GeneratePickupPayload {
    shipment_id: string[];
}

export interface GeneratePickupResponse {
    pickup_status: number;
    response: {
        pickup_scheduled_date: string;
        pickup_token_number: string;
        status: number;
    };
}

export interface GenerateLabelPayload {
    shipment_id: string[];
}

export interface GenerateLabelResponse {
    label_created: number;
    label_url: string;
    response: number;
}

export interface ShiprocketErrorResponse {
    message: string;
    status_code?: number;
    errors?: Record<string, string[]>;
}
