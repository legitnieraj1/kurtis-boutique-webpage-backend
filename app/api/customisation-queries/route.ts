import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, requireAuth } from '@/lib/supabase/server';

// POST /api/customisation-queries - Submit query (authenticated)
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const supabase = await createSupabaseServerClient();
        const body = await request.json();

        const {
            product_id,
            product_name,
            message,
            customisation_types = [],
            preferred_size,
            contact_preference = 'whatsapp',
            mobile_number
        } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const { data: query, error } = await supabase
            .from('customisation_queries')
            .insert({
                user_id: user.id,
                product_id,
                product_name,
                message,
                customisation_types,
                preferred_size,
                contact_preference,
                mobile_number,
                status: 'new'
            })
            .select()
            .single();

        if (error) {
            console.error('Query creation error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ query }, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Customisation query API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
