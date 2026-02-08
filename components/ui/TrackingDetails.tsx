"use client";

import { motion } from "framer-motion";
import { Check, Truck, Package, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineItem {
    status: string;
    date: string;
    description: string;
}

interface TrackingDetailsProps {
    orderId: string;
    awbId?: string;
    status: 'Pending' | 'Shipped' | 'In Transit' | 'Delivered' | 'Cancelled';
    timeline: TimelineItem[];
}

export function TrackingDetails({ orderId, awbId, status, timeline }: TrackingDetailsProps) {

    const getStatusIcon = (s: string) => {
        if (s.toLowerCase().includes('delivered')) return <Check className="w-5 h-5 text-white" />;
        if (s.toLowerCase().includes('shipped')) return <Truck className="w-5 h-5 text-white" />;
        if (s.toLowerCase().includes('transit')) return <Package className="w-5 h-5 text-white" />;
        if (s.toLowerCase().includes('cancelled')) return <XCircle className="w-5 h-5 text-white" />;
        return <Clock className="w-5 h-5 text-white" />;
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'Delivered': return 'bg-green-500 shadow-green-200';
            case 'Shipped': return 'bg-blue-500 shadow-blue-200';
            case 'In Transit': return 'bg-amber-500 shadow-amber-200';
            case 'Cancelled': return 'bg-red-500 shadow-red-200';
            default: return 'bg-gray-400 shadow-gray-200';
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8">
            {/* Header Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/40 backdrop-blur-md border border-white/50 p-6 rounded-2xl shadow-xl shadow-stone-200/50"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Order ID</p>
                        <h2 className="text-2xl font-serif font-bold text-foreground">#{orderId}</h2>
                    </div>
                    {awbId && (
                        <div className="md:text-right">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">AWB ID</p>
                            <p className="font-mono text-lg font-medium text-primary">{awbId}</p>
                        </div>
                    )}
                </div>

                <div className="mt-8">
                    <div className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium text-sm shadow-lg",
                        getStatusColor(status)
                    )}>
                        {getStatusIcon(status)}
                        <span>{status}</span>
                    </div>
                </div>
            </motion.div>

            {/* Timeline */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/40 backdrop-blur-md border border-white/50 p-8 rounded-2xl shadow-xl shadow-stone-200/50 relative overflow-hidden"
            >
                <h3 className="font-serif text-xl font-bold mb-8 text-foreground">Shipment Updates</h3>

                <div className="relative pl-8 border-l-2 border-stone-200 space-y-12">
                    {timeline.map((item, index) => (
                        <div key={index} className="relative">
                            {/* Dot */}
                            <div className={cn(
                                "absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm z-10",
                                index === 0 ? "bg-primary" : "bg-stone-300"
                            )} />

                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-foreground/70">{item.date}</p>
                                <h4 className="text-lg font-bold text-foreground">{item.status}</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
