import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        redirect("/dashboard");
    }

    return (
        <main className="flex min-h-screen flex-col">
            {/* Hero Section */}
            <div className="gradient-bg">
                <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-sm" />
                        <span className="text-xl font-bold text-white">ProjectHub</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className="text-sm font-medium text-white/90 hover:text-white transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/signup"
                            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-primary-600 hover:bg-white/90 transition-colors"
                        >
                            Get Started
                        </Link>
                    </div>
                </nav>

                <div className="mx-auto max-w-4xl px-6 py-24 text-center">
                    <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
                        Manage projects with
                        <span className="block mt-2">ease and confidence</span>
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-white/80">
                        A powerful project management platform built with Next.js 14 and Supabase.
                        Secure, fast, and ready for production.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-4">
                        <Link
                            href="/signup"
                            className="rounded-lg bg-white px-6 py-3 text-base font-semibold text-primary-600 shadow-lg hover:bg-white/90 transition-all hover:scale-105"
                        >
                            Start Free Trial
                        </Link>
                        <Link
                            href="/login"
                            className="rounded-lg border-2 border-white/30 px-6 py-3 text-base font-semibold text-white hover:bg-white/10 transition-colors"
                        >
                            Sign In →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="mx-auto max-w-7xl px-6 py-24">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                        Everything you need to succeed
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                        Built with modern technologies for the best developer and user experience
                    </p>
                </div>

                <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Feature 1 */}
                    <div className="card animate-fade-in">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900">
                            <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Secure Authentication</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Email/password and Google OAuth with secure session handling and Row Level Security.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="card animate-fade-in" style={{ animationDelay: "0.1s" }}>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">PostgreSQL Database</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Full PostgreSQL database with automatic migrations, triggers, and realtime subscriptions.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="card animate-fade-in" style={{ animationDelay: "0.2s" }}>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900">
                            <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">File Storage</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Secure file uploads with private storage buckets and user-based access control.
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="card animate-fade-in" style={{ animationDelay: "0.3s" }}>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900">
                            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Realtime Updates</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Live project updates with Supabase Realtime for instant collaboration.
                        </p>
                    </div>

                    {/* Feature 5 */}
                    <div className="card animate-fade-in" style={{ animationDelay: "0.4s" }}>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Production Ready</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Built with security best practices, including strict RLS policies and server-side auth.
                        </p>
                    </div>

                    {/* Feature 6 */}
                    <div className="card animate-fade-in" style={{ animationDelay: "0.5s" }}>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900">
                            <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">TypeScript</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Full TypeScript support with type-safe database queries and API routes.
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-auto border-t border-gray-200 dark:border-gray-700">
                <div className="mx-auto max-w-7xl px-6 py-8">
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        Built with Next.js 14, Supabase, and Tailwind CSS
                    </p>
                </div>
            </footer>
        </main>
    );
}
