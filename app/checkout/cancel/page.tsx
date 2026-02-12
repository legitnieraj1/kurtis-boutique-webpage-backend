"use client";

import Link from 'next/link';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CancelContent() {
    const searchParams = useSearchParams();
    const isFailed = searchParams.get('reason') === 'failed';

    return (
        <div className="max-w-md w-full text-center">
            <div className="mb-8">
                <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <XCircle className="w-12 h-12 text-red-600" />
                </div>
                <h1 className="text-3xl font-serif font-bold text-gray-900 mb-3">
                    {isFailed ? 'Payment Failed' : 'Payment Cancelled'}
                </h1>
                <p className="text-gray-600">
                    {isFailed
                        ? "We couldn't process your payment. Please try again or use a different method."
                        : "Your payment was not completed. Don't worry, no charges have been made to your account."}
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h3 className="font-medium text-gray-900 mb-2">What happened?</h3>
                <p className="text-sm text-gray-500">
                    {isFailed
                        ? "The transaction was declined by the bank or the verification failed."
                        : "The payment was either cancelled by you or failed to process. Your cart items are still saved."}
                </p>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/checkout">
                        <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                            <RefreshCw className="mr-2 w-4 h-4" />
                            Try Again
                        </Button>
                    </Link>
                    <Link href="/shop">
                        <Button variant="outline" className="w-full sm:w-auto">
                            <ArrowLeft className="mr-2 w-4 h-4" />
                            Continue Shopping
                        </Button>
                    </Link>
                </div>

                <p className="text-xs text-gray-400">
                    Need help? Contact our support team.
                </p>
            </div>
        </div>
    );
}

export default function CancelPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center px-4">
            <Suspense fallback={<div>Loading...</div>}>
                <CancelContent />
            </Suspense>
        </div>
    );
}
