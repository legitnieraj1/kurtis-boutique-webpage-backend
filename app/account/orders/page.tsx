"use client";

import { useShippingStore } from "@/lib/shippingStore";
import { ShipmentStatusBadge } from "@/components/account/orders/ShipmentStatusBadge";
import { Button } from "@/components/ui/button";
import { Package, ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function UserOrdersPage() {
    // Mock user login - In real app, this comes from auth context
    const currentUserEmail = "aisha@example.com";
    const { orders } = useShippingStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Filter orders for the current user
    const userOrders = orders.filter(o => o.customer.email === currentUserEmail);

    return (
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
            <div className="flex items-center gap-3 mb-8">
                <ShoppingBag className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-serif font-bold text-foreground">My Orders</h1>
            </div>

            {userOrders.length === 0 ? (
                <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed border-muted-foreground/25">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-foreground">No orders found</h3>
                    <p className="text-muted-foreground mb-6">Looks like you haven't placed any orders yet.</p>
                    <Link href="/shop">
                        <Button>Start Shopping</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {userOrders.map(order => (
                        <div key={order.id} className="bg-background rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-semibold text-lg">{order.id}</h3>
                                        <ShipmentStatusBadge status={order.orderStatus} />
                                    </div>
                                    <p className="text-sm text-muted-foreground">Placed on {order.date}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                                    <p className="font-bold text-lg">{formatPrice(order.totalAmount)}</p>
                                </div>
                            </div>

                            {/* Order Preview Items (First 3) */}
                            <div className="flex gap-4 overflow-hidden mb-6 py-2">
                                {order.items.slice(0, 4).map((item, idx) => (
                                    <div key={idx} className="relative w-16 h-20 bg-muted rounded-md overflow-hidden border border-border flex-shrink-0">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground bg-muted">Img</div>
                                        )}
                                    </div>
                                ))}
                                {order.items.length > 4 && (
                                    <div className="w-16 h-20 bg-muted rounded-md border border-border flex items-center justify-center text-sm font-medium text-muted-foreground">
                                        +{order.items.length - 4}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-border">
                                <div className="text-sm text-muted-foreground">
                                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                                </div>
                                <Link href={`/account/orders/${order.id}`}>
                                    <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        View Details <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
