"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function LoginForm() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Get store actions to directly update auth state
    const { setUser, setIsAuthenticated } = useStore();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            console.log('Starting login with email:', email);

            // Use server-side login API that handles auto-confirmation and sets cookies
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include', // Important: include cookies in request/response
            });

            const data = await response.json();
            console.log('Login API response:', { ok: response.ok, status: response.status, hasSession: !!data.session });

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Server-side login succeeded and cookies are set!
            // Try to set client-side session for immediate state updates
            // If this fails due to AbortError, that's okay - cookies are already set
            if (data.session) {
                try {
                    console.log('Setting client session with tokens...');
                    const supabase = getSupabaseClient();

                    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                        access_token: data.session.access_token,
                        refresh_token: data.session.refresh_token,
                    });

                    if (!sessionError && sessionData?.user) {
                        console.log('Session set successfully, updating Zustand store');
                        setUser({
                            id: sessionData.user.id,
                            email: sessionData.user.email || '',
                            full_name: sessionData.user.user_metadata?.name || sessionData.user.email?.split('@')[0] || 'User',
                            role: 'customer'
                        });
                        setIsAuthenticated(true);
                    }
                } catch (sessionSetupError) {
                    // AbortError is common in development due to StrictMode/Fast Refresh
                    // Server-side cookies are already set, so we can safely continue
                    const isAbortError = sessionSetupError instanceof Error &&
                        (sessionSetupError.name === 'AbortError' || sessionSetupError.message?.includes('abort'));

                    if (isAbortError) {
                        console.log('Session setup aborted (likely StrictMode) - cookies are set, continuing with redirect');
                    } else {
                        console.warn('Could not set client session, but cookies are set:', sessionSetupError);
                    }
                }
            }

            // Login was successful (API returned 200 and cookies are set)
            // Redirect regardless of client-side session setup result
            toast.success("Login successful!");
            console.log('Redirecting to home page...');

            // Use window.location for a hard redirect that ensures full page refresh
            // This will pick up the session from cookies
            window.location.href = '/';
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

