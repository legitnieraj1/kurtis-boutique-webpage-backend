import { NextRequest, NextResponse } from 'next/server';
import { ShiprocketService } from '@/lib/shiprocket';
import { requireAuth } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        await requireAuth();

        const searchParams = request.nextUrl.searchParams;
        const awb = searchParams.get('awb');

        if (!awb) {
            return NextResponse.json({ error: 'AWB code is required' }, { status: 400 });
        }

        try {
            const response = await ShiprocketService.trackByAWB(awb) as any;

            // Format tracking data for frontend
            // Shiprocket returns a complex object, we want a simple timeline

            let timeline = [];
            let currentStatus = 'Unknown';
            let etd = null;

            if (response.tracking_data?.track_status === 1) {
                const data = response.tracking_data;
                currentStatus = data.current_status;
                etd = data.etd;

                if (data.shipment_track_activities) {
                    timeline = data.shipment_track_activities.map((activity: any) => ({
                        status: activity.activity,
                        date: activity.date,
                        location: activity.location,
                        description: activity.activity // Using activity as description for now
                    }));
                }
            }

            return NextResponse.json({
                success: true,
                timeline,
                currentStatus,
                etd
            });

        } catch (srError) {
            console.error("Shiprocket Tracking Error:", srError);
            return NextResponse.json({ error: 'Failed to fetch tracking info' }, { status: 500 });
        }

    } catch (error) {
        console.error('Tracking API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
