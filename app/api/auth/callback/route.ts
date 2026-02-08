import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET /api/auth/callback - OAuth callback handler
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';
    const error = searchParams.get('error');
    const error_description = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
        console.error('OAuth error:', error, error_description);
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error_description || error)}`);
    }

    if (code) {
        const supabase = await createSupabaseServerClient();
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (!exchangeError) {
            // Successful login - redirect to intended page
            return NextResponse.redirect(`${origin}${next}`);
        }

        console.error('Code exchange error:', exchangeError);
    }

    // If no code or exchange failed, redirect to login with error
    return NextResponse.redirect(`${origin}/login?error=Could not authenticate`);
}
