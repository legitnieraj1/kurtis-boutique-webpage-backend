import { createSupabasePublic } from '@/lib/supabase/server';

export const DEFAULT_SHIPPING_TN = 80;
export const DEFAULT_SHIPPING_OUTSIDE = 150;

// Tamil Nadu pincodes start with 60–64 (600xxx–643xxx).
export function isTamilNaduPincode(pincode: string): boolean {
    return /^6[0-4]\d{4}$/.test(pincode.trim());
}

export async function getShippingRates(): Promise<{ tn: number; outside: number }> {
    try {
        const supabase = createSupabasePublic();
        const { data } = await supabase
            .from('store_settings')
            .select('key, value')
            .in('key', ['shipping_tn', 'shipping_outside']);

        const map = Object.fromEntries((data || []).map(r => [r.key, Number(r.value)]));
        return {
            tn: map.shipping_tn > 0 ? map.shipping_tn : DEFAULT_SHIPPING_TN,
            outside: map.shipping_outside > 0 ? map.shipping_outside : DEFAULT_SHIPPING_OUTSIDE,
        };
    } catch {
        return { tn: DEFAULT_SHIPPING_TN, outside: DEFAULT_SHIPPING_OUTSIDE };
    }
}

// Flat shipping by destination pincode. No free-shipping threshold.
export async function calculateShipping(pincode: string): Promise<number> {
    const rates = await getShippingRates();
    return isTamilNaduPincode(pincode) ? rates.tn : rates.outside;
}
