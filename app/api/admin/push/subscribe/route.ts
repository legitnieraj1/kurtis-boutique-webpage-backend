import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const supabase = await createSupabaseServerClient();

        // Ensure user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const subscription = await request.json();

        // Check if subscription already exists to avoid duplicates
        const { data: existing } = await supabase
            .from('admin_push_subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .contains('subscription', subscription);
            
        if (!existing || existing.length === 0) {
            const { error: insertError } = await supabase
                .from('admin_push_subscriptions')
                .insert({
                    user_id: user.id,
                    subscription: subscription
                });

            if (insertError) throw insertError;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Push Subscribe Error:', error);
        return NextResponse.json({ error: 'Failed to subscribe to push notifications' }, { status: 500 });
    }
}
