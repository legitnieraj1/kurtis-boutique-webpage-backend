"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Truck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
    const [tn, setTn] = useState("");
    const [outside, setOutside] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/settings/shipping")
            .then(res => res.json())
            .then(data => {
                if (data.rates) {
                    setTn(String(data.rates.tn));
                    setOutside(String(data.rates.outside));
                }
            })
            .catch(() => toast.error("Failed to load shipping rates"))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/settings/shipping", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tn: Number(tn), outside: Number(outside) }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save");
            toast.success("Shipping rates updated");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-serif font-bold">Store Settings</h1>
                <p className="text-muted-foreground text-sm mt-1">Manage shipping rates and store configuration.</p>
            </div>

            <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
                <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
                    <Truck className="w-5 h-5 text-primary" />
                    Shipping Rates
                </h2>
                <p className="text-sm text-muted-foreground">
                    Charged flat per order based on the delivery pincode. Tamil Nadu pincodes start with 60–64.
                </p>

                {loading ? (
                    <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="tn-rate" className="text-sm font-medium">Inside Tamil Nadu (₹)</label>
                                <input
                                    id="tn-rate"
                                    type="number"
                                    min="0"
                                    required
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={tn}
                                    onChange={e => setTn(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="outside-rate" className="text-sm font-medium">Outside Tamil Nadu (₹)</label>
                                <input
                                    id="outside-rate"
                                    type="number"
                                    min="0"
                                    required
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={outside}
                                    onChange={e => setOutside(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button type="submit" disabled={saving} className="gap-2">
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Rates
                        </Button>
                    </>
                )}
            </form>
        </div>
    );
}
