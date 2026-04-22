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
        color?: string | null;
        combo_type?: string | null;
        baby_size?: string | null;
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
                            {order.items.map((item) => {
                                // Parse customisation note if present
                                const CUSTOM_MARKER = ' ✂ CUSTOM — ';
                                const isCustomised = item.product_name.includes(CUSTOM_MARKER);
                                const baseName = isCustomised
                                    ? item.product_name.split(CUSTOM_MARKER)[0]
                                    : item.product_name;
                                const customNote = isCustomised
                                    ? item.product_name.split(CUSTOM_MARKER)[1]
                                    : null;

                                return (
                                    <div key={item.id} className="flex gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                        <div className="relative w-20 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                            {item.image_url ? (
                                                <Image
                                                    src={item.image_url}
                                                    alt={baseName}
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
                                            <div className="flex items-start gap-2 flex-wrap">
                                                <h4 className="font-medium text-foreground">{baseName}</h4>
                                                {isCustomised && (
                                                    <span className="px-2 py-0.5 bg-[#801848]/10 text-[#801848] rounded text-xs font-semibold whitespace-nowrap">
                                                        ✂ CUSTOMISED
                                                    </span>
                                                )}
                                            </div>

                                            {/* Customisation details — shown prominently */}
                                            {customNote && (
                                                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
                                                    <p className="font-semibold text-xs uppercase tracking-wide text-amber-700 mb-1">Customisation Request</p>
                                                    <p className="leading-relaxed">{customNote}</p>
                                                </div>
                                            )}

                                            <div className="text-sm text-muted-foreground mt-2 space-y-1">
                                                <p>Size: <span className="font-medium text-black">{item.size}</span></p>
                                                {item.color && (
                                                    <p className="flex items-center gap-1">
                                                        Color:
                                                        <span className="w-3 h-3 rounded-full border border-black/10 inline-block shadow-sm" style={{ backgroundColor: item.color.includes('|') ? item.color.split('|')[1] : '#cccccc' }}></span>
                                                        <span className="font-medium text-black">{item.color.includes('|') ? item.color.split('|')[0] : item.color}</span>
                                                    </p>
                                                )}
                                                {item.combo_type && item.combo_type !== 'single' && (
                                                    <p>Combo: <span className="font-medium text-primary">{item.combo_type === 'mom_baby' ? 'Mom & Baby' : 'Family'}</span></p>
                                                )}
                                                {item.baby_size && (
                                                    <p><span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-semibold">Baby Size: {item.baby_size}</span></p>
                                                )}
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
                                );
                            })}
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
                                <p className="font-medium">{order.shipping_name || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs uppercase">Phone</p>
                                <a href={`tel:${order.shipping_phone}`} className="font-medium text-primary hover:underline">
                                    {order.shipping_phone || "N/A"}
                                </a>
                            </div>
                            {/* WhatsApp quick link */}
                            {order.shipping_phone && (
                                <a
                                    href={`https://wa.me/91${order.shipping_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, this is Team Kurtis Boutique. We're reaching out regarding your recent order.`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L0 24l6.335-1.521A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.306-1.558l-.38-.225-3.758.902.938-3.658-.248-.38A9.818 9.818 0 0112 2.182c5.42 0 9.818 4.398 9.818 9.818 0 5.42-4.398 9.818-9.818 9.818z"/></svg>
                                    WhatsApp
                                </a>
                            )}
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
