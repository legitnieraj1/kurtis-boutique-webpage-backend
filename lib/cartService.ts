
import { createSupabaseClient } from "@/lib/supabase/client";

export interface CartItemAddons {
    extra_length?: boolean;
    feeding_zip?: boolean;
    /** Extra babies beyond the first (mom_baby combo). Each priced by its size. */
    babies?: { size: string; gender: string }[];
}

export interface CartItem {
    id: string;
    product_id: string;
    size: string;
    quantity: number;
    product?: {
        name: string;
        price: number;
        discount_price?: number;
        images?: { image_url: string }[];
        is_mom_baby?: boolean;
        is_family_combo?: boolean;
        is_couple_combo?: boolean;
        allow_baby_only?: boolean;
        extra_length_price?: number;
        feeding_zip_price?: number;
        mom_baby_combos?: { mom_price: number; baby_base_price: number }[];
        family_combos?: { mother_price: number; father_price: number; baby_base_price: number }[];
        couple_combos?: { women_price: number; men_price: number }[];
        baby_size_prices?: { size: string; price: number }[];
    };
    color?: string | null;
    combo_type?: string | null;
    baby_size?: string | null;
    addons?: CartItemAddons | null;
}

function babySizePrice(product: NonNullable<CartItem['product']>, size: string | null | undefined, fallback: number): number {
    if (size && product.baby_size_prices?.length) {
        const match = product.baby_size_prices.find(p => p.size === size);
        if (match?.price) return match.price;
    }
    return fallback;
}

/** Flat charges for customisation add-ons (extra length, feeding zip). */
function addonCharges(item: CartItem): number {
    const product = item.product;
    if (!product || !item.addons) return 0;
    let extra = 0;
    if (item.addons.extra_length && product.extra_length_price) extra += product.extra_length_price;
    if (item.addons.feeding_zip && product.feeding_zip_price) extra += product.feeding_zip_price;
    return extra;
}

/**
 * Calculate the effective unit price for a cart item, considering combo type,
 * baby size pricing, extra babies, and customisation add-ons.
 */
export function getCartItemPrice(item: CartItem): number {
    const product = item.product;
    if (!product) return 0;

    let base: number;

    if (item.combo_type === 'mom_baby' && product.mom_baby_combos?.[0]) {
        const combo = product.mom_baby_combos[0];
        base = combo.mom_price + babySizePrice(product, item.baby_size, combo.baby_base_price);
        // Additional babies beyond the first, each priced by its size
        for (const baby of item.addons?.babies || []) {
            base += babySizePrice(product, baby.size, combo.baby_base_price);
        }
    } else if (item.combo_type === 'family' && product.family_combos?.[0]) {
        const fCombo = product.family_combos[0];
        base = (fCombo.mother_price || 0) + (fCombo.father_price || 0)
            + babySizePrice(product, item.baby_size, fCombo.baby_base_price || 0);
    } else if (item.combo_type === 'couple' && product.couple_combos?.[0]) {
        const cCombo = product.couple_combos[0];
        base = (cCombo.women_price || 0) + (cCombo.men_price || 0);
    } else if (item.combo_type === 'baby_only') {
        // Baby dress alone — priced purely by baby size
        base = babySizePrice(product, item.baby_size || item.size, product.discount_price || product.price || 0);
    } else {
        base = product.discount_price || product.price || 0;
    }

    return base + addonCharges(item);
}

export const CartService = {
    async getCart() {
        const supabase = createSupabaseClient();

        let user = null;
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            user = authUser;
        } catch (error) {
            // Handle AbortError gracefully - common in React StrictMode
            const isAbortError = error instanceof Error &&
                (error.name === 'AbortError' || error.message?.includes('abort'));
            if (isAbortError) {
                console.log('[CartService] getUser aborted, returning empty cart');
                return [];
            }
            console.error('[CartService] Error getting user:', error);
            return [];
        }

        if (!user) return [];

        const { data, error } = await supabase
            .from('cart_items')
            .select(`
                id,
                product_id,
                size,
                quantity,
                color,
                combo_type,
                baby_size,
                created_at,
                product:products (
                    name,
                    price,
                    discount_price,
                    is_mom_baby,
                    is_family_combo,
                    images:product_images (
                         image_url
                    ),
                    mom_baby_combos (
                        mom_price,
                        baby_base_price
                    ),
                    family_combos (
                        mother_price,
                        father_price,
                        baby_base_price
                    ),
                    baby_size_prices (
                        size,
                        price
                    )
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching cart:', error);
            throw error;
        }

        // Supabase sometimes returns relation as array, ensure it's a single object
        return (data || []).map((item: any) => ({
            ...item,
            product: Array.isArray(item.product) ? item.product[0] : item.product
        })) as CartItem[];
    },

    async addToCart(productId: string, size: string, color: string | null = null, comboType: string = 'single', quantity: number = 1, babySize: string | null = null) {
        const supabase = createSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error("User not authenticated");

        // Check if item exists to update quantity
        let query = supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .eq('size', size);
            
        if (color) {
            query = query.eq('color', color);
        } else {
            query = query.is('color', null);
        }
        
        if (comboType) {
            query = query.eq('combo_type', comboType);
        }

        if (babySize) {
            query = query.eq('baby_size', babySize);
        } else {
            query = query.is('baby_size', null);
        }

        const { data: existingItem } = await query.single();

        if (existingItem) {
            const { error } = await supabase
                .from('cart_items')
                .update({ quantity: existingItem.quantity + quantity })
                .eq('id', existingItem.id);

            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('cart_items')
                .insert({
                    user_id: user.id,
                    product_id: productId,
                    size: size,
                    color: color,
                    combo_type: comboType,
                    baby_size: babySize,
                    selected_size: size,
                    selected_color: color,
                    quantity: quantity
                });

            if (error) throw error;
        }
    },

    async updateQuantity(cartItemId: string, quantity: number) {
        const supabase = createSupabaseClient();

        if (quantity <= 0) {
            return this.removeFromCart(cartItemId);
        }

        const { error } = await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('id', cartItemId);

        if (error) throw error;
    },

    async removeFromCart(cartItemId: string) {
        const supabase = createSupabaseClient();
        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', cartItemId);

        if (error) throw error;
    },

    async clearCart() {
        const supabase = createSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id);

        if (error) throw error;
    }
};
