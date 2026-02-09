"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash, MessageSquare, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface CustomisationQuery {
    id: string;
    product_name: string;
    product_id: string;
    created_at: string;
    status: 'new' | 'in_progress' | 'contacted' | 'closed';
    user: {
        email: string;
        full_name: string;
        phone: string;
    };
    contact_preference: string;
    preferred_size: string;
    mobile_number: string;
    customisation_types: string[];
    message: string;
    admin_notes?: string;
}

export default function CustomisationQueriesPage() {
    const [queries, setQueries] = useState<CustomisationQuery[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchQueries = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/customisation-queries');
            if (!res.ok) throw new Error('Failed to fetch queries');
            const data = await res.json();
            setQueries(data.queries || []);
        } catch (error) {
            toast.error("Failed to load customisation queries");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQueries();
    }, []);

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/admin/customisation-queries`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });

            if (!res.ok) throw new Error('Failed to update status');

            setQueries(prev => prev.map(q =>
                q.id === id ? { ...q, status: newStatus as any } : q
            ));
            toast.success("Status updated");
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleCopy = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!queries || queries.length === 0) {
        return (
            <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-serif font-bold">Customisation Queries</h1>
                    <Button variant="outline" size="sm" onClick={fetchQueries}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                </div>
                <div className="bg-background border border-dashed border-border rounded-lg p-12 text-center text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No customisation requests found yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-serif font-bold">Customisation Queries</h1>
                <Button variant="outline" size="sm" onClick={fetchQueries}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {queries.map(query => (
                    <div key={query.id} className="bg-background border border-border rounded-lg p-6 shadow-sm flex flex-col md:flex-row gap-6">
                        {/* Status Stripe */}
                        <div className={`w-2 md:w-1 rounded-full shrink-0 ${query.status === 'new' ? 'bg-primary' :
                            query.status === 'in_progress' ? 'bg-yellow-500' :
                                query.status === 'closed' ? 'bg-gray-500' :
                                    'bg-green-500'
                            }`} />

                        {/* Content */}
                        <div className="flex-1 space-y-4">
                            <div className="flex flex-col md:flex-row justify-between md:items-start gap-2">
                                <div>
                                    <h3 className="font-medium text-lg text-foreground">{query.product_name || 'General Query'}</h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                        <span>Product ID: {query.product_id || 'N/A'}</span>
                                        <span>•</span>
                                        <span>{new Date(query.created_at).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <select
                                        className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium"
                                        value={query.status}
                                        onChange={(e) => updateStatus(query.id, e.target.value)}
                                    >
                                        <option value="new">New</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-md text-sm">
                                <div>
                                    <span className="block font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">Customer</span>
                                    <div className="space-y-1">
                                        <p>{query.user?.email || 'Unknown User'}</p>
                                        <p className="text-muted-foreground text-xs">{query.user?.full_name}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <span className="badge badge-outline text-xs border px-1.5 py-0.5 rounded-sm">
                                                Prefers: {query.contact_preference}
                                            </span>
                                            {query.preferred_size && (
                                                <span className="badge badge-outline text-xs border px-1.5 py-0.5 rounded-sm">
                                                    Size: {query.preferred_size}
                                                </span>
                                            )}
                                        </div>
                                        {/* Mobile Number Row */}
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="border bg-background px-2 py-0.5 rounded-sm text-xs font-mono min-w-[120px]">
                                                {query.mobile_number || "—"}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 text-[10px] px-2"
                                                disabled={!query.mobile_number}
                                                onClick={() => query.mobile_number && handleCopy(query.mobile_number)}
                                            >
                                                Copy
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <span className="block font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">Types</span>
                                    <div className="flex flex-wrap gap-1">
                                        {query.customisation_types?.map(t => (
                                            <span key={t} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <span className="block font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">Request Details</span>
                                <p className="text-foreground whitespace-pre-wrap leading-relaxed">{query.message}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
