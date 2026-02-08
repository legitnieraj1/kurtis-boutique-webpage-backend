"use client";
import React, { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { Package, ShoppingBag, DollarSign, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    date: string;
    customer: {
        name: string;
        email: string;
    };
}

export default function AdminDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [productsCount, setProductsCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch orders
        fetch('/api/orders')
            .then(res => res.json())
            .then(data => {
                if (data.orders) setOrders(data.orders);
            })
            .catch(console.error)
            .finally(() => setLoading(false));

        // Fetch products count
        fetch('/api/products?limit=1')
            .then(res => res.json())
            .then(data => {
                if (data.pagination) setProductsCount(data.pagination.total);
            })
            .catch(console.error);
    }, []);

    const totalSales = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    const activeOrders = orders.filter(o =>
        ['pending', 'confirmed', 'processing', 'shipped', 'in_transit'].includes(o.status)
    ).length;

    const statusStyles: Record<string, string> = {
        pending: "bg-yellow-100 text-yellow-800",
        confirmed: "bg-blue-100 text-blue-800",
        processing: "bg-purple-100 text-purple-800",
        shipped: "bg-indigo-100 text-indigo-800",
        in_transit: "bg-cyan-100 text-cyan-800",
        delivered: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
    };

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-serif font-bold">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-background p-6 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Total Sales</p>
                    </div>
                    <div className="mt-3">
                        <span className="text-3xl font-bold">{formatPrice(totalSales)}</span>
                    </div>
                </div>

                <div className="bg-background p-6 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Active Orders</p>
                    </div>
                    <div className="mt-3">
                        <span className="text-3xl font-bold">{activeOrders}</span>
                    </div>
                </div>

                <div className="bg-background p-6 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <ShoppingBag className="w-5 h-5 text-purple-600" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Total Products</p>
                    </div>
                    <div className="mt-3">
                        <span className="text-3xl font-bold">{productsCount ?? '...'}</span>
                    </div>
                </div>
            </div>

            <div className="bg-background rounded-lg border border-border p-6 min-h-[400px]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Recent Orders</h3>
                    <Link href="/admin/orders" className="text-primary text-sm hover:underline">
                        View All →
                    </Link>
                </div>

                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                            <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p>No orders yet.</p>
                        </div>
                    </div>
                ) : (
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-muted/50">
                                <tr>
                                    <th className="px-6 py-3">Order ID</th>
                                    <th className="px-6 py-3">Customer</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.slice(0, 10).map((order) => (
                                    <tr key={order.id} className="bg-background border-b hover:bg-muted/10">
                                        <td className="px-6 py-4 font-medium">{order.orderNumber}</td>
                                        <td className="px-6 py-4">
                                            <div>{order.customer?.name || 'Guest'}</div>
                                            <div className="text-xs text-muted-foreground">{order.customer?.email}</div>
                                        </td>
                                        <td className="px-6 py-4">{order.date}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs capitalize ${statusStyles[order.status] || 'bg-gray-100 text-gray-800'}`}>
                                                {order.status?.replace('_', ' ') || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{formatPrice(order.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
