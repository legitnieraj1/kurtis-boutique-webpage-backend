import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createSupabaseAdmin } from '@/lib/supabase/server';
import { getShippingRates, isTamilNaduPincode } from '@/lib/shipping';

// GET /api/settings/shipping - Current shipping rates (public).
// Optional ?pincode= returns the applicable rate for that pincode.
export async function GET(request: NextRequest) {
    try {
        const rates = await getShippingRates();
        const pincode = new URL(request.url).searchParams.get('pincode');

        if (pincode && /^\d{6}$/.test(pincode)) {
            const cost = isTamilNaduPincode(pincode) ? rates.tn : rates.outside;
            return NextResponse.json({ rates, pincode, shipping_cost: cost });
        }

        return NextResponse.json({ rates }, {
            headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' }
        });
    } catch (error) {
        console.error('Shipping settings GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/settings/shipping - Update rates (admin only)
export async function PUT(request: NextRequest) {
    try {
        await requireAdmin();
        const { tn, outside } = await request.json();

        const tnNum = Number(tn);
        const outsideNum = Number(outside);
        if (!Number.isFinite(tnNum) || tnNum < 0 || !Number.isFinite(outsideNum) || outsideNum < 0) {
            return NextResponse.json({ error: 'Rates must be non-negative numbers' }, { status: 400 });
        }

        const supabase = createSupabaseAdmin();
        const { error } = await supabase.from('store_settings').upsert([
            { key: 'shipping_tn', value: String(tnNum), updated_at: new Date().toISOString() },
            { key: 'shipping_outside', value: String(outsideNum), updated_at: new Date().toISOString() },
        ]);

        if (error) {
            console.error('Shipping settings update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, rates: { tn: tnNum, outside: outsideNum } });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Shipping settings PUT error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
