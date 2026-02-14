"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Package, Truck, Printer, MapPin, User, Calendar, CreditCard } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

interface OrderDetail {
    id: string;
    created_at: string;
    status: string;
    total: number;
    subtotal: number;
    shipping_cost: number;
    discount_amount: number;
    payment_method: string;
    payment_status: string;
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
    profile?: {
        full_name: string;
        email: string;
        phone: string;
    };
    tracking?: {
        awb: string;
        courier: string;
        trackingUrl: string;
    };
}

const statusStyles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-blue-100 text-blue-800 border-blue-200",
    processing: "bg-purple-100 text-purple-800 border-purple-200",
    shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
    in_transit: "bg-cyan-100 text-cyan-800 border-cyan-200",
    delivered: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    refunded: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function AdminOrderDetailsPage() {
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

    if (loading) return <div className="p-8 text-center">Loading order details...</div>;
    if (!order) return <div className="p-8 text-center">Order not found</div>;

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-serif font-bold">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
                        <p className="text-muted-foreground text-sm">
                            Placed on {new Date(order.created_at).toLocaleString("en-IN")}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={cn("px-3 py-1 rounded-full text-sm font-medium border", statusStyles[order.status] || "bg-gray-100")}>
                        {order.status.toUpperCase().replace("_", " ")}
                    </span>
                    {/* Placeholder for status update dropdown later if needed */}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Order Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h3 className="font-serif text-lg font-semibold mb-6 flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" />
                            Order Items ({order.items.length})
                        </h3>
                        <div className="space-y-6">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="relative w-20 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                        {item.image_url ? (
                                            <Image
                                                src={item.image_url}
                                                alt={item.product_name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Package className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-foreground">{item.product_name}</h4>
                                        <div className="text-sm text-muted-foreground mt-1 space-y-1">
                                            <p>Size: <span className="font-medium text-black">{item.size}</span></p>
                                            <p>Quantity: <span className="font-medium text-black">{item.quantity}</span></p>
                                        </div>
                                        <div className="mt-2 font-semibold text-primary">
                                            {formatPrice(item.unit_price)}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{formatPrice(item.total_price)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h3 className="font-serif text-lg font-semibold mb-6 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-primary" />
                            Payment Details
                        </h3>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>{formatPrice(order.subtotal || 0)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Shipping</span>
                            <span>{formatPrice(order.shipping_cost || 0)}</span>
                        </div>
                        {order.discount_amount > 0 && (
                            <div className="flex justify-between py-2 border-b text-green-600">
                                <span>Discount</span>
                                <span>-{formatPrice(order.discount_amount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-2 mt-2 text-lg font-bold">
                            <span>Total</span>
                            <span>{formatPrice(order.total)}</span>
                        </div>
                        <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                            <span className="text-muted-foreground">Payment Method</span>
                            <span className="uppercase font-medium">{order.payment_method || "Online"}</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Customer & Shipping */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Customer
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-muted-foreground text-xs uppercase">Name</p>
                                <p className="font-medium">{order.shipping_name || order.profile?.full_name || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs uppercase">Email</p>
                                <a href={`mailto:${order.profile?.email}`} className="text-primary hover:underline">
                                    {order.profile?.email || "N/A"}
                                </a>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs uppercase">Phone</p>
                                <p className="font-medium">{order.shipping_phone || order.profile?.phone || "N/A"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            Shipping Details
                        </h3>
                        <address className="not-italic text-sm text-muted-foreground space-y-1">
                            <p className="font-medium text-foreground">{order.shipping_name}</p>
                            <p>{order.shipping_address_line1}</p>
                            {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
                            <p>{order.shipping_city}, {order.shipping_state}</p>
                            <p>{order.shipping_pincode}</p>
                            <p className="mt-2 text-foreground font-medium">{order.shipping_phone}</p>
                        </address>
                        {order.status === 'confirmed' && (
                            <div className="mt-4 pt-4 border-t">
                                <Button
                                    className="w-full gap-2"
                                    variant="outline"
                                    onClick={() => window.open('https://app.shiprocket.in/seller/orders/new?sku=&order_ids=&order_status=&channel_id=&payment_method=&pickup_address_id=&delivery_country=&quantity=&is_order_verified=&ship_weight=&previously_cancelled=&from=', '_blank')}
                                >
                                    <Truck className="w-4 h-4" />
                                    Create Shipment
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
