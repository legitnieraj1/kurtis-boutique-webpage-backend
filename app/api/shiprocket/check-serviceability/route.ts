import { NextRequest, NextResponse } from 'next/server';
import { ShiprocketService } from '@/lib/shiprocket';
import { ShiprocketServiceabilityResponse } from '@/lib/shiprocket-types';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const delivery_postcode = searchParams.get('delivery_postcode');
    const weight = searchParams.get('weight') || '0.5';
    const cod = searchParams.get('cod') || '0';

    if (!delivery_postcode) {
        return NextResponse.json({ error: 'delivery_postcode is required' }, { status: 400 });
    }

    // Default pickup postcode (should be configured in env or settings)
    const pickup_postcode = process.env.SHIPROCKET_PICKUP_POSTCODE ?
        parseInt(process.env.SHIPROCKET_PICKUP_POSTCODE) :
        110001; // Fallback or throw error

    try {
        const response = await ShiprocketService.checkServiceability({
            pickup_postcode,
            delivery_postcode: parseInt(delivery_postcode),
            weight: parseFloat(weight),
            cod: parseInt(cod),
        }) as unknown as ShiprocketServiceabilityResponse;

        if (response.status === 200 && response.data?.available_courier_companies?.length > 0) {
            // Find the cheapest or recommended courier
            // For now, let's take the recommended one or the first one if not found
            const couriers = response.data.available_courier_companies;
            // Sort by rate to get the cheapest? Or use recommended?
            // Let's perform a simple sort by rate
            couriers.sort((a, b) => a.rate - b.rate);

            const bestCourier = couriers[0];

            return NextResponse.json({
                shipping_cost: bestCourier.rate,
                cod_charges: bestCourier.cod_charges || 0,
                courier_name: bestCourier.courier_name,
                etd: bestCourier.etd,
                success: true
            });
        }

        return NextResponse.json({
            error: 'No courier service available for this pincode',
            success: false
        });

    } catch (error: any) {
        console.error('Serviceability check error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to check serviceability',
            success: false
        }, { status: 500 });
    }
}
