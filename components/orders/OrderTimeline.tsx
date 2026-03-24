"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderTimeline as OrderTimelineType } from "@/lib/supabase/types";

interface OrderTimelineProps {
    status: string;
    createdAt: string;
    shippedAt?: string | null;
    deliveredAt?: string | null;
    timeline?: OrderTimelineType[];
}

type StepId = 'confirmed' | 'shipped' | 'out_for_delivery' | 'delivered';

export function OrderTimeline({ status, createdAt, shippedAt, deliveredAt, timeline }: OrderTimelineProps) {
    if (status === 'cancelled' || status === 'refunded') {
        return (
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <X className="w-6 h-6 text-red-600" />
                </div>
                <div>
                    <h3 className="text-red-800 font-medium text-lg">Order {status === 'cancelled' ? 'Cancelled' : 'Refunded'}</h3>
                    <p className="text-red-600/80 text-sm">This order has been {status === 'cancelled' ? 'cancelled' : 'refunded'} and will not be delivered.</p>
                </div>
            </div>
        );
    }

    // Determine current active step index (0-3)
    let currentStepIndex = 0; // Confirmed
    if (['shipped'].includes(status)) {
        currentStepIndex = 1;
    } else if (['in_transit'].includes(status)) {
        currentStepIndex = 2;
    } else if (['delivered'].includes(status)) {
        currentStepIndex = 3;
    }

    // Attempt to extract dates for steps
    const formatDate = (dateString?: string | null) => {
        if (!dateString) return null;
        try {
            return new Date(dateString).toLocaleDateString("en-US", {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (e) {
            return null;
        }
    };

    const outForDeliveryTimelineItem = timeline?.find(t => t.status === 'in_transit');

    const steps = [
        {
            id: 'confirmed',
            label: 'Confirmed',
            date: formatDate(createdAt),
            completed: currentStepIndex >= 0
        },
        {
            id: 'shipped',
            label: 'Shipped',
            date: formatDate(shippedAt) || (currentStepIndex >= 1 ? 'Processing...' : null),
            completed: currentStepIndex >= 1
        },
        {
            id: 'out_for_delivery',
            label: 'Out for Delivery',
            date: formatDate(outForDeliveryTimelineItem?.created_at) || (currentStepIndex >= 2 ? 'In Transit...' : null),
            completed: currentStepIndex >= 2
        },
        {
            id: 'delivered',
            label: 'Delivered',
            date: formatDate(deliveredAt),
            completed: currentStepIndex >= 3
        }
    ];

    return (
        <div className="bg-[#eafaea] px-6 md:px-10 py-8 rounded-2xl mb-8 border border-[#cbebcc]">
            {/* Header like Derma Co (Optional based on screenshot, we can omit greeting or keep it simple) */}
            <div className="mb-8">
                <h3 className="text-[#207a5d] font-bold text-lg mb-1">Track order</h3>
            </div>

            <div className="relative">
                {/* Connecting Lines */}
                <div className="absolute top-4 left-[12.5%] w-[75%] h-1 bg-[#cbebcc] -z-10 rounded"></div>
                
                <div className="absolute top-4 left-[12.5%] h-1 bg-[#207a5d] -z-10 rounded transition-all duration-500 ease-in-out" 
                     style={{ width: `${(currentStepIndex / (steps.length - 1)) * 75}%` }}></div>

                <div className="flex justify-between relative z-10 w-full">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex flex-col items-center w-1/4">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center border-[3px] transition-colors duration-300",
                                step.completed 
                                    ? "bg-[#207a5d] border-[#207a5d] text-white" 
                                    : "bg-white border-[#cbebcc] text-transparent"
                            )}>
                                {step.completed && <Check className="w-5 h-5 stroke-[3]" />}
                            </div>
                            
                            <div className="text-center mt-3">
                                <span className={cn(
                                    "block text-sm font-bold md:min-h-5",
                                    step.completed ? "text-slate-800" : "text-slate-500"
                                )}>
                                    {step.label}
                                </span>
                                {step.date && (
                                    <span className={cn(
                                        "block text-xs mt-1 md:min-h-4",
                                        step.completed ? "text-slate-600" : "text-slate-400"
                                    )}>
                                        {step.date}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
