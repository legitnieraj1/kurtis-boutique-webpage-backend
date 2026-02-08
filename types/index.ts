export interface Product {
    id: string;
    slug: string;
    name: string;
    description?: string;
    price: number;
    discount_price?: number;
    images: { image_url: string }[];
    sizes: { size: string; stock: number }[];
    category_id: string;
    category?: { name: string; slug: string };
    stock_remaining: number;
    is_new?: boolean;
    is_active: boolean;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    image_url?: string;
    products?: Array<{
        id: string;
        name: string;
        product_images: Array<{ image_url: string }>;
    }>;
}

export interface CartItem {
    productId: string;
    size: string;
    quantity: number;
    // Optional: caching price/name for display before fetch
}

export interface User {
    id: string;
    email: string;
    full_name?: string;
    role: 'admin' | 'customer';
}

export interface Order {
    id: string;
    created_at?: string;
    date: string; // Used by frontend store
    total: number;
    status: string;
    items: any[];
    email: string;
    awbId?: string;
    trackingUrl?: string;
    timeline?: { status: string; date: string; description: string }[];
}
