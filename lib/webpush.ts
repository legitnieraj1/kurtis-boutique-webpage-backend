import webpush from 'web-push';
import { createSupabaseServerClient } from './supabase/server';

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (publicVapidKey && privateVapidKey) {
    webpush.setVapidDetails(
        vapidSubject,
        publicVapidKey,
        privateVapidKey
    );
}

export async function sendAdminOrderNotification(orderNumber: string, total: number, productNames: string) {
    if (!publicVapidKey || !privateVapidKey) {
        console.warn('[WebPush] VAPID keys not configured, skipping notification.');
        return;
    }

    try {
        const supabase = await createSupabaseServerClient();
        
        // Fetch all admin subscriptions
        const { data: subs, error } = await supabase
            .from('admin_push_subscriptions')
            .select('subscription');

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
                    await supabase
                        .from('admin_push_subscriptions')
                        .delete()
                        .eq('subscription', subRecord.subscription);
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
