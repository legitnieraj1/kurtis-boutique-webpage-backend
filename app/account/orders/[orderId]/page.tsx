"use client";

import { useShippingStore } from "@/lib/shippingStore";
import { ShipmentStatusBadge } from "@/components/account/orders/ShipmentStatusBadge";
import { StatusTimeline } from "@/components/account/orders/StatusTimeline";
import { TrackingButton } from "@/components/account/orders/TrackingButton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Calendar, Package } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { getStatusDescription } from "@/lib/tracking";
import { useEffect, useState } from "react";

export default function UserOrderDetailsPage() {
    const params = useParams();
    const orderId = params.orderId as string;
    const { getOrder } = useShippingStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Find order
    const order = getOrder(orderId);

    if (!mounted) return null;

    if (!order) {
        return (
            <div className="container mx-auto py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
                <Link href="/account/orders">
                    <Button>Return to My Orders</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/account/orders">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-serif font-bold flex items-center gap-3">
                            Order #{order.id}
                            <ShipmentStatusBadge status={order.orderStatus} />
                        </h1>
                        <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                            <Calendar className="w-3.5 h-3.5" /> Placed on {order.date}
                        </p>
                    </div>
                </div>
                <TrackingButton
                    awb={order.shipment.awb}
                    courier={order.shipment.courier}
                    className="w-full md:w-auto"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Shipment & Items */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Shipment Status */}
                    <div className="bg-background rounded-xl border border-border p-6 shadow-sm">
                        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" />
                            Shipment Status
                        </h2>

                        <div className="mb-8 p-4 bg-muted/30 rounded-lg border border-border">
                            <p className="text-sm font-medium text-foreground">Current Status: <span className="text-primary">{order.orderStatus}</span></p>
                            <p className="text-sm text-muted-foreground mt-1">{getStatusDescription(order.orderStatus)}</p>
                        </div>

                        <StatusTimeline status={order.orderStatus} shipment={order.shipment} />

                        {order.shipment.courier && (
                            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Courier</p>
                                    <p className="font-medium text-foreground">{order.shipment.courier}</p>
                                </div>
                                {order.shipment.awb && (
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Tracking ID</p>
                                        <p className="font-mono text-foreground">{order.shipment.trackingId || order.shipment.awb}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Order Items */}
                    <div className="bg-background rounded-xl border border-border overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-border bg-muted/10">
                            <h2 className="font-semibold">Items in your order</h2>
                        </div>
                        <div className="divide-y divide-border">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="p-4 flex items-center gap-4">
                                    <div className="w-20 h-24 bg-muted rounded-md border border-border overflow-hidden flex-shrink-0">
                                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : null}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium">{item.name}</h3>
                                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                                    </div>
                                    <div className="font-medium text-right">
                                        {formatPrice(item.price)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Order Summary */}
                <div className="space-y-6">
                    <div className="bg-background rounded-xl border border-border p-6 shadow-sm sticky top-24">
                        <h3 className="font-semibold text-lg mb-4">Order Summary</h3>

                        <div className="space-y-3 pb-4 border-b border-border">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatPrice(order.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Shipping</span>
                                <span className="text-green-600 font-medium">Free</span>
                            </div>
                        </div>

                        <div className="flex justify-between font-bold text-lg pt-4 mb-6">
                            <span>Total</span>
                            <span>{formatPrice(order.totalAmount)}</span>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                Delivery Address
                            </h4>
                            <div className="text-sm text-muted-foreground leading-relaxed">
                                <p className="font-medium text-foreground">{order.customer.name}</p>
                                <p>{order.address.line1}</p>
                                <p>{order.address.city}, {order.address.state}</p>
                                <p>{order.address.pincode}</p>
                                <p className="mt-2">{order.customer.phone}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
