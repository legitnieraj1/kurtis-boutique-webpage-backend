import Link from 'next/link';
import { SignupForm } from '@/components/auth/SignupForm';
import { GoogleButton } from '@/components/auth/GoogleButton';

export const dynamic = 'force-dynamic';

export default function SignupPage() {
    return (
        <div className="animate-fade-in">
            <div className="lg:hidden text-center mb-8">
                <div className="mx-auto h-12 w-12 rounded-xl gradient-bg mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ProjectHub</h1>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create your account
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
                Start managing your projects today
            </p>

            <div className="mt-8">
                <GoogleButton />

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-gray-50 dark:bg-gray-900 px-4 text-gray-500">
                            or sign up with email
                        </span>
                    </div>
                </div>

                <SignupForm />
            </div>

            <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link
                    href="/login"
                    className="font-semibold text-primary-600 hover:text-primary-500"
                >
                    Sign in
                </Link>
            </p>
        </div>
    );
}
