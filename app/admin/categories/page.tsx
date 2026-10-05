"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface CategoryRow {
    id: string;
    name: string;
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<CategoryRow[]>([]);
    // Order as last saved, to know whether there is anything to save.
    const [savedOrder, setSavedOrder] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch(`/api/categories?view=list&_t=${Date.now()}`, { cache: "no-store" })
            .then(res => res.json())
            .then(data => {
                const rows: CategoryRow[] = data.categories || [];
                setCategories(rows);
                setSavedOrder(rows.map(c => c.id));
            })
            .catch(() => toast.error("Failed to load categories"))
            .finally(() => setLoading(false));
    }, []);

    const dirty = categories.some((c, i) => c.id !== savedOrder[i]);

    const move = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= categories.length) return;
        const next = [...categories];
        [next[index], next[target]] = [next[target], next[index]];
        setCategories(next);
    };

    const save = async () => {
        setSaving(true);
        try {
            const ids = categories.map(c => c.id);
            const res = await fetch("/api/admin/categories/reorder", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Failed to save order");
            setSavedOrder(ids);
            toast.success("Category order saved");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save order");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8 space-y-6 max-w-2xl">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold">Categories</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Set the order of the category bubbles on the homepage. The first category appears first.
                    </p>
                </div>
                <Button onClick={save} disabled={!dirty || saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save order
                </Button>
            </div>

            <div className="bg-background rounded-lg border border-border shadow-sm divide-y divide-border">
                {loading ? (
                    <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : categories.length === 0 ? (
                    <p className="p-8 text-center text-muted-foreground">No categories yet.</p>
                ) : (
                    categories.map((category, index) => (
                        <div key={category.id} className="flex items-center gap-4 px-4 py-3">
                            <span className="w-6 text-sm text-muted-foreground tabular-nums">{index + 1}</span>
                            <span className="flex-1 font-medium">{category.name}</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Move ${category.name} up`}
                                disabled={index === 0 || saving}
                                onClick={() => move(index, -1)}
                            >
                                <ArrowUp className="w-4 h-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Move ${category.name} down`}
                                disabled={index === categories.length - 1 || saving}
                                onClick={() => move(index, 1)}
                            >
                                <ArrowDown className="w-4 h-4" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
