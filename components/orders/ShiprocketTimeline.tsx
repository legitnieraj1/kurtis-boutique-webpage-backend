"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Truck, PackageCheck, MapPin, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimelineEvent {
    status: string;
    date: string;
    location: string;
    description: string;
}

interface ShiprocketTimelineProps {
    awb: string;
    onClose: () => void;
}

export function ShiprocketTimeline({ awb, onClose }: ShiprocketTimelineProps) {
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentStatus, setCurrentStatus] = useState<string>("");
    const [etd, setEtd] = useState<string | null>(null);

    useEffect(() => {
        const fetchTracking = async () => {
            try {
                const res = await fetch(`/api/shiprocket/track?awb=${awb}`);
                const data = await res.json();

                if (data.success) {
                    setTimeline(data.timeline || []);
                    setCurrentStatus(data.currentStatus);
                    setEtd(data.etd);
                } else {
                    setError(data.error || "Failed to load tracking details");
                }
            } catch (err) {
                setError("Something went wrong");
            } finally {
                setLoading(false);
            }
        };

        fetchTracking();
    }, [awb]);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-stone-50">
                    <div>
                        <h3 className="font-serif font-bold text-lg text-stone-800">Tracking Details</h3>
                        <p className="text-xs text-stone-500 font-mono">AWB: {awb}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-stone-200">
                        <X className="w-5 h-5 text-stone-500" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-stone-500">Fetching status...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 space-y-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500">
                                <X className="w-6 h-6" />
                            </div>
                            <p className="text-red-600">{error}</p>
                            <Button onClick={onClose} variant="outline">Close</Button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Current Status Banner */}
                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center gap-4">
                                <div className="p-3 bg-white rounded-full shadow-sm">
                                    <Truck className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-stone-500 uppercase font-semibold tracking-wider">Current Status</p>
                                    <p className="font-bold text-lg text-primary">{currentStatus}</p>
                                    {etd && <p className="text-xs text-stone-500 mt-1">Expected Delivery: {new Date(etd).toDateString()}</p>}
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="relative pl-4 border-l-2 border-stone-100 space-y-8 ml-2">
                                {timeline.length === 0 ? (
                                    <p className="text-center text-stone-400 italic py-4">No tracking updates available yet.</p>
                                ) : (
                                    timeline.map((event, index) => (
                                        <div key={index} className="relative">
                                            {/* Dot */}
                                            <div className={`absolute -left-[21px] top-0 w-4 h-4 rounded-full border-2 ${index === 0 ? 'bg-primary border-primary' : 'bg-white border-stone-300'}`} />

                                            <div className="space-y-1">
                                                <p className="font-semibold text-stone-800 text-sm">{event.status}</p>
                                                <p className="text-xs text-stone-500">{event.date}</p>
                                                {event.location && (
                                                    <div className="flex items-center gap-1 text-xs text-stone-400">
                                                        <MapPin className="w-3 h-3" /> {event.location}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
