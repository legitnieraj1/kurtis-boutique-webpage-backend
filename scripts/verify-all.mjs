import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
    console.log('=== Checking Orders in DB ===');
    const { count, error } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    if (error) {
        console.error('Count error:', error.message);
        return;
    }
    console.log(`Total orders in DB: ${count}`);

    const recoveredRzpIds = [
        'order_TkBMO7Sa6vPvvo',
        'order_TkUpAU84uMqLJH',
        'order_TkfcOuxYNv3HyL',
        'order_Tkr7LmVwXM8X3Y',
        'order_Tkv8w9meN8uZf9'
    ];

    const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select(`
            id,
            order_number,
            total,
            shipping_name,
            shipping_phone,
            customer_email,
            confirmation_email_sent_at,
            razorpay_order_id,
            items:order_items(id, product_name, size, quantity, total_price)
        `)
        .in('razorpay_order_id', recoveredRzpIds);

    if (ordersErr) {
        console.error('Fetch error:', ordersErr);
        return;
    }

    console.log(`Found ${orders.length} recovered orders in DB:`);
    for (const o of orders) {
        console.log(`- ${o.order_number} (${o.razorpay_order_id}): ₹${o.total} | ${o.shipping_name} | email: ${o.customer_email} | emailSentAt: ${o.confirmation_email_sent_at}`);
        console.log(`  Items (${o.items.length}):`, o.items.map(i => `${i.product_name} (${i.size}) x${i.quantity}`).join(', '));
    }

    const { data: sessions } = await supabase
        .from('checkout_sessions')
        .select('razorpay_order_id, used')
        .in('razorpay_order_id', recoveredRzpIds);
    console.log('Checkout sessions status:', sessions);
}

verify();
