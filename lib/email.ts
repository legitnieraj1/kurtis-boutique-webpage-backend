/**
 * Transactional email over the Resend REST API.
 *
 * Deliberately dependency-free: the whole send API is one POST, so the SDK
 * would add a package for no benefit, and swapping providers later stays a
 * change inside `sendEmail` rather than a dependency migration.
 *
 * The contract every caller relies on: this module NEVER throws. It is called
 * from order-creation paths where a mail failure must not surface to the
 * customer or roll anything back.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const SEND_TIMEOUT_MS = 8000;

export interface SendEmailArgs {
    to: string | string[];
    subject: string;
    html: string;
    /** Plain-text alternative. Derived from the HTML when omitted. */
    text?: string;
    /** Set to the customer address on admin alerts so Reply reaches them. */
    replyTo?: string;
}

export type SendEmailResult =
    | { ok: true; id: string }
    | {
        ok: false;
        reason: 'not_configured' | 'no_recipient' | 'api_error' | 'network';
        detail?: string;
    };

/** True when both the API key and the from-address are configured. */
export function isEmailConfigured(): boolean {
    return !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

/** Crude HTML-to-text fallback. Gmail scores HTML-only mail worse. */
function htmlToText(html: string): string {
    return html
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|tr|h[1-6])>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#8377;|&rupee;/g, '₹')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
    // Read env inside the function: module-scope reads bake values in at
    // import time and make this untestable.
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !from) {
        console.warn('[Email] RESEND_API_KEY / RESEND_FROM_EMAIL not set — skipping send.');
        return { ok: false, reason: 'not_configured' };
    }

    const recipients = (Array.isArray(args.to) ? args.to : [args.to])
        .map((address) => address?.trim())
        .filter((address): address is string => !!address && address.includes('@'));

    if (recipients.length === 0) {
        return { ok: false, reason: 'no_recipient' };
    }

    try {
        const response = await fetch(RESEND_ENDPOINT, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from,
                to: recipients,
                subject: args.subject,
                html: args.html,
                text: args.text || htmlToText(args.html),
                ...(args.replyTo ? { reply_to: args.replyTo } : {}),
            }),
            // A hung connection must not hold the serverless invocation open.
            signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
        });

        if (!response.ok) {
            // Resend returns readable JSON errors ("domain is not verified",
            // "You can only send testing emails to your own address"). Truncate
            // so an HTML error page cannot flood the logs.
            const detail = (await response.text().catch(() => '')).slice(0, 300);
            console.error(`[Email] Resend responded ${response.status}: ${detail}`);
            return { ok: false, reason: 'api_error', detail: `${response.status} ${detail}` };
        }

        const data = await response.json().catch(() => ({}));
        return { ok: true, id: data?.id || 'unknown' };
    } catch (error: any) {
        const detail = error?.name === 'TimeoutError'
            ? `timed out after ${SEND_TIMEOUT_MS}ms`
            : error?.message || String(error);
        console.error('[Email] Send failed:', detail);
        return { ok: false, reason: 'network', detail };
    }
}
