import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refreshes the Supabase auth cookie and hands the caller back both the
 * response (carrying any rotated cookies) and the verified user.
 *
 * `getUser()` is used rather than `getSession()` on purpose: getSession
 * trusts whatever is in the cookie, while getUser revalidates the JWT
 * against the Supabase auth server. Only the latter is safe to gate
 * access on, since a cookie is fully attacker-controlled.
 */
export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    return { response, supabase, user };
}
