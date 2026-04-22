import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const OWNER_EMAIL = 'kurtisboutique23@gmail.com';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'orders@kurtisboutique.in';

export interface OrderNotificationData {
    orderNumber: string;
    total: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    shippingAddress: string;
    items: { name: string; quantity: number; price: number }[];
    paymentId: string;
}

export async function sendOwnerOrderNotification(data: OrderNotificationData) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[Email] RESEND_API_KEY not set — skipping owner notification');
        return;
    }

    const itemsHtml = data.items
        .map(item => `
            <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #f0e6ff;">${item.name}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #f0e6ff;text-align:center;">${item.quantity}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #f0e6ff;text-align:right;">₹${item.price.toFixed(2)}</td>
            </tr>`)
        .join('');

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9f5ff;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:28px 32px;">
      <h1 style="margin:0;color:#fff;font-size:22px;">🛍️ New Order Received!</h1>
      <p style="margin:6px 0 0;color:#e9d5ff;font-size:14px;">Kurtis Boutique</p>
    </div>

    <!-- Order Summary -->
    <div style="padding:24px 32px;background:#faf5ff;border-bottom:2px solid #7c3aed;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin:0;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Order Number</p>
            <p style="margin:4px 0 0;font-size:20px;font-weight:bold;color:#7c3aed;">${data.orderNumber}</p>
          </td>
          <td style="text-align:right;">
            <p style="margin:0;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Total Amount</p>
            <p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#16a34a;">₹${data.total.toFixed(2)}</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Customer Details -->
    <div style="padding:24px 32px;border-bottom:1px solid #f0e6ff;">
      <h2 style="margin:0 0 16px;font-size:16px;color:#374151;">👤 Customer Details</h2>
      <table cellpadding="0" cellspacing="0">
        <tr><td style="padding:4px 0;color:#6b7280;font-size:14px;width:100px;">Name</td><td style="padding:4px 0;font-size:14px;font-weight:600;color:#111827;">${data.customerName}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;font-size:14px;">Phone</td><td style="padding:4px 0;font-size:14px;font-weight:600;color:#111827;"><a href="tel:+91${data.customerPhone}" style="color:#7c3aed;">📞 ${data.customerPhone}</a></td></tr>
        ${data.customerEmail ? `<tr><td style="padding:4px 0;color:#6b7280;font-size:14px;">Email</td><td style="padding:4px 0;font-size:14px;color:#111827;">${data.customerEmail}</td></tr>` : ''}
        <tr><td style="padding:4px 0;color:#6b7280;font-size:14px;vertical-align:top;">Address</td><td style="padding:4px 0;font-size:14px;color:#111827;">${data.shippingAddress}</td></tr>
      </table>

      <!-- WhatsApp Quick Link -->
      <a href="https://wa.me/91${data.customerPhone}?text=${encodeURIComponent(`Hi! Your order ${data.orderNumber} from Kurtis Boutique has been confirmed ✅ We'll update you once it's shipped. Thank you! 🙏`)}"
         style="display:inline-block;margin-top:16px;padding:10px 20px;background:#25D366;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
        💬 WhatsApp Customer
      </a>
    </div>

    <!-- Order Items -->
    <div style="padding:24px 32px;border-bottom:1px solid #f0e6ff;">
      <h2 style="margin:0 0 16px;font-size:16px;color:#374151;">🛒 Order Items</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <thead>
          <tr style="background:#f5f3ff;">
            <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b7280;">Product</th>
            <th style="padding:8px 12px;text-align:center;font-size:13px;color:#6b7280;">Qty</th>
            <th style="padding:8px 12px;text-align:right;font-size:13px;color:#6b7280;">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr style="background:#f5f3ff;">
            <td colspan="2" style="padding:10px 12px;font-weight:bold;color:#374151;">Total</td>
            <td style="padding:10px 12px;text-align:right;font-weight:bold;font-size:16px;color:#16a34a;">₹${data.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;background:#f9f5ff;">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        Payment ID: ${data.paymentId} · Kurtis Boutique · kurtisboutique.in
      </p>
    </div>
  </div>
</body>
</html>`;

    const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: OWNER_EMAIL,
        subject: `🛍️ New Order ${data.orderNumber} — ₹${data.total.toFixed(2)}`,
        html,
    });

    if (error) {
        console.error('[Resend] Failed to send order notification:', error);
        throw error;
    }

    console.log(`[Resend] ✅ Order notification sent for ${data.orderNumber}`);
}
