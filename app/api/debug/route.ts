import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdmin } from '@/lib/supabase/server';

// Diagnostics endpoint. Admin-only: it reports which secrets are
// configured and runs a service-role query, so leaving it open told any
// visitor how the backend is wired and confirmed the service key works.
export async function GET(request: NextRequest) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const results: Record<string, any> = {};

    // Check environment variables
    results.env = {
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
        SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
    };

    // Try direct Supabase connection with anon key
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Simple query - just get products
        const { data, error, count } = await supabase
            .from('products')
            .select('id, name, is_active', { count: 'exact' })
            .limit(5);

        results.anonQuery = {
            success: !error,
            error: error?.message || null,
            count: count,
            sampleData: data,
        };
    } catch (e: any) {
        results.anonQuery = { success: false, error: e.message };
    }

    // Try with Service Role Key (bypasses RLS)
    try {
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const { data, error, count } = await supabaseAdmin
                .from('products')
                .select('id, name, is_active', { count: 'exact' })
                .limit(5);

            results.serviceRoleQuery = {
                success: !error,
                error: error?.message || null,
                count: count,
                sampleData: data,
            };
        } else {
            results.serviceRoleQuery = { error: 'SUPABASE_SERVICE_ROLE_KEY not set' };
        }
    } catch (e: any) {
        results.serviceRoleQuery = { success: false, error: e.message };
    }

    return NextResponse.json(results, { status: 200 });
}
