"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomisationFormProps {
    productId: string;
    productName: string;
    /** Called when user clicks "Buy Customised".
     *  Parent validates size selection, embeds note in product name, adds to cart, and navigates to checkout. */
    onBuyCustomised: (note: string, mobile: string, contactPreference: "whatsapp" | "call") => void;
}

const CUSTOMISATION_TYPES = [
    "Feeding Zip",
    "Sleeve Length",
    "Size Adjustment",
    "Neck Design",
    "Fabric Change",
    "Other",
];

export function CustomisationForm({ productId, productName, onBuyCustomised }: CustomisationFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [message, setMessage] = useState("");
    const [contactPreference, setContactPreference] = useState<"whatsapp" | "call">("whatsapp");
    const [mobileNumber, setMobileNumber] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleType = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const handleBuyCustomised = (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedTypes.length === 0 && !message.trim()) {
            alert("Please select a customisation type or describe your requirement.");
            return;
        }

        if (!mobileNumber.trim()) {
            alert("Please enter your mobile number so we can confirm the customisation details with you.");
            return;
        }

        setIsSubmitting(true);

        // Build a readable note — this becomes the product name in the order (admin + Shiprocket)
        const parts: string[] = [];
        if (selectedTypes.length > 0) parts.push(selectedTypes.join(", "));
        if (message.trim()) parts.push(`"${message.trim()}"`);
        parts.push(`${contactPreference === "whatsapp" ? "WhatsApp" : "Call"}: ${mobileNumber}`);

        const fullNote = parts.join(" | ");

        onBuyCustomised(fullNote, mobileNumber, contactPreference);
        setIsSubmitting(false);
    };

    return (
        <div className="mt-8 w-full">
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm transition-all duration-300">

                {/* Accordion Header */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between p-6 bg-stone-50/50 hover:bg-stone-50 transition-colors text-left"
                >
                    <div>
                        <h2 className="text-xl font-serif font-medium text-stone-900">Looking for Customisation?</h2>
                        <p className="text-sm text-stone-500 mt-1">Choose your options & buy your customised order directly</p>
                    </div>
                    <div className={cn("bg-white p-2 rounded-full border border-stone-200 transition-transform duration-300", isOpen ? "rotate-180" : "rotate-0")}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-500">
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </div>
                </button>

                {/* Collapsible Content */}
                <div className={cn(
                    "transition-all duration-500 ease-in-out overflow-hidden",
                    isOpen ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"
                )}>
                    <div className="p-6 pt-2 border-t border-stone-100">
                        <form onSubmit={handleBuyCustomised} className="space-y-5">

                            {/* Customisation Type Tags */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-stone-800">What do you need customised?</label>
                                <div className="flex flex-wrap gap-2">
                                    {CUSTOMISATION_TYPES.map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => toggleType(type)}
                                            className={cn(
                                                "px-4 py-2 rounded-full text-sm border transition-all",
                                                selectedTypes.includes(type)
                                                    ? "bg-[#801848] text-white border-[#801848]"
                                                    : "bg-background border-input hover:border-[#801848]/50"
                                            )}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Details Textarea */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-stone-800">Describe your customisation</label>
                                <textarea
                                    rows={3}
                                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#801848]"
                                    placeholder="e.g. Add feeding zip on left side, 3/4 sleeve, baby size 6 months…"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>

                            {/* Contact — WhatsApp / Call only (no Email) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-stone-800">Preferred Contact</label>
                                    <div className="flex bg-background border border-input rounded-md p-1 h-10 items-center">
                                        {(["whatsapp", "call"] as const).map((method) => (
                                            <button
                                                key={method}
                                                type="button"
                                                onClick={() => setContactPreference(method)}
                                                className={cn(
                                                    "flex-1 text-sm font-medium rounded-sm h-full transition-all",
                                                    contactPreference === method
                                                        ? "bg-stone-200 text-stone-900 shadow-sm"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {method === "whatsapp" ? "WhatsApp" : "Call"}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-stone-800">
                                        Mobile Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="Your WhatsApp / mobile number"
                                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-[#801848] focus:outline-none"
                                        value={mobileNumber}
                                        onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9+]/g, ""))}
                                    />
                                </div>
                            </div>

                            {/* Info chip */}
                            <p className="text-xs text-stone-500 bg-stone-50 rounded-lg px-4 py-2 border border-stone-100">
                                ✂️ Your customisation details will be attached to this order. Our team will confirm and stitch before shipping.
                            </p>

                            <Button
                                type="submit"
                                size="lg"
                                disabled={isSubmitting}
                                className="w-full bg-[#801848] hover:bg-[#6b143c] text-white gap-2"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                                ) : (
                                    <><ShoppingBag className="h-4 w-4" /> Buy Customised</>
                                )}
                            </Button>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
