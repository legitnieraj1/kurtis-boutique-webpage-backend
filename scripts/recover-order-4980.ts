import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

import { createClient } from '@supabase/supabase-js';
import { decrementStockForOrder } from '../lib/stock';
import { sendOrderPlacedEmails, type OrderEmailPayload } from '../lib/orderEmails';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration in .env.local');
    process.exit(1);
}

const adminDb = createClient(supabaseUrl, supabaseServiceKey);

async function recover4980Order() {
    console.log('--- Starting recovery of ₹4,980 order ---');

    const targetRazorpayOrderId = 'order_Ts4iUhXgaHETpM';

    // 1. Check if already exists in orders
    const { data: existing, error: checkErr } = await adminDb
        .from('orders')
        .select('id, order_number, total, razorpay_order_id, customer_email')
        .or(`razorpay_order_id.eq.${targetRazorpayOrderId},and(total.eq.4980,customer_email.eq.amiablerama@gmail.com)`);

    if (checkErr) {
        console.error('Error checking existing orders:', checkErr);
        process.exit(1);
    }

    if (existing && existing.length > 0) {
        console.log('Order already exists in orders table! Skipping to prevent duplication:', existing);
        return;
    }

    // 2. Fetch the session
    const { data: session, error: sessionErr } = await adminDb
        .from('checkout_sessions')
        .select('*')
        .eq('razorpay_order_id', targetRazorpayOrderId)
        .single();

    if (sessionErr || !session) {
        console.error('Could not find checkout session for', targetRazorpayOrderId, sessionErr);
        process.exit(1);
    }

    console.log('Found checkout session:');
    console.log('  Customer:', session.shipping_address?.name);
    console.log('  Phone:', session.shipping_address?.phone);
    console.log('  Email:', session.customer_email);
    console.log('  Total: ₹', session.total);
    console.log('  Cart items:', session.cart_items?.length);

    // 3. Create or find guest auth user
    const guestPhone = session.shipping_address?.phone || '9176168310';
    const guestEmail = `guest-${Date.now()}-${guestPhone.slice(-4)}@checkout.kurtisboutique.in`;
    const guestPassword = `Guest_${Date.now()}_Pass!`;

    const { data: authData, error: authErr } = await adminDb.auth.admin.createUser({
        email: guestEmail,
        password: guestPassword,
        email_confirm: true,
        user_metadata: {
            is_guest: true,
            full_name: session.shipping_address?.name || 'Rama S'
        }
    });

    if (authErr || !authData?.user) {
        console.error('Failed to create guest user:', authErr);
        process.exit(1);
    }

    const userId = authData.user.id;
    console.log('Created guest auth user:', userId, guestEmail);

    // 4. Determine sequential order number
    // Total orders was 110. This order is #111.
    // Format: KB20261025-111
    const orderNumber = 'KB20261025-111';

    const shippingAddress = session.shipping_address || {};
    const cartItems = session.cart_items || [];
    const customerEmail = session.customer_email || 'amiablerama@gmail.com';
    const subtotal = Number(session.subtotal) || 4900;
    const shippingCost = Number(session.shipping_cost) || 80;
    const total = Number(session.total) || 4980;

    const orderInsertData = {
        user_id: userId,
        order_number: orderNumber,
        status: 'confirmed',
        subtotal,
        shipping_cost: shippingCost,
        discount_amount: 0,
        total,
        razorpay_order_id: targetRazorpayOrderId,
        shipping_name: (shippingAddress.name || 'Rama S').trim(),
        shipping_phone: (shippingAddress.phone || '9176168310').trim(),
        shipping_address_line1: (shippingAddress.address || '28, Phase 2 chettinad enclave').trim(),
        shipping_address_line2: '',
        shipping_city: (shippingAddress.city || 'Chennai').trim(),
        shipping_state: (shippingAddress.state || 'Tamil Nadu').trim(),
        shipping_pincode: (shippingAddress.pincode || '600100').trim(),
        customer_email: customerEmail.trim().toLowerCase(),
        created_at: session.created_at || new Date().toISOString(),
    };

    console.log('Inserting order into database:', orderInsertData);
    const { data: newOrder, error: insertErr } = await adminDb
        .from('orders')
        .insert(orderInsertData)
        .select()
        .single();

    if (insertErr || !newOrder) {
        console.error('Failed to insert order:', insertErr);
        process.exit(1);
    }

    console.log('Successfully created order record:', newOrder.id, newOrder.order_number);

    // 5. Insert order items
    const orderItemsData = cartItems.map((item: any) => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        product_name: item.product_name || 'NP04 Narayanpet Checked Maxi',
        product_image: item.product_image || null,
        size: item.size || 'N/A',
        color: item.color || null,
        combo_type: item.combo_type || 'family',
        baby_size: item.baby_size || '4 - 6 years',
        quantity: Math.max(1, Number(item.quantity) || 1),
        unit_price: Math.max(0, Number(item.unit_price) || 4900),
        total_price: Math.max(0, Number(item.unit_price || 4900) * (Number(item.quantity) || 1)),
    }));

    const { error: itemsErr } = await adminDb.from('order_items').insert(orderItemsData);
    if (itemsErr) {
        console.error('Error inserting order items:', itemsErr);
    } else {
        console.log('Inserted order items count:', orderItemsData.length);
    }

    // 6. Timeline
    await adminDb.from('order_timeline').insert({
        order_id: newOrder.id,
        status: 'confirmed',
        description: `Recovered missing order | Razorpay Order: ${targetRazorpayOrderId} | Session: checkout_sessions verified`,
    });
    console.log('Timeline entry created.');

    // 7. Decrement stock
    try {
        await decrementStockForOrder(adminDb, cartItems, orderNumber);
        console.log('Stock decremented successfully.');
    } catch (stockErr) {
        console.warn('Stock decrement note:', stockErr);
    }

    // 8. Mark session as used
    await adminDb.from('checkout_sessions').update({ used: true }).eq('razorpay_order_id', targetRazorpayOrderId);
    console.log('Checkout session marked as used.');

    // 9. Update global order counter table
    await adminDb.from('order_number_seq').upsert({ date_key: 'GLOBAL', last_seq: 111 });
    console.log('Global order counter updated to 111.');

    // 10. Send order placed emails
    console.log('Sending customer confirmation and admin alert emails...');
    const emailPayload: OrderEmailPayload = {
        orderId: newOrder.id,
        orderNumber: newOrder.order_number,
        customerEmail: customerEmail.trim(),
        customerName: newOrder.shipping_name,
        customerPhone: newOrder.shipping_phone,
        items: orderItemsData,
        subtotal: Number(newOrder.subtotal),
        shippingCost: Number(newOrder.shipping_cost),
        total: Number(newOrder.total),
        address: {
            line1: newOrder.shipping_address_line1,
            line2: newOrder.shipping_address_line2,
            city: newOrder.shipping_city,
            state: newOrder.shipping_state,
            pincode: newOrder.shipping_pincode,
        },
        paymentId: targetRazorpayOrderId,
        source: 'recovery-fix',
    };

    await sendOrderPlacedEmails(emailPayload, { force: true });
    console.log('Email dispatch routine completed.');

    console.log('=== RECOVERY COMPLETE ===');
    console.log(`Order ${orderNumber} is now live in the admin panel!`);
}

recover4980Order().catch(console.error);
