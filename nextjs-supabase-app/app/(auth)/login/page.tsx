import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { GoogleButton } from '@/components/auth/GoogleButton';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
    const params = await searchParams;

    return (
        <div className="animate-fade-in">
            <div className="lg:hidden text-center mb-8">
                <div className="mx-auto h-12 w-12 rounded-xl gradient-bg mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ProjectHub</h1>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
                Sign in to your account to continue
            </p>

            {params.error && (
                <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
                    {params.error === 'auth_callback_error'
                        ? 'There was an error signing in. Please try again.'
                        : 'An error occurred. Please try again.'}
                </div>
            )}

            <div className="mt-8">
                <GoogleButton />

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-gray-50 dark:bg-gray-900 px-4 text-gray-500">
                            or continue with email
                        </span>
                    </div>
                </div>

                <LoginForm redirectTo={params.redirect} />
            </div>

            <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                Don&apos;t have an account?{' '}
                <Link
                    href="/signup"
                    className="font-semibold text-primary-600 hover:text-primary-500"
                >
                    Sign up for free
                </Link>
            </p>
        </div>
    );
}
