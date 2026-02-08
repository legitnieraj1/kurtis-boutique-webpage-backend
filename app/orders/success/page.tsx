"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Package, ArrowRight, ShoppingBag, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getSupabaseClient } from "@/lib/supabase/client";

function LoadingState() {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-stone-50 via-rose-50/30 to-stone-100">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <Footer />
        </div>
    );
}

function OrderSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [orderDetails, setOrderDetails] = useState<{
        orderId: string;
        total: number;
        status: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const orderId = searchParams.get('order_id');
        const status = searchParams.get('status');

        if (orderId) {
            fetchOrderDetails(orderId);
        } else {
            setOrderDetails({
                orderId: 'N/A',
                total: 0,
                status: status || 'success'
            });
            setLoading(false);
        }
    }, [searchParams]);

    const fetchOrderDetails = async (orderId: string) => {
        try {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('shiprocket_orders')
                .select('*')
                .eq('shiprocket_order_id', orderId)
                .single();

            if (data && !error) {
                setOrderDetails({
                    orderId: data.shiprocket_order_id,
                    total: data.total_amount,
                    status: data.status
                });
            } else {
                setOrderDetails({
                    orderId: orderId,
                    total: 0,
                    status: 'success'
                });
            }
        } catch (error) {
            console.error('Error fetching order:', error);
            setOrderDetails({
                orderId: orderId,
                total: 0,
                status: 'success'
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingState />;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-stone-50 via-emerald-50/20 to-stone-100">
            <Navbar />
            <div className="flex-1 flex items-center justify-center p-4 py-16">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="max-w-lg w-full"
                >
                    {/* Success Card */}
                    <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-8 md:p-12 shadow-2xl text-center space-y-6">

                        {/* Success Icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200/50"
                        >
                            <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
                        </motion.div>

                        {/* Main Message */}
                        <div className="space-y-2">
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="font-serif text-3xl md:text-4xl font-bold text-foreground"
                            >
                                Order Placed!
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-muted-foreground text-lg"
                            >
                                Thank you for your purchase. Your order is being processed.
                            </motion.p>
                        </div>

                        {/* Order Details */}
                        {orderDetails && orderDetails.orderId !== 'N/A' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-stone-50/80 rounded-2xl p-6 space-y-3"
                            >
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Order ID</span>
                                    <span className="font-mono font-medium text-foreground">{orderDetails.orderId}</span>
                                </div>
                                {orderDetails.total > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Total Amount</span>
                                        <span className="font-bold text-foreground">₹{orderDetails.total.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Status</span>
                                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase">
                                        {orderDetails.status}
                                    </span>
                                </div>
                            </motion.div>
                        )}

                        {/* Info Message */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex items-start gap-3 text-left bg-blue-50/80 border border-blue-100 rounded-xl p-4"
                        >
                            <Package className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-800">
                                You'll receive an email confirmation shortly with tracking details.
                            </p>
                        </motion.div>

                        {/* Action Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="flex flex-col sm:flex-row gap-3 pt-4"
                        >
                            <Link href="/orders" className="flex-1">
                                <Button
                                    variant="outline"
                                    className="w-full gap-2 border-primary/20 hover:bg-primary hover:text-white rounded-xl h-12"
                                >
                                    <Package className="w-4 h-4" />
                                    View Orders
                                </Button>
                            </Link>
                            <Link href="/shop" className="flex-1">
                                <Button
                                    className="w-full gap-2 bg-primary hover:bg-primary/90 rounded-xl h-12 shadow-lg shadow-primary/20"
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    Continue Shopping
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </motion.div>
                    </div>

                    {/* Support Link */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-center text-sm text-muted-foreground mt-6"
                    >
                        Need help? <Link href="/contact" className="text-primary hover:underline">Contact Support</Link>
                    </motion.p>
                </motion.div>
            </div>
            <Footer />
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <OrderSuccessContent />
        </Suspense>
    );
}
