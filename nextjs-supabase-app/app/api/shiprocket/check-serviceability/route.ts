import { NextRequest, NextResponse } from 'next/server';
import { ShiprocketService } from '@/lib/shiprocket';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const pickup_postcode = searchParams.get('pickup_postcode');
    const delivery_postcode = searchParams.get('delivery_postcode');
    const weight = searchParams.get('weight');
    const cod = searchParams.get('cod');

    if (!pickup_postcode || !delivery_postcode || !weight) {
        return NextResponse.json(
            { error: 'Missing required parameters: pickup_postcode, delivery_postcode, weight' },
            { status: 400 }
        );
    }

    try {
        const data = await ShiprocketService.checkServiceability({
            pickup_postcode: parseInt(pickup_postcode),
            delivery_postcode: parseInt(delivery_postcode),
            weight: parseFloat(weight),
            cod: cod ? parseInt(cod) : 0,
        });

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Serviceability Check Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to check serviceability' },
            { status: 500 }
        );
    }
}
