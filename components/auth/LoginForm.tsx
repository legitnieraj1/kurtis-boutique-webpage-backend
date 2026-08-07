"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Get store actions to directly update auth state
    const { setUser, setIsAuthenticated } = useStore();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Sign in through the browser Supabase client directly. It writes
            // the auth cookies itself, so the old hop through /api/auth/login
            // — which had to hand the access and refresh tokens back in the
            // JSON body for this component to replay into setSession() — is
            // not needed. Fewer round trips, and no long-lived refresh token
            // ever passes through reachable JavaScript.
            const supabase = getSupabaseClient();

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            if (!data.session) throw new Error("Failed to create session");

            setUser({
                id: data.user.id,
                email: data.user.email || '',
                full_name: data.user.user_metadata?.full_name
                    || data.user.user_metadata?.name
                    || data.user.email?.split('@')[0]
                    || 'User',
                // AuthProvider re-reads the real role from `profiles` on the
                // next load; assuming 'customer' here only affects the split
                // second before the redirect below.
                role: 'customer',
            });
            setIsAuthenticated(true);

            toast.success("Login successful!");

            // Hard navigation so the server sees the freshly written cookies.
            window.location.href = redirectTo || '/';
        } catch (error) {
            console.error('Login error:', error);
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An error occurred during sign in");
            }
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleEmailLogin} className="w-full space-y-4">
            <div className="space-y-2">
                <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-5 py-4 bg-white/70 border border-white/60 rounded-full text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm"
                />
            </div>
            <div className="space-y-2">
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-5 py-4 bg-white/70 border border-white/60 rounded-full text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary/90 hover:bg-primary text-white font-medium py-4 rounded-full transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    "Sign In"
                )}
            </button>
        </form>
    );
}

