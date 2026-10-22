import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('./.env.local', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        env[key] = val;
    }
}

// Ensure process.env has these for internal library imports
for (const [k, v] of Object.entries(env)) {
    process.env[k] = v;
}

const adminDb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sanitizePhone(raw) {
    const digits = (raw || '').replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) return digits.slice(2);
    if (digits.startsWith('0') && digits.length === 11) return digits.slice(1);
    return digits.slice(-10);
}

const MISSING_ORDER_IDS = [
    'order_TkBMO7Sa6vPvvo', // Oct 5
    'order_TkUpAU84uMqLJH', // Oct 6
    'order_TkfcOuxYNv3HyL', // Oct 6
    'order_Tkr7LmVwXM8X3Y', // Oct 7
    'order_Tkv8w9meN8uZf9', // Oct 7
];

async function recover() {
    console.log("Starting missing orders recovery...");
    
    // 1. Fetch sessions
    const { data: sessions, error: sessErr } = await adminDb
        .from('checkout_sessions')
        .select('*')
        .in('razorpay_order_id', MISSING_ORDER_IDS);

    if (sessErr) {
        console.error("Error fetching checkout_sessions:", sessErr);
        return;
    }

    console.log(`Found ${sessions.length} sessions to recover.`);

    const { decrementStockForOrder } = await import('../lib/stock.ts');
    const { sendOrderPlacedEmails } = await import('../lib/orderEmails.ts');

    for (const session of sessions) {
        const rzpOrderId = session.razorpay_order_id;
        console.log(`\n========================================`);
        console.log(`Processing ${rzpOrderId} (${session.customer_email}, ₹${session.total})...`);

        // Check if already in orders
        const { data: existing } = await adminDb
            .from('orders')
            .select('id, order_number')
            .eq('razorpay_order_id', rzpOrderId)
            .maybeSingle();

        if (existing) {
            console.log(`⚠️ Order ${existing.order_number} already exists for ${rzpOrderId} — skipping to prevent duplicates.`);
            continue;
        }

        // Resolve user_id
        let userId = null;
        try {
            // Check if profile exists for customer email
            const { data: prof } = await adminDb
                .from('profiles')
                .select('id')
                .eq('email', session.customer_email.trim().toLowerCase())
                .maybeSingle();
            
            if (prof?.id) {
                userId = prof.id;
            } else {
                // Try to create auth user
                const { data: authUser, error: authErr } = await adminDb.auth.admin.createUser({
                    email: session.customer_email.trim().toLowerCase(),
                    email_confirm: true,
                    user_metadata: {
                        full_name: session.shipping_address?.name || '',
                        phone: session.shipping_address?.phone || '',
                        source: 'recovered_order',
                    }
                });
                if (authUser?.user?.id) {
                    userId = authUser.user.id;
                    console.log(`Created auth profile for ${session.customer_email}: ${userId}`);
                } else if (authErr && authErr.message?.includes('already registered')) {
                    // Fetch existing user id from auth
                    const { data: list } = await adminDb.auth.admin.listUsers();
                    const matched = list?.users?.find(u => u.email === session.customer_email.trim().toLowerCase());
                    if (matched) userId = matched.id;
                }
            }
        } catch (e) {
            console.warn("Could not create/lookup auth user:", e.message);
        }

        // Fallback to store admin user_id if needed
        if (!userId) {
            userId = '6af3d465-e908-42d4-9c50-bb48e0645340';
            console.log(`Using fallback store admin user_id: ${userId}`);
        }

        // Determine order number with actual order date
        const d = new Date(session.created_at);
        const yyyymmdd = d.toISOString().slice(0, 10).replace(/-/g, '');
        const timePart = String(d.getUTCHours()).padStart(2, '0') + String(d.getUTCMinutes()).padStart(2, '0');
        const randSuffix = Math.floor(10 + Math.random() * 90);
        const orderNumber = `KB${yyyymmdd}-${timePart}${randSuffix}`;

        const phone10 = sanitizePhone(session.shipping_address?.phone || '');
        const shippingAddress = session.shipping_address || {};

        // Insert order
        const { data: newOrder, error: orderErr } = await adminDb
            .from('orders')
            .insert({
                order_number: orderNumber,
                user_id: userId,
                status: 'confirmed',
                subtotal: session.subtotal,
                shipping_cost: session.shipping_cost,
                discount_amount: 0,
                total: session.total,
                razorpay_order_id: rzpOrderId,
                shipping_name: (shippingAddress.name || '').trim(),
                shipping_phone: phone10,
                shipping_address_line1: (shippingAddress.address || '').trim(),
                shipping_address_line2: '',
                shipping_city: (shippingAddress.city || '').trim(),
                shipping_state: (shippingAddress.state || '').trim(),
                shipping_pincode: (shippingAddress.pincode || '').trim(),
                customer_email: (session.customer_email || '').trim().toLowerCase(),
                created_at: session.created_at,
                updated_at: session.created_at,
            })
            .select()
            .single();

        if (orderErr) {
            console.error(`❌ Failed to insert order for ${rzpOrderId}:`, orderErr);
            continue;
        }

        console.log(`✅ Created order ${newOrder.order_number} (${newOrder.id})`);

        // Insert order items
        const cartItems = session.cart_items || [];
        const orderItemsData = cartItems.map((item) => {
            const price = Math.max(0, Number(item.unit_price) || 0);
            const qty = Math.max(1, Number(item.quantity) || 1);
            return {
                order_id: newOrder.id,
                ...(item.product_id && UUID_RE.test(item.product_id) ? { product_id: item.product_id } : {}),
                product_name: item.product_name || 'Product',
                product_image: item.product_image || null,
                size: item.size || 'N/A',
                color: item.color || null,
                combo_type: item.combo_type || 'single',
                baby_size: item.baby_size || null,
                quantity: qty,
                unit_price: price,
                total_price: price * qty,
                created_at: session.created_at,
            };
        });

        if (orderItemsData.length > 0) {
            const { error: itemsErr } = await adminDb
                .from('order_items')
                .insert(orderItemsData);
            
            if (itemsErr) {
                console.error(`⚠️ Error inserting order items for ${orderNumber}:`, itemsErr);
            } else {
                console.log(`✅ Inserted ${orderItemsData.length} order items`);
            }
        }

        // Insert timeline
        await adminDb.from('order_timeline').insert({
            order_id: newOrder.id,
            status: 'confirmed',
            description: `Payment confirmed via Razorpay (${rzpOrderId})`,
            created_at: session.created_at,
        });

        // Mark session as used
        await adminDb.from('checkout_sessions').update({ used: true }).eq('razorpay_order_id', rzpOrderId);

        // Decrement stock
        console.log(`Decrementing stock for ${orderNumber}...`);
        await decrementStockForOrder(adminDb, cartItems, orderNumber);

        // Send confirmation email
        console.log(`Sending order confirmation email for ${orderNumber}...`);
        try {
            await sendOrderPlacedEmails({
                orderId: newOrder.id,
                orderNumber: newOrder.order_number,
                customerEmail: newOrder.customer_email,
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
                paymentId: rzpOrderId,
                source: 'recovery',
            }, { force: true });
            console.log(`✅ Order email notification processed for ${orderNumber}`);
        } catch (emailErr) {
            console.error(`⚠️ Email notification error for ${orderNumber}:`, emailErr);
        }
    }

    console.log("\nRecovery process finished!");
}

recover();
