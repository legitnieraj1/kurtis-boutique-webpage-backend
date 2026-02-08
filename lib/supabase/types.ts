// Database types generated from Supabase schema
// These types match the tables defined in supabase-schema.sql

export type UserRole = 'customer' | 'admin';

export type OrderStatus =
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'in_transit'
    | 'delivered'
    | 'cancelled'
    | 'refunded';

export type ContactPreference = 'whatsapp' | 'email' | 'call';

export type QueryStatus = 'new' | 'in_progress' | 'contacted' | 'closed';

export type NotificationType = 'low_stock' | 'new_order' | 'new_query' | 'order_update';

export type DiscountType = 'percentage' | 'flat';

// ============================================
// TABLE TYPES
// ============================================

export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    role: UserRole;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    category_id: string | null;
    price: number;
    discount_price: number | null;
    discount_type: DiscountType | null;
    discount_value: number | null;
    stock_total: number;
    stock_remaining: number;
    low_stock_threshold: number;
    is_active: boolean;
    is_new: boolean;
    is_best_seller: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProductImage {
    id: string;
    product_id: string;
    image_url: string;
    display_order: number;
    created_at: string;
}

export interface ProductSize {
    id: string;
    product_id: string;
    size: string;
    stock_count: number;
    created_at: string;
}

export interface Order {
    id: string;
    order_number: string;
    user_id: string;
    status: OrderStatus;
    subtotal: number;
    shipping_cost: number;
    discount_amount: number;
    total: number;
    // Shipping
    shipping_name: string;
    shipping_phone: string;
    shipping_address_line1: string;
    shipping_address_line2: string | null;
    shipping_city: string;
    shipping_state: string;
    shipping_pincode: string;
    // Tracking
    awb_id: string | null;
    shipment_id: string | null;
    courier_name: string | null;
    tracking_url: string | null;
    // Timestamps
    created_at: string;
    updated_at: string;
    shipped_at: string | null;
    delivered_at: string | null;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    product_name: string;
    product_image: string | null;
    size: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    created_at: string;
}

export interface CartItem {
    id: string;
    user_id: string;
    product_id: string;
    size: string;
    quantity: number;
    created_at: string;
    updated_at: string;
}

export interface Review {
    id: string;
    product_id: string;
    reviewer_name: string;
    reviewer_image: string | null;
    rating: number;
    review_text: string | null;
    is_verified_buyer: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Banner {
    id: string;
    title: string | null;
    subtitle: string | null;
    image_url: string;
    link_url: string | null;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CustomisationQuery {
    id: string;
    user_id: string;
    product_id: string | null;
    product_name: string | null;
    message: string;
    customisation_types: string[];
    preferred_size: string | null;
    contact_preference: ContactPreference;
    mobile_number: string | null;
    status: QueryStatus;
    admin_notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string | null;
    reference_id: string | null;
    is_read: boolean;
    created_at: string;
}

export interface OrderTimeline {
    id: string;
    order_id: string;
    status: string;
    description: string | null;
    location: string | null;
    created_at: string;
}

// ============================================
// JOINED TYPES (for queries with relations)
// ============================================

export interface ProductWithDetails extends Product {
    category?: Category;
    images?: ProductImage[];
    sizes?: ProductSize[];
    reviews?: Review[];
}

export interface OrderWithDetails extends Order {
    items?: OrderItem[];
    timeline?: OrderTimeline[];
    user?: Profile;
}

export interface CartItemWithProduct extends CartItem {
    product?: ProductWithDetails;
}

// ============================================
// INPUT TYPES (for creating/updating)
// ============================================

export interface CreateProductInput {
    slug: string;
    name: string;
    description?: string;
    category_id?: string;
    price: number;
    discount_price?: number;
    discount_type?: DiscountType;
    discount_value?: number;
    stock_total?: number;
    stock_remaining?: number;
    low_stock_threshold?: number;
    is_active?: boolean;
    is_new?: boolean;
    is_best_seller?: boolean;
    sizes?: { size: string; stock_count: number }[];
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
    id: string;
}

export interface CreateOrderInput {
    items: {
        product_id: string;
        size: string;
        quantity: number;
    }[];
    shipping: {
        name: string;
        phone: string;
        address_line1: string;
        address_line2?: string;
        city: string;
        state: string;
        pincode: string;
    };
}

export interface CreateCustomisationQueryInput {
    product_id?: string;
    product_name?: string;
    message: string;
    customisation_types?: string[];
    preferred_size?: string;
    contact_preference: ContactPreference;
    mobile_number?: string;
}
