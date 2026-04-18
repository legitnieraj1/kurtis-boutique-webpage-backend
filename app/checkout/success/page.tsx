"use client";

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id');

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-serif font-bold text-gray-900 mb-3">
                        Order Placed!
                    </h1>
                    <p className="text-gray-600">
                        Thank you for shopping with Kurtis Boutique. Your payment was successful and your order is being processed.
                    </p>
                </div>

                {orderId && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <Package className="w-5 h-5 text-primary" />
                            <span className="text-sm text-gray-500 font-medium">Order ID</span>
                        </div>
                        <p className="text-lg font-mono font-semibold text-gray-900 tracking-wide">
                            {orderId}
                        </p>
                        <p className="text-xs text-gray-400 mt-3">
                            Save this Order ID to track your shipment via the link sent to your WhatsApp / email.
                        </p>
                    </div>
                )}

                <div className="space-y-4">
                    <Link href="/shop">
                        <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 px-8">
                            Continue Shopping
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading...</div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
