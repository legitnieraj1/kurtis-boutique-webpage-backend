import { create } from 'zustand';
import { User, Order } from '@/types';
import { getCartItemPrice } from './cartService';
import { CartItem } from './cartService';

export type DBCartItem = CartItem;

export interface DBWishlistItem {
    id: string;
    product_id: string;
    created_at: string;
    product?: {
        id: string;
        name: string;
        slug: string;
        price: number;
        discount_price?: number;
        is_active: boolean;
        images?: { image_url: string }[];
    };
}

const CART_KEY = 'kb_cart';
const WISHLIST_KEY = 'kb_wishlist';

function readLocalCart(): DBCartItem[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function writeLocalCart(cart: DBCartItem[]) {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* ignore */ }
}

function readLocalWishlist(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(WISHLIST_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function writeLocalWishlist(ids: string[]) {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

interface StoreState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    wishlist: string[];
    wishlistItems: DBWishlistItem[];
    wishlistLoading: boolean;

    cart: DBCartItem[];
    cartLoading: boolean;

    isCartOpen: boolean;

    orders: Order[];

    setUser: (user: User | null) => void;
    setIsAuthenticated: (value: boolean) => void;
    setIsLoading: (value: boolean) => void;
    login: (user: User) => void;

    setWishlist: (items: DBWishlistItem[]) => void;
    addToWishlist: (productId: string) => Promise<boolean>;
    removeFromWishlist: (productId: string) => Promise<boolean>;
    isInWishlist: (productId: string) => boolean;
    syncWishlist: () => Promise<void>;

    setCart: (items: DBCartItem[]) => void;
    addToCart: (
        productId: string,
        size: string,
        color?: string | null,
        comboType?: string,
        quantity?: number,
        babySize?: string | null,
        productData?: CartItem['product']
    ) => Promise<boolean>;
    removeFromCart: (cartItemId: string) => Promise<boolean>;
    updateCartQuantity: (cartItemId: string, quantity: number) => Promise<boolean>;
    clearCart: () => Promise<boolean>;
    syncCart: () => Promise<void>;
    getCartTotal: () => number;
    getCartItemCount: () => number;

    setIsCartOpen: (open: boolean) => void;

    setOrders: (orders: Order[]) => void;
    syncAllData: () => Promise<void>;
    logout: () => void;
}

export const useStore = create<StoreState>()((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    wishlist: [],
    wishlistItems: [],
    wishlistLoading: false,

    cart: [],
    cartLoading: false,

    isCartOpen: false,

    orders: [],

    setUser: (user) => set({ user, isAuthenticated: !!user }),
    setIsAuthenticated: (value) => set({ isAuthenticated: value }),
    setIsLoading: (value) => set({ isLoading: value }),

    login: (user) => {
        set({ user, isAuthenticated: true });
        get().syncAllData();
    },

    // === WISHLIST (localStorage) ===
    setWishlist: (items) => set({
        wishlistItems: items,
        wishlist: items.map(item => item.product_id)
    }),

    isInWishlist: (productId) => get().wishlist.includes(productId),

    syncWishlist: async () => {
        const ids = readLocalWishlist();
        set({ wishlist: ids, wishlistLoading: false });
    },

    addToWishlist: async (productId) => {
        const current = get().wishlist;
        if (current.includes(productId)) return true;
        const updated = [...current, productId];
        set({ wishlist: updated });
        writeLocalWishlist(updated);
        return true;
    },

    removeFromWishlist: async (productId) => {
        const updated = get().wishlist.filter(id => id !== productId);
        set({ wishlist: updated });
        writeLocalWishlist(updated);
        return true;
    },

    // === CART (localStorage) ===
    setCart: (items) => set({ cart: items }),

    syncCart: async () => {
        const items = readLocalCart();
        set({ cart: items, cartLoading: false });
    },

    addToCart: async (productId, size, color = null, comboType = 'single', quantity = 1, babySize = null, productData) => {
        const current = get().cart;

        const existingIndex = current.findIndex(item =>
            item.product_id === productId &&
            item.size === size &&
            (item.color || null) === (color || null) &&
            (item.combo_type || 'single') === (comboType || 'single') &&
            (item.baby_size || null) === (babySize || null)
        );

        let newCart: DBCartItem[];
        if (existingIndex >= 0) {
            newCart = current.map((item, idx) =>
                idx === existingIndex
                    ? { ...item, quantity: item.quantity + (quantity || 1) }
                    : item
            );
        } else {
            const newItem: DBCartItem = {
                id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                product_id: productId,
                size,
                quantity: quantity || 1,
                color: color || null,
                combo_type: comboType || 'single',
                baby_size: babySize || null,
                product: productData,
            };
            newCart = [...current, newItem];
        }

        set({ cart: newCart });
        writeLocalCart(newCart);
        return true;
    },

    removeFromCart: async (cartItemId) => {
        const newCart = get().cart.filter(item => item.id !== cartItemId);
        set({ cart: newCart });
        writeLocalCart(newCart);
        return true;
    },

    updateCartQuantity: async (cartItemId, quantity) => {
        const current = get().cart;
        const newCart = quantity <= 0
            ? current.filter(item => item.id !== cartItemId)
            : current.map(item => item.id === cartItemId ? { ...item, quantity } : item);
        set({ cart: newCart });
        writeLocalCart(newCart);
        return true;
    },

    clearCart: async () => {
        set({ cart: [] });
        if (typeof window !== 'undefined') {
            localStorage.removeItem(CART_KEY);
        }
        return true;
    },

    getCartTotal: () => {
        return get().cart.reduce((total, item) => {
            const price = getCartItemPrice(item);
            return total + (price * item.quantity);
        }, 0);
    },

    getCartItemCount: () => {
        return get().cart.reduce((count, item) => count + item.quantity, 0);
    },

    setIsCartOpen: (open) => set({ isCartOpen: open }),

    syncAllData: async () => {
        const { syncWishlist, syncCart } = get();
        await Promise.all([syncWishlist(), syncCart()]);
    },

    setOrders: (orders) => set({ orders }),

    logout: () => {
        set({
            user: null,
            isAuthenticated: false,
            wishlist: [],
            wishlistItems: [],
            cart: [],
            orders: [],
            isCartOpen: false,
        });
    },
}));
