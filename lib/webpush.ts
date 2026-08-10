import webpush from 'web-push';
import { createSupabaseAdmin } from './supabase/server';

export async function sendAdminOrderNotification(orderNumber: string, total: number, productNames: string) {
    // Read the keys here rather than at module scope: import-time reads are
    // baked in at build and cannot be changed by an env update + redeploy.
    const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    const privateVapidKey = process.env.VAPID_PRIVATE_KEY || '';
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

    if (!publicVapidKey || !privateVapidKey) {
        console.warn('[WebPush] VAPID keys not configured, skipping notification.');
        return;
    }

    webpush.setVapidDetails(vapidSubject, publicVapidKey, privateVapidKey);

    try {
        // Service role, not the cookie-scoped client. admin_push_subscriptions
        // has an RLS policy of `auth.uid() = user_id`, and these sends happen
        // from a webhook or an after() callback where the caller's session is
        // the customer's or nobody's — so the anon client always read back
        // zero rows and this function silently did nothing.
        const supabase = createSupabaseAdmin();

        // Fetch all admin subscriptions
        const { data: subs, error } = await supabase
            .from('admin_push_subscriptions')
            .select('id, subscription');

        if (error) {
            console.error('[WebPush] Error fetching subscriptions:', error);
            return;
        }

        if (!subs || subs.length === 0) return;

        const payload = JSON.stringify({
            title: `New Order Placed: #${orderNumber}`,
            body: `${productNames}\nTotal: ₹${total}`,
            url: '/admin/orders',
        });

        // Send to all registered devices
        const promises = subs.map(async (subRecord: any) => {
            try {
                await webpush.sendNotification(subRecord.subscription, payload);
            } catch (err: any) {
                // If subscription is invalid/expired (statusCode 410 or 404), we could delete it from DB here
                if (err.statusCode === 410 || err.statusCode === 404) {
                    console.log('[WebPush] Subscription expired, removing...');
                    // Delete by id — matching on the jsonb column against a
                    // JS object never matches, so dead subscriptions used to
                    // pile up and get retried on every order.
                    await supabase
                        .from('admin_push_subscriptions')
                        .delete()
                        .eq('id', subRecord.id);
                } else {
                    console.error('[WebPush] Error sending notification:', err);
                }
            }
        });

        await Promise.all(promises);
        console.log(`[WebPush] Sent notifications to ${subs.length} devices.`);
    } catch (err) {
        console.error('[WebPush] Failed to send admin notifications:', err);
    }
}
