import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Server-side gate for the admin panel.
 *
 * Next.js 16 renamed the `middleware` file convention to `proxy`; this is
 * the same interception point under its current name.
 *
 * Previously this file only refreshed the session and returned — the
 * comment said "let the client-side handle redirects". That is not a
 * security boundary: AdminLayout's `user.role !== 'admin'` check runs in
 * the browser, off Zustand state seeded from a localStorage role cache,
 * so anyone could set that key and have the whole admin panel render.
 * The gate now runs here, on the server, before any admin page is sent.
 */

const ADMIN_LOGIN = '/admin/login';

export async function proxy(request: NextRequest) {
    const { response, supabase, user } = await updateSession(request);

    const path = request.nextUrl.pathname;
    const isAdminPath = path === '/admin' || path.startsWith('/admin/');

    if (!isAdminPath || path === ADMIN_LOGIN) {
        return response;
    }

    // Not signed in at all — anonymous sessions count as not signed in,
    // since the storefront signs guests in anonymously to place orders.
    if (!user || user.is_anonymous) {
        return redirectToLogin(request);
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    // Fail closed. A lookup that errors is not proof of admin.
    if (error || profile?.role !== 'admin') {
        return redirectToLogin(request);
    }

    // Signed in and verified admin — let the page render, keeping any
    // refreshed auth cookies the session update produced.
    return response;
}

function redirectToLogin(request: NextRequest) {
    const url = request.nextUrl.clone();
    url.pathname = ADMIN_LOGIN;
    url.search = '';
    const redirect = NextResponse.redirect(url);
    // Admin pages must never be cached by a CDN or the browser's bfcache,
    // or a signed-out visitor could be served the previous admin's HTML.
    redirect.headers.set('Cache-Control', 'no-store, must-revalidate');
    return redirect;
}

export const config = {
    matcher: [
        /*
         * Only run on paths that actually need a session. Every matched
         * request pays a Supabase auth round-trip, so matching the whole
         * site (as this did before) put that latency on every storefront
         * page view for no benefit — public pages read no user state on
         * the server, and the browser client refreshes its own token.
         */
        '/admin/:path*',
        '/account/:path*',
        '/orders/:path*',
        '/wishlist/:path*',
        '/dashboard/:path*',
        '/checkout/:path*',
    ],
};
