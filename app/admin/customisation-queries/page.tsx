"use client";

import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Trash, MessageSquare, Mail, Phone, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function CustomisationQueriesPage() {
    const { customisationQueries, deleteCustomisationQuery, updateCustomisationStatus } = useStore();

    if (!customisationQueries || customisationQueries.length === 0) {
        return (
            <div className="p-8">
                <h1 className="text-3xl font-serif font-bold mb-6">Customisation Queries</h1>
                <div className="bg-background border border-dashed border-border rounded-lg p-12 text-center text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No customisation requests found yet.</p>
                </div>
            </div>
        );
    }

    const handleCopy = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    return (
        <div className="p-4 md:p-8 space-y-6">
            <h1 className="text-3xl font-serif font-bold">Customisation Queries</h1>

            <div className="grid grid-cols-1 gap-4">
                {customisationQueries.map(query => (
                    <div key={query.id} className="bg-background border border-border rounded-lg p-6 shadow-sm flex flex-col md:flex-row gap-6">
                        {/* Status Stripe */}
                        <div className={`w-2 md:w-1 rounded-full shrink-0 ${query.status === 'New' ? 'bg-primary' :
                            query.status === 'In Progress' ? 'bg-yellow-500' :
                                'bg-green-500'
                            }`} />

                        {/* Content */}
                        <div className="flex-1 space-y-4">
                            <div className="flex flex-col md:flex-row justify-between md:items-start gap-2">
                                <div>
                                    <h3 className="font-medium text-lg text-foreground">{query.productName}</h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                        <span>Product ID: {query.productId}</span>
                                        <span>•</span>
                                        <span>{new Date(query.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <select
                                        className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium"
                                        value={query.status}
                                        onChange={(e) => updateCustomisationStatus(query.id, e.target.value as any)}
                                    >
                                        <option value="New">New</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteCustomisationQuery(query.id)}>
                                        <Trash className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-md text-sm">
                                <div>
                                    <span className="block font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">Customer</span>
                                    <div className="space-y-1">
                                        <p>{query.userEmail}</p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="badge badge-outline text-xs border px-1.5 py-0.5 rounded-sm">
                                                Prefers: {query.contactPreference}
                                            </span>
                                            {query.preferredSize && (
                                                <span className="badge badge-outline text-xs border px-1.5 py-0.5 rounded-sm">
                                                    Size: {query.preferredSize}
                                                </span>
                                            )}
                                        </div>
                                        {/* Mobile Number Row */}
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="border bg-background px-2 py-0.5 rounded-sm text-xs font-mono min-w-[120px]">
                                                {query.mobileNumber || "—"}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 text-[10px] px-2"
                                                disabled={!query.mobileNumber}
                                                onClick={() => query.mobileNumber && handleCopy(query.mobileNumber)}
                                            >
                                                Copy
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <span className="block font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">Types</span>
                                    <div className="flex flex-wrap gap-1">
                                        {query.customisationTypes.map(t => (
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
