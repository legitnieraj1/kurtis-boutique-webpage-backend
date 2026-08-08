"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Edit, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LookForm } from "./LookForm";
import { lookThumbnail, type Look } from "@/lib/shopByLook";

export function LookList() {
    const [looks, setLooks] = useState<Look[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingLook, setEditingLook] = useState<Look | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const fetchLooks = async () => {
        try {
            const res = await fetch("/api/admin/shop-by-look");
            if (!res.ok) throw new Error("Failed to fetch looks");
            const data = await res.json();
            setLooks(data.looks || []);
        } catch (error) {
            console.error("Failed to fetch looks:", error);
            toast.error("Failed to load looks");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLooks();
    }, []);

    const closeForm = () => {
        setEditingLook(null);
        setIsCreating(false);
        fetchLooks();
    };

    const toggleStatus = async (look: Look) => {
        try {
            const res = await fetch(`/api/admin/shop-by-look/${look.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: !look.is_active }),
            });
            if (!res.ok) throw new Error("Failed to update status");
            toast.success(`Look ${!look.is_active ? "shown" : "hidden"}`);
            fetchLooks();
        } catch (error) {
            console.error("Failed to toggle look:", error);
            toast.error("Failed to update look");
        }
    };

    const deleteLook = async (id: string) => {
        if (!confirm("Delete this look? The product itself is not affected.")) return;
        try {
            const res = await fetch(`/api/admin/shop-by-look/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete look");
            toast.success("Look deleted");
            fetchLooks();
        } catch (error) {
            console.error("Failed to delete look:", error);
            toast.error("Failed to delete look");
        }
    };

    const moveLook = async (index: number, direction: "up" | "down") => {
        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= looks.length) return;

        const reordered = [...looks];
        const [removed] = reordered.splice(index, 1);
        reordered.splice(newIndex, 0, removed);

        try {
            await Promise.all(
                reordered.map((look, i) =>
                    fetch(`/api/admin/shop-by-look/${look.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ display_order: i }),
                    })
                )
            );
            fetchLooks();
        } catch (error) {
            console.error("Failed to reorder looks:", error);
            toast.error("Failed to reorder looks");
        }
    };

    const isFormOpen = isCreating || !!editingLook;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-6 md:p-0">
            <div className="flex items-center justify-end">
                {!isFormOpen && (
                    <Button onClick={() => setIsCreating(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Add Look
                    </Button>
                )}
            </div>

            {isFormOpen && <LookForm initialData={editingLook} onClose={closeForm} />}

            {!isFormOpen && looks.length === 0 && (
                <div className="text-center py-16 border border-dashed border-border rounded-lg text-muted-foreground">
                    <p>No looks yet. Add a reel and link it to a product.</p>
                </div>
            )}

            {!isFormOpen && looks.length > 0 && (
                <ul className="space-y-3">
                    {looks.map((look, index) => {
                        const thumb = lookThumbnail(look);
                        return (
                            <li
                                key={look.id}
                                className="flex items-center gap-4 bg-white border border-border rounded-lg p-3"
                            >
                                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded bg-muted">
                                    {thumb && (
                                        <Image src={thumb} alt="" fill sizes="64px" quality={70} className="object-cover" />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">
                                        {look.title || look.product?.name || "Untitled look"}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {look.product ? `/product/${look.product.slug}` : "Product missing"}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {look.video_url || look.instagram_url}
                                    </p>
                                    {!look.is_active && (
                                        <span className="inline-block mt-1 text-[10px] uppercase tracking-wide bg-muted px-2 py-0.5 rounded">
                                            Hidden
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => moveLook(index, "up")}
                                        disabled={index === 0}
                                        aria-label="Move up"
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => moveLook(index, "down")}
                                        disabled={index === looks.length - 1}
                                        aria-label="Move down"
                                    >
                                        <ArrowDown className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => toggleStatus(look)}
                                        aria-label={look.is_active ? "Hide look" : "Show look"}
                                    >
                                        {look.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingLook(look)}
                                        aria-label="Edit look"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteLook(look.id)}
                                        aria-label="Delete look"
                                        className="text-red-500 hover:text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
