import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Sign-in is attempted directly against Supabase below. The previous
        // implementation first pulled the ENTIRE user list with the service
        // key and searched it for this email, which
        //   * leaked account existence — a wrong password and an unknown
        //     address returned different responses, so the endpoint could
        //     be used to enumerate which emails have accounts, and
        //   * downloaded every user row on every single login attempt,
        //     which is what made signing in slow as the store grew.
        // Supabase's own signInWithPassword already returns one uniform
        // "Invalid login credentials" error for both cases.

        // Get cookies store for handling auth cookies
        const cookieStore = await cookies();

        // Track cookies that need to be set on the response
        const cookiesToSet: Array<{ name: string; value: string; options: any }> = [];

        // Create a Supabase client with cookie tracking
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: any) {
                        // Track cookies to set on response later
                        const cookieOptions = { ...options, path: '/' };
                        cookiesToSet.push({ name, value, options: cookieOptions });
                        // Also try to set in cookie store
                        try {
                            cookieStore.set({ name, value, ...cookieOptions });
                        } catch {
                            // Handle cookies in edge runtime
                        }
                    },
                    remove(name: string, options: any) {
                        const cookieOptions = { ...options, path: '/', maxAge: 0 };
                        cookiesToSet.push({ name, value: '', options: cookieOptions });
                        try {
                            cookieStore.set({ name, value: '', ...cookieOptions });
                        } catch {
                            // Handle cookies in edge runtime
                        }
                    },
                },
            }
        );

        // Now sign in - this will collect cookies to set
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            console.error('Sign in error:', signInError);
            return NextResponse.json(
                { error: signInError.message },
                { status: 400 }
            );
        }

        if (!data.session) {
            return NextResponse.json(
                { error: 'Failed to create session' },
                { status: 400 }
            );
        }

        console.log(`Login successful for user: ${email}`);

        // The session lives in the httpOnly cookies applied below. Echoing
        // access_token/refresh_token back in the JSON body put them where
        // any script on the page — including an injected one — could read
        // them, and a refresh token is a long-lived credential.
        const response = NextResponse.json({
            success: true,
            message: 'Login successful',
            redirect: '/',
        });

        // Apply all tracked cookies to the response
        for (const cookie of cookiesToSet) {
            response.cookies.set(cookie.name, cookie.value, cookie.options);
        }

        return response;
    } catch (error) {
        console.error('Login API error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
