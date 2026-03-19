
import { createSupabaseClient } from "@/lib/supabase/client";

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
    };
    color?: string | null;
    combo_type?: string | null;
    baby_size?: string | null;
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
                    images:product_images (
                         image_url
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
