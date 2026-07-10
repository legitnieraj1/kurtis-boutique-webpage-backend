"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface InvoiceOrder {
    id: string;
    order_number?: string;
    created_at: string;
    status: string;
    total: number;
    subtotal: number;
    shipping_cost: number;
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
        color?: string | null;
        unit_price: number;
        total_price: number;
    }[];
}

export default function InvoicePage() {
    const params = useParams();
    const [order, setOrder] = useState<InvoiceOrder | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!params.id) return;
        fetch(`/api/orders/${params.id}`)
            .then(res => res.json())
            .then(data => setOrder(data.order))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [params.id]);

    if (loading) return <div className="p-8 text-center">Loading invoice…</div>;
    if (!order) return <div className="p-8 text-center">Order not found</div>;

    const orderRef = order.order_number || `#${order.id.slice(0, 8).toUpperCase()}`;

    return (
        <div className="min-h-screen bg-white text-black">
            {/* Print button — hidden when printing */}
            <div className="print:hidden p-4 flex justify-end max-w-3xl mx-auto">
                <Button onClick={() => window.print()} className="gap-2">
                    <Printer className="w-4 h-4" /> Print / Save as PDF
                </Button>
            </div>

            <div className="max-w-3xl mx-auto p-8">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-[#801848] pb-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-[#801848]">Kurtis Boutique</h1>
                        <p className="text-sm text-gray-600 mt-1">kurtisboutique.in</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold uppercase tracking-wide">Invoice</h2>
                        <p className="text-sm text-gray-600 mt-1">Order {orderRef}</p>
                        <p className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                    </div>
                </div>

                {/* Bill To */}
                <div className="mb-8">
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Deliver To</h3>
                    <p className="font-semibold">{order.shipping_name}</p>
                    <p className="text-sm text-gray-700">{order.shipping_address_line1}</p>
                    {order.shipping_address_line2 && <p className="text-sm text-gray-700">{order.shipping_address_line2}</p>}
                    <p className="text-sm text-gray-700">{order.shipping_city}, {order.shipping_state} — {order.shipping_pincode}</p>
                    <p className="text-sm text-gray-700 mt-1">Phone: {order.shipping_phone}</p>
                </div>

                {/* Items */}
                <table className="w-full mb-8 text-sm">
                    <thead>
                        <tr className="border-b-2 border-gray-300 text-left">
                            <th className="py-2 pr-2">Item</th>
                            <th className="py-2 px-2">Size</th>
                            <th className="py-2 px-2 text-center">Qty</th>
                            <th className="py-2 px-2 text-right">Unit Price</th>
                            <th className="py-2 pl-2 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map(item => (
                            <tr key={item.id} className="border-b border-gray-200 align-top">
                                <td className="py-3 pr-2">
                                    {item.product_name}
                                    {item.color && <span className="text-gray-500"> — {item.color}</span>}
                                </td>
                                <td className="py-3 px-2">{item.size || "—"}</td>
                                <td className="py-3 px-2 text-center">{item.quantity}</td>
                                <td className="py-3 px-2 text-right">{formatPrice(item.unit_price)}</td>
                                <td className="py-3 pl-2 text-right">{formatPrice(item.total_price)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-10">
                    <div className="w-64 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span>{formatPrice(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Shipping</span>
                            <span>{formatPrice(order.shipping_cost || 0)}</span>
                        </div>
                        <div className="flex justify-between border-t-2 border-gray-300 pt-2 font-bold text-base">
                            <span>Total</span>
                            <span>{formatPrice(order.total)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 pt-1">
                            <span>Payment</span>
                            <span className="uppercase">{order.payment_method || "Prepaid"}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 pt-6 text-center text-xs text-gray-500">
                    <p>Thank you for shopping with Kurtis Boutique!</p>
                    <p className="mt-1">For queries, contact us via Instagram @kurtis.boutique or reply to your order confirmation.</p>
                </div>
            </div>
        </div>
    );
}
