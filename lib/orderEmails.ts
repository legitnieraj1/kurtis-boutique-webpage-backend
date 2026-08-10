/**
 * Order-placed notifications: a confirmation for the customer and an alert
 * for the shop owner.
 *
 * Both order-creation paths (app/api/razorpay/verify and
 * app/api/webhooks/razorpay) call `sendOrderPlacedEmails`. It claims the
 * order atomically first, so only one of them can ever send.
 */

import { createSupabaseAdmin } from './supabase/server';
import { sendEmail } from './email';

const WHATSAPP_NUMBER = '919787635982';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kurtisboutique.in')
    .replace(/\/$/, '')
    .replace(/^(?!https?:\/\/)/, 'https://');

// Brand palette, hex equivalents of the oklch tokens in app/globals.css.
// Email clients understand neither oklch nor CSS variables.
const COLORS = {
    ink: '#3a3634',
    muted: '#7c736d',
    primary: '#5c1f22',
    gold: '#c9a961',
    border: '#e7e1da',
    surface: '#faf7f2',
};

export interface OrderEmailItem {
    product_name: string;
    size?: string | null;
    color?: string | null;
    baby_size?: string | null;
    combo_type?: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export interface OrderEmailPayload {
    orderId: string;
    orderNumber: string;
    customerEmail: string | null;
    customerName: string;
    customerPhone: string;
    items: OrderEmailItem[];
    subtotal: number;
    shippingCost: number;
    total: number;
    address: {
        line1: string;
        line2?: string | null;
        city: string;
        state: string;
        pincode: string;
    };
    paymentId?: string;
    /** 'verify' | 'webhook' | 'manual' — shown in the admin footer and logs. */
    source: string;
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function formatINR(amount: number): string {
    return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(
        Math.round(amount || 0)
    )}`;
}

function escapeHtml(value: string): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** The server runs UTC on Vercel; customers read IST. */
function nowInIST(): string {
    return new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

/** Readable names for the combo_type values stored on order items. */
const COMBO_LABELS: Record<string, string> = {
    mom_baby: 'Mom & Baby combo',
    family: 'Family combo',
    couple: 'Couples combo',
    baby_only: 'Baby only',
};

/**
 * Variant line under a product name. Skips the stored defaults — size is
 * written as 'N/A' when a product has none, combo_type as 'single'.
 */
function variantLine(item: OrderEmailItem): string {
    const parts: string[] = [];
    if (item.size && item.size !== 'N/A') parts.push(item.size);
    if (item.color) parts.push(item.color);
    if (item.baby_size) parts.push(`Baby: ${item.baby_size}`);
    if (item.combo_type && item.combo_type !== 'single') {
        parts.push(COMBO_LABELS[item.combo_type] || item.combo_type.replace(/_/g, ' '));
    }
    return parts.join(' · ');
}

function addressLines(p: OrderEmailPayload): string[] {
    return [
        p.customerName,
        p.address.line1,
        p.address.line2 || '',
        `${p.address.city}, ${p.address.state} ${p.address.pincode}`,
        `Phone: ${p.customerPhone}`,
    ].filter(Boolean);
}

function itemRows(items: OrderEmailItem[]): string {
    return items
        .map((item) => {
            const variant = variantLine(item);
            return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${COLORS.border};font-size:14px;color:${COLORS.ink};">
            ${escapeHtml(item.product_name)}
            ${variant ? `<div style="font-size:12px;color:${COLORS.muted};padding-top:3px;">${escapeHtml(variant)}</div>` : ''}
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid ${COLORS.border};font-size:14px;color:${COLORS.muted};text-align:center;white-space:nowrap;">
            ${item.quantity}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid ${COLORS.border};font-size:14px;color:${COLORS.ink};text-align:right;white-space:nowrap;">
            ${formatINR(item.total_price)}
          </td>
        </tr>`;
        })
        .join('');
}

function totalsRows(p: OrderEmailPayload): string {
    const row = (label: string, value: string, bold = false) => `
        <tr>
          <td style="padding:6px 0;font-size:${bold ? '15px' : '14px'};color:${bold ? COLORS.ink : COLORS.muted};${bold ? 'font-weight:600;' : ''}">${label}</td>
          <td style="padding:6px 0;font-size:${bold ? '15px' : '14px'};color:${COLORS.ink};text-align:right;${bold ? 'font-weight:600;' : ''}">${value}</td>
        </tr>`;

    return (
        row('Subtotal', formatINR(p.subtotal)) +
        row('Shipping', p.shippingCost > 0 ? formatINR(p.shippingCost) : 'Free') +
        row('Total paid', formatINR(p.total), true)
    );
}

/** Outer shell: 600px, table-based, inline styles. No flexbox, no web fonts. */
function shell(preheader: string, body: string): string {
    return `<!-- ${escapeHtml(preheader)} -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.surface};padding:24px 12px;font-family:Georgia,'Times New Roman',serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${COLORS.border};border-radius:10px;">
        <tr>
          <td style="padding:28px 28px 8px 28px;text-align:center;border-bottom:1px solid ${COLORS.border};">
            <div style="font-size:22px;letter-spacing:1px;color:${COLORS.primary};">Kurtis Boutique</div>
            <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.gold};padding:6px 0 18px 0;">Designer Ethnic Wear</div>
          </td>
        </tr>
        <tr><td style="padding:24px 28px 28px 28px;font-family:Helvetica,Arial,sans-serif;">${body}</td></tr>
      </table>
      <div style="max-width:600px;padding:16px 8px;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:${COLORS.muted};text-align:center;">
        Kurtis Boutique · <a href="${SITE_URL}" style="color:${COLORS.muted};">kurtisboutique.in</a>
      </div>
    </td>
  </tr>
</table>`;
}

/* ------------------------------------------------------------------ */
/* templates                                                           */
/* ------------------------------------------------------------------ */

export function renderCustomerOrderConfirmation(p: OrderEmailPayload): {
    subject: string;
    html: string;
    text: string;
} {
    const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        `Hi, I have a question about my order ${p.orderNumber}`
    )}`;

    const html = shell(
        `Your order ${p.orderNumber} is confirmed. Total ${formatINR(p.total)}.`,
        `
    <p style="margin:0 0 6px 0;font-size:16px;color:${COLORS.ink};">Hi ${escapeHtml(p.customerName)},</p>
    <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:${COLORS.muted};">
      Thank you for your order. We have received your payment and started getting it ready.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.surface};border-radius:8px;margin-bottom:22px;">
      <tr>
        <td style="padding:14px 16px;font-size:13px;color:${COLORS.muted};">
          Order number<div style="font-size:16px;color:${COLORS.ink};font-weight:600;padding-top:2px;">${escapeHtml(p.orderNumber)}</div>
        </td>
        <td style="padding:14px 16px;font-size:13px;color:${COLORS.muted};text-align:right;">
          Placed on<div style="font-size:14px;color:${COLORS.ink};padding-top:2px;">${nowInIST()} IST</div>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td style="padding-bottom:6px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.muted};">Your order</td>
        <td style="padding-bottom:6px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.muted};text-align:center;">Qty</td>
        <td style="padding-bottom:6px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.muted};text-align:right;">Amount</td>
      </tr>
      ${itemRows(p.items)}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 24px 0;">
      ${totalsRows(p)}
    </table>

    <div style="border:1px solid ${COLORS.border};border-radius:8px;padding:16px;margin-bottom:22px;">
      <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.muted};padding-bottom:8px;">Delivering to</div>
      <div style="font-size:14px;line-height:1.6;color:${COLORS.ink};">
        ${addressLines(p).map((line) => escapeHtml(line)).join('<br>')}
      </div>
      <div style="font-size:12px;color:${COLORS.muted};padding-top:10px;">
        Something wrong? Reply to this email within 24 hours and we will fix it before dispatch.
      </div>
    </div>

    <div style="background:${COLORS.surface};border-radius:8px;padding:16px;margin-bottom:22px;">
      <div style="font-size:13px;line-height:1.7;color:${COLORS.ink};">
        <strong>What happens next</strong><br>
        Processing: 3 to 7 working days<br>
        Delivery: 5 to 10 working days<br>
        We will message you on WhatsApp with tracking as soon as it ships.
      </div>
    </div>

    <p style="margin:0 0 18px 0;font-size:13px;line-height:1.7;color:${COLORS.muted};">
      Questions? <a href="${waHref}" style="color:${COLORS.primary};">Message us on WhatsApp</a> or simply reply to this email.
    </p>

    <p style="margin:0;font-size:12px;color:${COLORS.muted};">
      <a href="${SITE_URL}/exchange-and-shipping" style="color:${COLORS.muted};">Shipping &amp; returns</a> ·
      <a href="${SITE_URL}/privacy-policy" style="color:${COLORS.muted};">Privacy</a>
    </p>`
    );

    const text = [
        `Hi ${p.customerName},`,
        '',
        `Thank you for your order. Payment received.`,
        `Order ${p.orderNumber} — placed ${nowInIST()} IST`,
        '',
        ...p.items.map((item) => {
            const variant = variantLine(item);
            return `- ${item.product_name}${variant ? ` (${variant})` : ''} x${item.quantity} — ${formatINR(item.total_price)}`;
        }),
        '',
        `Subtotal: ${formatINR(p.subtotal)}`,
        `Shipping: ${p.shippingCost > 0 ? formatINR(p.shippingCost) : 'Free'}`,
        `Total paid: ${formatINR(p.total)}`,
        '',
        'Delivering to:',
        ...addressLines(p),
        '',
        'Processing: 3 to 7 working days. Delivery: 5 to 10 working days.',
        'We will message you on WhatsApp with tracking once it ships.',
        '',
        `Questions? WhatsApp ${waHref} or reply to this email.`,
    ].join('\n');

    return {
        subject: `Order confirmed — ${p.orderNumber} | Kurtis Boutique`,
        html,
        text,
    };
}

export function renderAdminOrderAlert(p: OrderEmailPayload): {
    subject: string;
    html: string;
    text: string;
} {
    const singleLineAddress = [
        p.customerName,
        p.address.line1,
        p.address.line2 || '',
        p.address.city,
        p.address.state,
        p.address.pincode,
        p.customerPhone,
    ]
        .filter(Boolean)
        .join(', ');

    const html = shell(
        `${p.orderNumber} · ${formatINR(p.total)} · ${p.address.city}`,
        `
    <p style="margin:0 0 18px 0;font-size:16px;color:${COLORS.ink};">
      New order <strong>${escapeHtml(p.orderNumber)}</strong> — ${formatINR(p.total)}
    </p>

    <div style="border:1px solid ${COLORS.border};border-radius:8px;padding:16px;margin-bottom:20px;">
      <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.muted};padding-bottom:8px;">Customer</div>
      <div style="font-size:14px;line-height:1.8;color:${COLORS.ink};">
        ${escapeHtml(p.customerName)}<br>
        <a href="tel:+91${escapeHtml(p.customerPhone)}" style="color:${COLORS.primary};">+91 ${escapeHtml(p.customerPhone)}</a>
        · <a href="https://wa.me/91${escapeHtml(p.customerPhone)}" style="color:${COLORS.primary};">WhatsApp</a><br>
        ${p.customerEmail
            ? `<a href="mailto:${escapeHtml(p.customerEmail)}" style="color:${COLORS.primary};">${escapeHtml(p.customerEmail)}</a>`
            : `<span style="color:${COLORS.muted};">No email captured</span>`}
      </div>
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td style="padding-bottom:6px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.muted};">Items</td>
        <td style="padding-bottom:6px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.muted};text-align:center;">Qty</td>
        <td style="padding-bottom:6px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.muted};text-align:right;">Amount</td>
      </tr>
      ${itemRows(p.items)}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 20px 0;">
      ${totalsRows(p)}
    </table>

    <div style="border:1px solid ${COLORS.border};border-radius:8px;padding:16px;margin-bottom:20px;">
      <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.muted};padding-bottom:8px;">Ship to</div>
      <div style="font-size:14px;line-height:1.6;color:${COLORS.ink};">
        ${addressLines(p).map((line) => escapeHtml(line)).join('<br>')}
      </div>
      <div style="font-size:12px;color:${COLORS.muted};padding-top:10px;word-break:break-word;">
        Copy for courier: ${escapeHtml(singleLineAddress)}
      </div>
    </div>

    <a href="${SITE_URL}/admin/orders/${escapeHtml(p.orderId)}"
       style="display:inline-block;background:${COLORS.primary};color:#ffffff;text-decoration:none;font-size:14px;padding:12px 22px;border-radius:999px;">
      Open in admin
    </a>

    <p style="margin:20px 0 0 0;font-size:11px;color:${COLORS.muted};">
      ${p.paymentId ? `Payment ${escapeHtml(p.paymentId)} · ` : ''}Created via ${escapeHtml(p.source)}
    </p>`
    );

    const text = [
        `New order ${p.orderNumber} — ${formatINR(p.total)}`,
        '',
        `${p.customerName} · +91 ${p.customerPhone} · ${p.customerEmail || 'no email'}`,
        '',
        ...p.items.map((item) => {
            const variant = variantLine(item);
            return `- ${item.product_name}${variant ? ` (${variant})` : ''} x${item.quantity} — ${formatINR(item.total_price)}`;
        }),
        '',
        `Subtotal ${formatINR(p.subtotal)} · Shipping ${formatINR(p.shippingCost)} · Total ${formatINR(p.total)}`,
        '',
        `Ship to: ${singleLineAddress}`,
        '',
        `${SITE_URL}/admin/orders/${p.orderId}`,
        `${p.paymentId ? `Payment ${p.paymentId} · ` : ''}via ${p.source}`,
    ].join('\n');

    return {
        subject: `New order ${p.orderNumber} — ${formatINR(p.total)} — ${p.address.city}`,
        html,
        text,
    };
}

/* ------------------------------------------------------------------ */
/* orchestration                                                       */
/* ------------------------------------------------------------------ */

/** Alert recipients, comma-separated in ADMIN_ORDER_EMAIL. */
export function getAdminRecipients(): string[] {
    return (process.env.ADMIN_ORDER_EMAIL || '')
        .split(',')
        .map((address) => address.trim())
        .filter(Boolean);
}

/**
 * Sends the customer confirmation and the admin alert exactly once per order.
 *
 * Both order-creation paths call this. The atomic claim below means only the
 * first caller sends; everyone else logs and returns. Never throws — a mail
 * problem must not affect an order that has already been paid for.
 *
 * The claim is taken BEFORE sending, so a provider outage loses the email
 * rather than risking a duplicate. Re-send from /api/admin/test-order-email
 * with `force` if that happens.
 */
export async function sendOrderPlacedEmails(
    p: OrderEmailPayload,
    options: { force?: boolean } = {}
): Promise<void> {
    try {
        if (!options.force) {
            const supabase = createSupabaseAdmin();
            const { data: claimed, error } = await supabase
                .from('orders')
                .update({ confirmation_email_sent_at: new Date().toISOString() })
                .eq('id', p.orderId)
                .is('confirmation_email_sent_at', null)
                .select('id');

            if (error) {
                console.error(`[OrderEmail] ${p.orderNumber} claim failed:`, error.message);
                return;
            }
            if (!claimed || claimed.length === 0) {
                console.log(`[OrderEmail] ${p.orderNumber} already notified — skipping (${p.source})`);
                return;
            }
        }

        const admins = getAdminRecipients();

        // allSettled, not all: a bouncing customer address must not stop the
        // owner's alert.
        const [customerResult, adminResult] = await Promise.allSettled([
            p.customerEmail
                ? sendEmail({ to: p.customerEmail, ...renderCustomerOrderConfirmation(p) })
                : Promise.resolve({ ok: false, reason: 'no_recipient' as const }),
            admins.length
                ? sendEmail({
                    to: admins,
                    replyTo: p.customerEmail || undefined,
                    ...renderAdminOrderAlert(p),
                })
                : Promise.resolve({ ok: false, reason: 'no_recipient' as const }),
        ]);

        const describe = (result: PromiseSettledResult<{ ok: boolean; reason?: string }>) =>
            result.status === 'rejected'
                ? 'threw'
                : result.value.ok
                    ? 'ok'
                    : result.value.reason || 'failed';

        console.log(
            `[OrderEmail] ${p.orderNumber} customer=${describe(customerResult)} admin=${describe(adminResult)} (${p.source})`
        );
    } catch (error) {
        console.error(`[OrderEmail] ${p.orderNumber} unexpected failure:`, error);
    }
}
