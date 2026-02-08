import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // Update Supabase auth session
    const response = await updateSession(request);

    // Protected routes that require authentication
    const protectedPaths = ['/account', '/orders', '/wishlist', '/dashboard'];
    const adminPaths = ['/admin'];

    const path = request.nextUrl.pathname;

    // Check if path requires protection
    const isProtectedPath = protectedPaths.some(p => path.startsWith(p));
    const isAdminPath = adminPaths.some(p => path.startsWith(p));

    // For now, let the client-side handle redirects
    // Server-side auth checks will be done in API routes

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
