"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Search, RefreshCw, Package, Filter, CheckCircle } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";


interface Order {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    date: string;
    createdAt: string;
    customer: {
        name: string;
        email: string;
        phone: string;
    };
    tracking: {
        awb: string | null;
        courier: string | null;
        shiprocketOrderId?: number | string;
    };
}

const statusStyles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-purple-100 text-purple-800",
    shipped: "bg-indigo-100 text-indigo-800",
    in_transit: "bg-cyan-100 text-cyan-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("all"); // 'all' or 'today'

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/orders');
            const data = await response.json();
            if (data.orders) {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            toast.error("Failed to fetch orders");
        } finally {
            setLoading(false);
        }
    };

    const confirmOrder = async (orderId: string) => {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'confirmed' }),
            });

            if (response.ok) {
                toast.success("Order confirmed successfully");
                // Optimistic update
                setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'confirmed' } : o));
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to confirm order");
            }
        } catch (error) {
            console.error('Error confirming order:', error);
            toast.error("Error confirming order");
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.email?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (dateFilter === 'today') {
            const today = new Date().toLocaleDateString('en-IN');
            return order.date === today;
        }

        return true;
    });

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <h1 className="text-3xl font-serif font-bold">Orders</h1>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        />
                    </div>

                    <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by date" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Orders</SelectItem>
                            <SelectItem value="today">Today's Orders</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" onClick={fetchOrders} disabled={loading}>
                        <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="bg-background rounded-lg border border-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[800px] md:min-w-full">
                        <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                            <tr>
                                <th className="px-6 py-3">Order ID</th>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3 hidden md:table-cell">Date</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Total</th>
                                <th className="px-6 py-3 hidden md:table-cell">Tracking</th>
                                {/* Actions column removed as requested */}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                        <p className="mt-2 text-muted-foreground">Loading orders...</p>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12">
                                        <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                                        <p className="text-muted-foreground">No orders found.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            <Link href={`/admin/orders/${order.id}`} className="hover:underline hover:text-primary">
                                                {order.orderNumber}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium">{order.customer.name}</div>
                                            <div className="text-xs text-muted-foreground">{order.customer.email}</div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">{order.date}</td>
                                        <td className="px-6 py-4">
                                            {order.status === 'pending' ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200 h-8"
                                                    onClick={() => confirmOrder(order.id)}
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                                    Confirm
                                                </Button>
                                            ) : (
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                                                    order.status === 'confirmed' ? "bg-blue-100 text-blue-800 border border-blue-200" :
                                                        statusStyles[order.status] || "bg-gray-100 text-gray-800"
                                                )}>
                                                    {order.status.replace('_', ' ')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            {formatPrice(order.total)}
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            {order.tracking?.awb ? (
                                                <span className="text-xs font-mono">{order.tracking.awb}</span>
                                            ) : (
                                                <span className="text-muted-foreground text-xs italic">Not shipped</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
