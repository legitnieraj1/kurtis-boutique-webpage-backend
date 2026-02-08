import { createSupabaseAdmin } from '@/lib/supabase/server';
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

        // Use admin to verify user exists and confirm if needed
        const supabaseAdmin = createSupabaseAdmin();

        // First, get user by email to check status
        const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

        if (listError) {
            console.error('List users error:', listError);
            return NextResponse.json(
                { error: 'Authentication service error' },
                { status: 500 }
            );
        }

        const user = usersData?.users?.find(u => u.email === email);

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 400 }
            );
        }

        // If user exists but email not confirmed, confirm it via admin
        if (!user.email_confirmed_at) {
            console.log(`Auto-confirming email for user: ${email}`);
            await supabaseAdmin.auth.admin.updateUserById(user.id, {
                email_confirm: true,
            });
        }

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

        // Create response with session data for client-side storage
        const response = NextResponse.json({
            success: true,
            message: 'Login successful',
            redirect: '/',
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
            }
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
