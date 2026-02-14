"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Package, MapPin, Receipt, Truck, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

interface OrderDetail {
    id: string;
    created_at: string;
    status: string;
    total: number;
    subtotal: number;
    shipping_cost: number;
    discount_amount: number;
    payment_method: string;
    shipping_address_line1: string;
    shipping_address_line2: string;
    shipping_city: string;
    shipping_state: string;
    shipping_pincode: string;
    shipping_name: string;
    shipping_phone: string;
    items: {
        id: string;
        product_name: string;
        quantity: number;
        size: string;
        unit_price: number;
        total_price: number;
        image_url: string | null;
        slug?: string;
    }[];
    tracking?: {
        awb: string;
        courier: string;
        trackingUrl: string;
    };
}

const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function UserOrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchOrderDetails(params.id as string);
        }
    }, [params.id]);

    const fetchOrderDetails = async (id: string) => {
        try {
            const res = await fetch(`/api/orders/${id}`);
            if (res.status === 401) {
                router.push("/login?redirect=/orders/" + id);
                return;
            }
            if (!res.ok) throw new Error("Failed to fetch order");
            const data = await res.json();
            setOrder(data.order);
        } catch (error) {
            console.error(error);
            toast.error("Error loading order details");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-[#faf9f6]">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col bg-[#faf9f6]">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <p className="text-xl font-serif">Order not found</p>
                    <Button onClick={() => router.push('/orders')}>Back to My Orders</Button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#faf9f6]">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-5xl">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/orders" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-4">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Orders
                    </Link>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-primary/10 pb-6">
                        <div>
                            <h1 className="text-3xl font-serif text-primary">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
                            <p className="text-muted-foreground mt-1">
                                Placed on {new Date(order.created_at).toLocaleString("en-IN", {
                                    dateStyle: 'long', timeStyle: 'short'
                                })}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className={cn(
                                "inline-block px-4 py-1.5 rounded-full text-sm font-medium border uppercase tracking-wide",
                                order.status === 'delivered' ? "bg-green-100 text-green-800 border-green-200" :
                                    order.status === 'cancelled' ? "bg-red-100 text-red-800 border-red-200" :
                                        "bg-primary/5 text-primary border-primary/20"
                            )}>
                                {order.status.replace("_", " ")}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Items */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 md:p-8">
                            <h2 className="font-serif text-xl mb-6 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-primary" />
                                Items Ordered
                            </h2>
                            <div className="space-y-6 divide-y divide-gray-50">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex gap-4 pt-6 first:pt-0">
                                        <div className="relative w-24 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-stone-100">
                                            {item.image_url ? (
                                                <Image
                                                    src={item.image_url}
                                                    alt={item.product_name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <Package className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <div>
                                                <h3 className="font-medium text-lg text-foreground">{item.product_name}</h3>
                                                <div className="text-sm text-muted-foreground mt-2 space-y-1">
                                                    <p>Size: <span className="font-medium text-foreground uppercase">{item.size}</span></p>
                                                    <p>Qty: <span className="font-medium text-foreground">{item.quantity}</span></p>
                                                </div>
                                            </div>
                                            <div className="text-lg font-medium text-primary bg-primary/5 px-2 py-1 self-start rounded-md">
                                                {formatPrice(item.unit_price)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 md:p-8">
                            <h2 className="font-serif text-xl mb-6 flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-primary" />
                                Order Summary
                            </h2>
                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(order.subtotal || 0)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Shipping</span>
                                    <span>{order.shipping_cost === 0 ? "Free" : formatPrice(order.shipping_cost)}</span>
                                </div>
                                {order.discount_amount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>-{formatPrice(order.discount_amount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold border-t pt-4 mt-2 text-foreground">
                                    <span>Total</span>
                                    <span>{formatPrice(order.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Address & Actions */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Shipping Address */}
                        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
                            <h2 className="font-serif text-lg mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary" />
                                Shipping Address
                            </h2>
                            <div className="text-sm text-muted-foreground leading-relaxed">
                                <p className="font-medium text-foreground text-base mb-1">{order.shipping_name}</p>
                                <p>{order.shipping_address_line1}</p>
                                {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
                                <p>{order.shipping_city}, {order.shipping_state}</p>
                                <p className="font-medium">{order.shipping_pincode}</p>
                                <p className="mt-3 flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-primary/50" />
                                    {order.shipping_phone}
                                </p>
                            </div>
                        </div>

                        <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                            <h3 className="font-serif text-primary font-medium mb-2">Need something else?</h3>
                            <Link href="/contact">
                                <Button variant="outline" className="w-full bg-white border-primary/20 hover:bg-primary/5 text-primary">
                                    Contact Support
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
