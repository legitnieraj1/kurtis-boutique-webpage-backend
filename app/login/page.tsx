"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
    const supabase = getSupabaseClient();
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An unknown error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-100 via-stone-100 to-rose-50 opacity-90" />
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-pink-200/30 rounded-full blur-[120px] animate-pulse delay-700" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-rose-200/20 rounded-full blur-[120px] animate-pulse" />

            {/* Back to Store Button */}
            <Link
                href="/"
                className="absolute top-6 left-6 z-20 flex items-center gap-2 text-stone-600 hover:text-primary transition-colors duration-300 group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Back to Store</span>
            </Link>

            <div className="relative z-10 w-full max-w-[420px] mx-4 p-8 md:p-12 rounded-3xl border border-white/40 shadow-[0_8px_32px_0_rgba(131,24,67,0.05)] backdrop-blur-xl bg-white/40 flex flex-col items-center animate-in fade-in zoom-in-95 duration-1000">

                <div className="mb-8 flex flex-col items-center">
                    <img
                        src="/kurtis-logo-large.png"
                        alt="Kurtis Boutique"
                        className="w-40 h-auto object-contain drop-shadow-sm opacity-90"
                    />
                </div>

                <div className="text-center space-y-2 mb-8">
                    <h1 className="font-serif text-2xl md:text-3xl text-primary font-medium tracking-wide">
                        Welcome
                    </h1>
                    <p className="text-sm text-muted-foreground font-light tracking-wide">
                        Sign in to access your wishlist & orders
                    </p>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white/70 hover:bg-white/90 border border-white/60 text-stone-700 font-medium py-4 rounded-full transition-all duration-300 shadow-sm hover:shadow-md group"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : (
                        <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            <span className="group-hover:text-black transition-colors">Continue with Google</span>
                        </>
                    )}
                </button>

                <div className="relative w-full my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-stone-200/60" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wider">
                        <span className="bg-white/40 px-3 text-stone-400 font-medium backdrop-blur-sm rounded-full">
                            Or continue with email
                        </span>
                    </div>
                </div>

                <LoginForm />

                <p className="mt-6 text-center text-sm text-stone-600">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="text-primary font-medium hover:underline">
                        Sign up
                    </Link>
                </p>

                <p className="mt-6 text-center text-sm text-stone-500 font-light">
                    By signing in, you agree to our Terms of Service and Privacy Policy
                </p>

                <div className="mt-8 flex gap-6 text-xs text-stone-400 font-light">
                    <Link href="/privacy-policy" className="hover:text-stone-600 transition-colors">Privacy Policy</Link>
                    <Link href="/exchange-and-shipping" className="hover:text-stone-600 transition-colors">Terms of Service</Link>
                </div>

            </div>
        </div>
    );
}
