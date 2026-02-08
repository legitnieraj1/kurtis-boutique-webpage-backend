import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, requireAdmin } from '@/lib/supabase/server';

// GET /api/admin/notifications - List notifications (admin only)
export async function GET(request: NextRequest) {
    try {
        await requireAdmin();
        const supabase = await createSupabaseServerClient();
        const { searchParams } = new URL(request.url);

        const unreadOnly = searchParams.get('unread') === 'true';
        const limit = parseInt(searchParams.get('limit') || '20');

        let query = supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (unreadOnly) {
            query = query.eq('is_read', false);
        }

        const { data: notifications, error } = await query;

        if (error) {
            console.error('Notifications fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get unread count
        const { count: unreadCount } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('is_read', false);

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Notifications API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/admin/notifications - Mark as read (admin only)
export async function PUT(request: NextRequest) {
    try {
        await requireAdmin();
        const supabase = await createSupabaseServerClient();
        const body = await request.json();

        const { notification_id, mark_all_read } = body;

        if (mark_all_read) {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('is_read', false);

            return NextResponse.json({ success: true, marked_all: true });
        }

        if (!notification_id) {
            return NextResponse.json({ error: 'notification_id required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notification_id);

        if (error) {
            console.error('Notification update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Notifications API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
