"use client";

import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ShoppingBag, ChevronRight, PackageSearch, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn, formatPrice } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    date: string;
    items: { product_name: string; quantity: number }[];
}

export default function OrdersPage() {
    const { user } = useStore();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (user) {
            fetchOrders();
        }
    }, [user]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/orders');
            if (response.ok) {
                const data = await response.json();
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    // --- Not Logged In State ---
    if (!user) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-stone-50 via-rose-50/30 to-stone-100 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full bg-white/40 backdrop-blur-xl border border-white/60 p-8 rounded-3xl shadow-2xl text-center space-y-6"
                    >
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary mb-4">
                            <ShoppingBag className="w-10 h-10" />
                        </div>
                        <h1 className="font-serif text-3xl font-bold text-foreground">View Your Orders</h1>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            Please log in to access your order history and track your shipments.
                        </p>
                        <Button
                            size="lg"
                            className="w-full rounded-xl text-lg h-12 shadow-lg hover:shadow-primary/25 transition-all duration-300"
                            onClick={() => router.push('/login')}
                        >
                            Login to Continue
                        </Button>
                    </motion.div>
                </div>
                <Footer />
            </div>
        );
    }

    // --- Logged In State ---
    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-stone-50 via-rose-50/30 to-stone-100">
            <Navbar />
            <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
                <div className="container max-w-4xl mx-auto space-y-8">

                    <header className="space-y-2">
                        <h1 className="font-serif text-4xl font-bold text-foreground">My Orders</h1>
                        <p className="text-muted-foreground font-medium">Manage and track your recent purchases.</p>
                    </header>

                    {loading ? (
                        <div className="bg-white/40 backdrop-blur-md border border-white/50 p-12 rounded-3xl text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                            <p className="mt-4 text-muted-foreground">Loading your orders...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/40 backdrop-blur-md border border-white/50 p-12 rounded-3xl text-center space-y-6"
                        >
                            <PackageSearch className="w-16 h-16 text-muted-foreground/30 mx-auto" />
                            <h3 className="text-2xl font-serif font-medium text-foreground">No orders yet</h3>
                            <p className="text-muted-foreground">It looks like you haven&apos;t placed any orders yet.</p>
                            <Link href="/shop" className="inline-block">
                                <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary hover:text-white">Start Shopping</Button>
                            </Link>
                        </motion.div>
                    ) : (
                        <div className="space-y-6">
                            {orders.map((order, index) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:bg-white/80 transition-all duration-300"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-sm text-muted-foreground">#{order.orderNumber}</span>
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                                                    order.status === 'delivered' ? "bg-green-100 text-green-700" :
                                                        order.status === 'cancelled' ? "bg-red-100 text-red-700" :
                                                            order.status === 'shipped' || order.status === 'in_transit' ? "bg-blue-100 text-blue-700" :
                                                                "bg-amber-100 text-amber-700"
                                                )}>
                                                    {order.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <h3 className="font-serif text-xl font-bold text-foreground">
                                                {formatPrice(order.total)}
                                            </h3>
                                            <p className="text-sm text-muted-foreground font-medium">{order.date}</p>
                                            {order.items?.length > 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    {order.items.length} item{order.items.length > 1 ? 's' : ''}: {order.items.map(i => i.product_name).join(', ').slice(0, 50)}...
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <Link href={`/orders/${order.id}`}>
                                                <Button className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl">
                                                    View Order <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}
