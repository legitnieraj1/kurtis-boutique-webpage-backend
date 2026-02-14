"use client";

import { useShippingStore } from "@/lib/shippingStore";
import { ShipmentStatusBadge } from "@/components/account/orders/ShipmentStatusBadge";
import { Button } from "@/components/ui/button";
import { Package, ArrowRight, ShoppingBag, Truck, AlertCircle } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Define locally since we're moving away from store types
interface OrderItem {
    product_name: string;
    product_image: string | null;
    quantity: number;
    size: string;
    unit_price: number;
    total_price: number;
}

interface UserOrder {
    id: string;
    orderNumber: string;
    status: string; // 'pending', 'confirmed', etc.
    total: number;
    date: string;
    createdAt: string;
    tracking: {
        awb: string | null;
        courier: string | null;
        trackingUrl: string | null;
    };
    items: OrderItem[];
}

export default function UserOrdersPage() {
    const [orders, setOrders] = useState<UserOrder[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/orders');
            if (response.status === 401) {
                // Not authenticated
                return;
            }
            const data = await response.json();
            if (data.orders) {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error("Failed to fetch user orders:", error);
            toast.error("Failed to load your orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl flex justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-8 bg-muted rounded-full mb-4"></div>
                    <div className="h-4 w-48 bg-muted rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
            <div className="flex items-center gap-3 mb-8">
                <ShoppingBag className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-serif font-bold text-foreground">My Orders</h1>
            </div>

            {orders.length === 0 ? (
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
                    <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex gap-3 text-sm border border-yellow-200">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>
                            <strong>Note:</strong> If your order hasn’t been confirmed yet, please wait patiently until it gets confirmed or contact us.
                        </p>
                    </div>

                    {orders.map(order => (
                        <div key={order.id} className="bg-background rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                                        <ShipmentStatusBadge status={order.status} />
                                    </div>
                                    <p className="text-sm text-muted-foreground">Placed on {order.date}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                                    <p className="font-bold text-lg">{formatPrice(order.total)}</p>
                                </div>
                            </div>

                            {/* Order Preview Items (First 3) */}
                            <div className="flex gap-4 overflow-hidden mb-6 py-2">
                                {order.items.slice(0, 4).map((item, idx) => (
                                    <div key={idx} className="relative w-16 h-20 bg-muted rounded-md overflow-hidden border border-border flex-shrink-0">
                                        {item.product_image ? (
                                            <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
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
                                <div className="flex gap-3">
                                    <Link
                                        href={order.status === 'confirmed' || order.status === 'shipped' || order.status === 'in_transit' || order.status === 'delivered'
                                            ? `https://shiprocket.co/tracking/order/${order.orderNumber}?company_id=9186815`
                                            : '#'
                                        }
                                        target={order.status === 'confirmed' || order.status === 'shipped' || order.status === 'in_transit' || order.status === 'delivered' ? "_blank" : "_self"}
                                    >
                                        <Button
                                            variant="outline"
                                            disabled={order.status === 'pending' || order.status === 'cancelled'}
                                            className={cn(
                                                "gap-2",
                                                (order.status === 'pending' || order.status === 'cancelled') && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <Truck className="w-4 h-4" />
                                            Track Now
                                        </Button>
                                    </Link>

                                    <Link href={`/account/orders/${order.id}`}>
                                        <Button variant="ghost" className="group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            View Details <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
