import { NextRequest, NextResponse } from 'next/server';
import { ShiprocketService } from '@/lib/shiprocket';

export async function GET(req: NextRequest, { params }: { params: { awb: string } }) {
    const awb = params.awb;

    if (!awb) {
        return NextResponse.json({ error: 'AWB is required' }, { status: 400 });
    }

    try {
        const trackingData = await ShiprocketService.trackByAWB(awb);
        return NextResponse.json(trackingData);
    } catch (error: any) {
        console.error('Tracking Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch tracking info' },
            { status: 500 }
        );
    }
}
