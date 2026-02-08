"use client";

import { useShippingStore } from "@/lib/shippingStore";
import { OrderStatusBadge } from "@/components/admin/orders/OrderStatusBadge";
import { ShipmentActions } from "@/components/admin/orders/ShipmentActions";
import { TrackingTimeline } from "@/components/admin/orders/TrackingTimeline";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Package, User } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { useParams } from "next/navigation";

export default function OrderDetailsPage() {
    // 1. Get Params & Store Data
    const params = useParams();
    const orderId = params.orderId as string;
    const { getOrder } = useShippingStore();
    const order = getOrder(orderId);

    // 2. Handle Not Found
    if (!order) {
        return (
            <div className="p-12 flex flex-col items-center justify-center space-y-4">
                <h2 className="text-xl font-semibold">Order not found</h2>
                <Link href="/admin/orders">
                    <Button variant="outline">Back to Orders</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-in slide-in-from-top-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/orders">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-serif font-bold">{order.id}</h1>
                            <OrderStatusBadge status={order.orderStatus} />
                        </div>
                        <p className="text-muted-foreground text-sm">Placed on {order.date}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-50 duration-500">
                {/* Main Content: Order Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items */}
                    <div className="bg-background rounded-lg border border-border overflow-hidden p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-muted-foreground" />
                            Order Items
                        </h2>
                        <div className="space-y-4">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center py-3 border-b border-border last:border-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-muted rounded-md border border-border overflow-hidden flex items-center justify-center text-xs text-muted-foreground">
                                            {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : "No Img"}
                                        </div>
                                        <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <div className="font-medium">{formatPrice(item.price)}</div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-lg">
                            <span className="font-medium">Total Amount</span>
                            <span className="font-bold">{formatPrice(order.totalAmount)}</span>
                        </div>
                    </div>

                    {/* Customer & Address */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-background rounded-lg border border-border p-6 shadow-sm">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-muted-foreground" />
                                Customer Details
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b pb-2 border-dashed">
                                    <span className="text-muted-foreground">Name</span>
                                    <span className="font-medium">{order.customer.name}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2 border-dashed">
                                    <span className="text-muted-foreground">Email</span>
                                    <span className="font-medium">{order.customer.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Phone</span>
                                    <span className="font-medium">{order.customer.phone}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-background rounded-lg border border-border p-6 shadow-sm">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-muted-foreground" />
                                Shipping Address
                            </h2>
                            <div className="text-sm space-y-1">
                                <p className="font-medium">{order.address.line1}</p>
                                <p>{order.address.city}, {order.address.state}</p>
                                <p>{order.address.pincode}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar: Shipping Actions & Timeline */}
                <div className="space-y-6">
                    <div className="bg-background rounded-lg border border-border p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Shipment Actions</h2>
                        <ShipmentActions order={order} />
                    </div>

                    <div className="bg-background rounded-lg border border-border p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-2">Tracking Status</h2>
                        {order.shipment.trackingId && (
                            <div className="mb-4 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                                Tracking ID: <span className="font-mono text-foreground font-medium">{order.shipment.trackingId}</span>
                            </div>
                        )}
                        <TrackingTimeline shipment={order.shipment} />
                    </div>
                </div>
            </div>
        </div>
    );
}
