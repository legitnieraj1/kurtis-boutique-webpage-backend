import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';

export async function createSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch {
                        // Handle cookies in middleware or server components
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch {
                        // Handle cookies in middleware or server components
                    }
                },
            },
        }
    );
}

function buildAdminClient(supabaseUrl: string, serviceRoleKey: string) {
    return createServerClient(
        supabaseUrl,
        serviceRoleKey,
        {
            cookies: {
                get(name: string) { return '' },
                set(name: string, value: string, options: CookieOptions) { },
                remove(name: string, options: CookieOptions) { },
            },
        }
    );
}

// The service-role client carries no per-request state (its cookie
// handlers are deliberately inert), so one instance can be reused for the
// whole process instead of rebuilding it on every API call.
let adminClient: ReturnType<typeof buildAdminClient> | null = null;

export function createSupabaseAdmin() {
    if (adminClient) return adminClient;

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey) {
        console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set!");
        throw new Error("Server configuration error: Missing SUPABASE_SERVICE_ROLE_KEY");
    }
    if (!supabaseUrl) {
        console.error("CRITICAL: NEXT_PUBLIC_SUPABASE_URL is not set!");
        throw new Error("Server configuration error: Missing SUPABASE_URL");
    }

    adminClient = buildAdminClient(supabaseUrl, serviceRoleKey);
    return adminClient;
}

// Cookie-free anon client for public cacheable routes (banners, categories, reviews).
// Using createSupabaseServerClient on public routes opts them into cookies →
// Next.js marks the response dynamic → Vercel CDN cannot cache it.
export function createSupabasePublic() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: () => '', set: () => {}, remove: () => {} } }
    );
}

/**
 * Resolves the caller once per request.
 *
 * getUser() is a network round-trip to the Supabase auth server and the
 * profiles lookup is a second one to the database. Routes routinely need
 * the answer more than once — requireAdmin() then getCurrentUser(), or
 * isAdmin() inside a handler that also reads the profile — and each call
 * used to repeat both. React's cache() memoises for the lifetime of a
 * single request, so the pair runs at most once no matter how many
 * helpers below are called.
 */
const loadSessionContext = cache(async () => {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { user: null, profile: null };

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return { user, profile };
});

// Helper to check if user is admin
export async function isAdmin() {
    const { profile } = await loadSessionContext();
    return profile?.role === 'admin';
}

// Helper to get current user with profile
export async function getCurrentUser() {
    const { user, profile } = await loadSessionContext();
    if (!user) return null;
    return { ...user, profile };
}

// Helper to require authentication
export async function requireAuth() {
    const { user } = await loadSessionContext();

    if (!user) {
        throw new Error('Unauthorized');
    }

    return user;
}

// Helper to require admin role
export async function requireAdmin() {
    const admin = await isAdmin();

    if (!admin) {
        throw new Error('Forbidden: Admin access required');
    }

    return true;
}
