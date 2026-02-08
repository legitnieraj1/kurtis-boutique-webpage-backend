"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function AdminLogin() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = getSupabaseClient();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (signInError) throw signInError;

            // Check if user is admin
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile?.role !== 'admin') {
                    await supabase.auth.signOut();
                    toast.error("Unauthorized: Admin access only");
                    return;
                }

                // Update Zustand Store
                const { useStore } = await import("@/lib/store");
                useStore.getState().login({
                    id: user.id,
                    email: user.email!,
                    full_name: profile.full_name,
                    role: profile.role
                });

                toast.success("Welcome Admin");
                router.push("/admin/dashboard");
                router.refresh();
            }

        } catch (error: any) {
            toast.error(error.message || "Failed to login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30">
            <div className="w-full max-w-md p-8 bg-background rounded-lg shadow-lg border border-border">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-serif font-bold">Admin Login</h1>
                    <p className="text-muted-foreground mt-2">Enter your credentials to access the panel</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="Enter admin email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="Enter password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <Button className="w-full" disabled={loading}>
                        {loading ? "Signing in..." : "Sign In"}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/" className="text-sm text-muted-foreground hover:text-primary">Return to Store</Link>
                </div>
            </div>
        </div>
    );
}
