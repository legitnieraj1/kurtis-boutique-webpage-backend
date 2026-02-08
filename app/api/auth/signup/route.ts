import { createSupabaseAdmin } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { email, password, name } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Use the admin client to create user with email auto-confirmed
        const supabaseAdmin = createSupabaseAdmin();

        // Create user with admin client - this bypasses email confirmation
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm the email
            user_metadata: {
                full_name: name || '',
            },
        });

        if (createError) {
            // If user already exists, try to update their email confirmation status
            if (createError.message.includes('already') || createError.message.includes('exists')) {
                return NextResponse.json(
                    { error: 'An account with this email already exists. Please login instead.' },
                    { status: 400 }
                );
            }

            console.error('Signup error:', createError);
            return NextResponse.json(
                { error: createError.message },
                { status: 400 }
            );
        }

        // Create profile for the user
        if (userData?.user) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: userData.user.id,
                    email: email,
                    full_name: name || '',
                    role: 'customer',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });

            if (profileError) {
                console.error('Profile creation error:', profileError);
                // Don't fail the signup if profile creation fails
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Account created successfully! You can now login.',
            user: {
                id: userData?.user?.id,
                email: userData?.user?.email,
            },
        });
    } catch (error) {
        console.error('Signup API error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
