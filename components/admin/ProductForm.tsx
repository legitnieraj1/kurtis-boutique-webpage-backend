"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Trash, ArrowRight, ArrowLeft, Upload, Plus, X, ChevronsUp, Loader2, ChevronDown, Edit2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { getSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface ProductFormProps {
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function ProductForm({ initialData, onSuccess, onCancel }: ProductFormProps) {
    // Form State
    const [name, setName] = useState(initialData?.name || "");
    const [categoryId, setCategoryId] = useState(initialData?.category_id || "");
    const [price, setPrice] = useState(initialData?.price || "");
    const [description, setDescription] = useState(initialData?.description || "");

    // Images — one unified, orderable list mixing already-saved images and
    // pending new files. `key` is the drag identity; array position IS the
    // display order, so there's no separate index bookkeeping to drift out
    // of sync with what's rendered.
    interface ImageSlot {
        key: string;
        kind: "existing" | "new";
        id?: string;
        file?: File;
        url: string;
        color: string;
    }
    const [images, setImages] = useState<ImageSlot[]>(() =>
        (initialData?.images || [])
            .slice()
            .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
            .map((img: any) => ({
                key: img.id,
                kind: "existing" as const,
                id: img.id,
                url: img.image_url,
                color: img.color || "",
            }))
    );
    const [draggingKey, setDraggingKey] = useState<string | null>(null);
    const slotRefs = useRef(new Map<string, HTMLDivElement>());
    const dragRef = useRef<{
        key: string;
        pointerId: number;
        started: boolean;
        startX: number;
        startY: number;
    } | null>(null);

    // Sizes & Colors
    const [sizes, setSizes] = useState<string[]>(initialData?.sizes?.map((s: any) => s.size) || []);
    const [colors, setColors] = useState<string[]>(initialData?.colors || []);
    const [newColorName, setNewColorName] = useState("");
    const [newColorHex, setNewColorHex] = useState("#ff0000");

    // Combos
    const [isMomBaby, setIsMomBaby] = useState(initialData?.is_mom_baby || false);
    const [momPrice, setMomPrice] = useState(initialData?.mom_baby_combos?.[0]?.mom_price || "");
    const [babyBasePriceMB, setBabyBasePriceMB] = useState(initialData?.mom_baby_combos?.[0]?.baby_base_price || "");

    const [isFamilyCombo, setIsFamilyCombo] = useState(initialData?.is_family_combo || false);
    const [motherPrice, setMotherPrice] = useState(initialData?.family_combos?.[0]?.mother_price || "");
    const [fatherPrice, setFatherPrice] = useState(initialData?.family_combos?.[0]?.father_price || "");
    const [babyBasePriceFC, setBabyBasePriceFC] = useState(initialData?.family_combos?.[0]?.baby_base_price || "");

    const [isCoupleCombo, setIsCoupleCombo] = useState(initialData?.is_couple_combo || false);
    const [womenPrice, setWomenPrice] = useState(initialData?.couple_combos?.[0]?.women_price || "");
    const [menPrice, setMenPrice] = useState(initialData?.couple_combos?.[0]?.men_price || "");

    const [allowBabyOnly, setAllowBabyOnly] = useState(initialData?.allow_baby_only || false);

    // Customisation add-ons: any number of named charges (e.g. Extra Length, Feeding Zip)
    const [addons, setAddons] = useState<{ name: string; price: string }[]>(
        initialData?.addons?.map((a: any) => ({ name: a.name, price: a.price.toString() })) || []
    );

    // Baby Size Prices
    const [babySizePrices, setBabySizePrices] = useState<{size: string, price: string}[]>(
        initialData?.baby_size_prices?.map((p: any) => ({ size: p.size, price: p.price.toString() })) || []
    );

    // Inventory
    const [stockTotal, setStockTotal] = useState(initialData?.stock_total || 0);
    const [stockRemaining, setStockRemaining] = useState(initialData?.stock_remaining || 0);

    // Discount
    const [discountPrice, setDiscountPrice] = useState(initialData?.discount_price || "");

    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // New Category State
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    
    // Custom Category Dropdown State
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editCategoryName, setEditCategoryName] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
                setEditingCategory(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        fetchCatergories();
    }, []);

    const fetchCatergories = () => {
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => setCategories(data.categories || []));
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'new') {
            setIsAddingCategory(true);
            setCategoryId("");
        } else {
            setCategoryId(val);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        setIsCreatingCategory(true);
        try {
            const slug = newCategoryName.toLowerCase().replace(/\s+/g, '-');
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newCategoryName,
                    slug: slug,
                    is_active: true
                })
            });

            if (!res.ok) throw new Error("Failed to create category");

            const data = await res.json();
            toast.success("Category created");
            await fetchCatergories(); // Refresh list
            setCategoryId(data.category.id); // Select new category
            setIsAddingCategory(false);
            setNewCategoryName("");
        } catch (error) {
            toast.error("Failed to create category");
        } finally {
            setIsCreatingCategory(false);
        }
    };

    const startEditCategory = (c: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingCategory(c.id);
        setEditCategoryName(c.name);
    };

    const saveEditCategory = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!editCategoryName.trim()) return;
        try {
            const slug = editCategoryName.toLowerCase().replace(/\s+/g, '-');
            const res = await fetch(`/api/categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editCategoryName, slug })
            });
            if (!res.ok) throw new Error("Failed to edit category");
            toast.success("Category updated");
            setEditingCategory(null);
            fetchCatergories();
        } catch (error) {
            toast.error("Failed to update category");
        }
    };

    const handleDeleteCategory = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this category? (It will fail if products are linked to it)")) return;
        try {
            const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || "Failed to delete category");
            }
            toast.success("Category deleted");
            if (categoryId === id) setCategoryId("");
            fetchCatergories();
        } catch (error: any) {
            toast.error(error.message || "Error deleting category");
        }
    };

    // Sync stock remaining with total for new products
    useEffect(() => {
        if (!initialData) setStockRemaining(stockTotal);
    }, [stockTotal, initialData]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const added: ImageSlot[] = Array.from(e.target.files).map((file, i) => ({
            key: `new-${Date.now()}-${i}-${file.name}`,
            kind: "new",
            file,
            url: URL.createObjectURL(file),
            color: "",
        }));
        setImages(prev => [...prev, ...added]);
        e.target.value = ""; // allow re-selecting the same file
    };

    const updateImageColor = (key: string, color: string) => {
        setImages(prev => prev.map(img => img.key === key ? { ...img, color } : img));
    };

    const removeImage = async (slot: ImageSlot) => {
        if (slot.kind === "existing") {
            if (!initialData?.id || !slot.id) return;
            if (!confirm("Delete this image?")) return;
            try {
                const res = await fetch(`/api/products/${initialData.id}/images?imageId=${slot.id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error("Failed to delete");
                setImages(prev => prev.filter(img => img.key !== slot.key));
                toast.success("Image deleted");
            } catch {
                toast.error("Failed to delete image");
            }
        } else {
            URL.revokeObjectURL(slot.url);
            setImages(prev => prev.filter(img => img.key !== slot.key));
        }
    };

    // Image reordering, on pointer events.
    //
    // This previously used the HTML5 drag-and-drop API (the `draggable`
    // attribute plus onDragStart/onDragOver/onDrop), which broke in both
    // places it was used:
    //
    //   * Touch devices do not implement HTML5 drag-and-drop at all. No
    //     dragstart ever fired, so a long press fell through to the
    //     browser's built-in image gesture — the "copy / save image" menu
    //     the reorder appeared to be doing instead of moving anything.
    //   * On desktop, onDragStart never called dataTransfer.setData() or
    //     set effectAllowed, so the drag defaulted to a *copy* operation:
    //     copy cursor, and a ghost of the picture dragged along with it.
    //
    // Pointer events give mouse, touch and pen one identical code path,
    // and the arrow buttons below cover keyboard and any case where a
    // drag is awkward.
    const DRAG_THRESHOLD_PX = 6;

    const registerSlot = (key: string) => (el: HTMLDivElement | null) => {
        if (el) slotRefs.current.set(key, el);
        else slotRefs.current.delete(key);
    };

    const moveImage = (fromKey: string, toKey: string) => {
        setImages(prev => {
            const from = prev.findIndex(img => img.key === fromKey);
            const to = prev.findIndex(img => img.key === toKey);
            if (from === -1 || to === -1 || from === to) return prev;
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
    };

    // Nudge one position left/right — the accessible fallback, and the
    // reliable route on a small screen.
    const shiftImage = (key: string, delta: number) => {
        setImages(prev => {
            const from = prev.findIndex(img => img.key === key);
            if (from === -1) return prev;
            const to = from + delta;
            if (to < 0 || to >= prev.length) return prev;
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
    };

    // Which thumbnail sits under this point? Rects are re-read on every
    // move because the grid reflows as items swap places.
    const slotKeyAtPoint = (x: number, y: number) => {
        for (const [key, el] of Array.from(slotRefs.current.entries())) {
            const r = el.getBoundingClientRect();
            if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return key;
        }
        return null;
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, key: string) => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;

        // Leave the delete button and the colour <select> alone.
        if (target.closest('button, select')) return;

        // On touch, only the grip handle starts a drag. If the whole
        // thumbnail did, the grid would swallow every vertical swipe and
        // the page could no longer be scrolled past the image row.
        if (e.pointerType !== 'mouse' && !target.closest('[data-drag-handle]')) return;

        dragRef.current = {
            key,
            pointerId: e.pointerId,
            started: false,
            startX: e.clientX,
            startY: e.clientY,
        };
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== e.pointerId) return;

        if (!drag.started) {
            // Require real travel first, so a plain click or tap on the
            // thumbnail is still a click and not a zero-distance drag.
            const dx = e.clientX - drag.startX;
            const dy = e.clientY - drag.startY;
            if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD_PX) return;

            drag.started = true;
            setDraggingKey(drag.key);
            // Capture keeps the move/up events coming to this element even
            // when the pointer leaves it, which it immediately does.
            e.currentTarget.setPointerCapture(e.pointerId);
        }

        e.preventDefault();

        const overKey = slotKeyAtPoint(e.clientX, e.clientY);
        if (overKey && overKey !== drag.key) moveImage(drag.key, overKey);
    };

    const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== e.pointerId) return;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        dragRef.current = null;
        setDraggingKey(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const endpoint = initialData ? `/api/products/${initialData.id}` : '/api/products';
            const method = initialData ? 'PUT' : 'POST';

            // 1. Create/Update Product
            // 1. Create/Update Product
            const slug = initialData?.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now();
            const productBody = {
                name,
                slug,
                category_id: categoryId || null,
                description,
                price: parseFloat(price),
                discount_price: discountPrice ? parseFloat(discountPrice) : null,
                stock_total: parseInt(stockTotal + ''),
                stock_remaining: parseInt(stockRemaining + ''),
                sizes: sizes.map(s => ({ size: s, stock: Math.floor((parseInt(stockRemaining + '') || 0) / (sizes.length || 1)) })),
                is_active: true,
                colors,
                is_mom_baby: isMomBaby,
                is_family_combo: isFamilyCombo,
                is_couple_combo: isCoupleCombo,
                allow_baby_only: allowBabyOnly,
                addons: addons.filter(a => a.name && a.price).map(a => ({ name: a.name, price: parseFloat(a.price) })),
                mom_baby_combos: isMomBaby && momPrice && babyBasePriceMB ? [{ mom_price: parseFloat(momPrice + ''), baby_base_price: parseFloat(babyBasePriceMB + '') }] : [],
                family_combos: isFamilyCombo && motherPrice && fatherPrice && babyBasePriceFC ? [{ mother_price: parseFloat(motherPrice + ''), father_price: parseFloat(fatherPrice + ''), baby_base_price: parseFloat(babyBasePriceFC + '') }] : [],
                couple_combos: isCoupleCombo && womenPrice && menPrice ? [{ women_price: parseFloat(womenPrice + ''), men_price: parseFloat(menPrice + '') }] : [],
                baby_size_prices: babySizePrices.filter(p => p.size && p.price).map(p => ({ size: p.size, price: parseFloat(p.price) })),
            };

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productBody)
            });

            const data = await res.json();

            if (!res.ok) {
                // Display actual error from server
                throw new Error(data.error || `Server Error (${res.status})`);
            }

            const productId = data.product?.id;

            // 2 & 3. Upload new images and update existing ones' order/colour in
            // parallel — the array position is the display_order, so whatever
            // the admin dragged into place is exactly what gets saved. Sequential
            // awaits here is what made multi-image saves feel slow.
            const newUploads = images
                .map((img, idx) => ({ img, idx }))
                .filter(({ img }) => img.kind === "new")
                .map(({ img, idx }) => {
                    const fd = new FormData();
                    fd.append('file', img.file!);
                    fd.append('display_order', String(idx));
                    if (img.color) fd.append('color', img.color);
                    return fetch(`/api/products/${productId}/images`, { method: 'POST', body: fd });
                });

            const existingUpdates = images
                .map((img, idx) => ({ img, idx }))
                .filter(({ img }) => img.kind === "existing");
            const reorderCall = existingUpdates.length > 0
                ? fetch(`/api/products/${productId}/images`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        images: existingUpdates.map(({ img, idx }) => ({
                            id: img.id,
                            display_order: idx,
                            color: img.color || null,
                        })),
                    }),
                })
                : Promise.resolve(null);

            await Promise.all([...newUploads, reorderCall]);

            toast.success("Product saved successfully");
            onSuccess();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to save");
        } finally {
            setLoading(false);
        }
    };

    const toggleSize = (size: string) => {
        setSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
    };

    const handleAddColor = () => {
        if (!newColorName.trim()) return;
        const colorStr = `${newColorName.trim()}|${newColorHex}`;
        if (!colors.includes(colorStr)) {
            setColors([...colors, colorStr]);
        }
        setNewColorName("");
    };

    const removeColor = (colorStr: string) => {
        setColors(colors.filter(c => c !== colorStr));
    };

    const addBabySizePrice = () => {
        setBabySizePrices([...babySizePrices, { size: "", price: "" }]);
    };

    const updateBabySizePrice = (index: number, field: 'size' | 'price', value: string) => {
        const newPrices = [...babySizePrices];
        newPrices[index][field] = value;
        setBabySizePrices(newPrices);
    };

    const removeBabySizePrice = (index: number) => {
        setBabySizePrices(babySizePrices.filter((_, i) => i !== index));
    };

    const addAddon = () => {
        setAddons([...addons, { name: "", price: "" }]);
    };

    const updateAddon = (index: number, field: 'name' | 'price', value: string) => {
        const next = [...addons];
        next[index][field] = value;
        setAddons(next);
    };

    const removeAddon = (index: number) => {
        setAddons(addons.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-background p-6 rounded-lg border border-border shadow-md mb-8 animate-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium font-serif">{initialData ? 'Edit Product' : 'Add New Product'}</h2>
                <Button variant="ghost" size="icon" onClick={onCancel}><X className="w-5 h-5" /></Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Product Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border rounded-md"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Category</label>
                        {isAddingCategory ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 px-3 py-2 border rounded-md"
                                    placeholder="New Category Name"
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    autoFocus
                                />
                                <Button type="button" onClick={handleCreateCategory} disabled={isCreatingCategory}>
                                    {isCreatingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                                </Button>
                                <Button type="button" variant="ghost" onClick={() => { setIsAddingCategory(false); setCategoryId(""); }}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="relative" ref={dropdownRef}>
                                <div
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full px-3 py-2 border rounded-md cursor-pointer bg-background flex justify-between items-center"
                                >
                                    <span>{categories.find(c => c.id === categoryId)?.name || "Select Category"}</span>
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                </div>
                                
                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                                        <div 
                                            className="px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border text-muted-foreground text-sm"
                                            onClick={() => { setCategoryId(""); setIsDropdownOpen(false); }}
                                        >
                                            Select Category
                                        </div>
                                        {categories.map(c => (
                                            <div key={c.id} className="flex justify-between items-center px-3 py-2 hover:bg-muted/50 border-b border-border last:border-0 group">
                                                {editingCategory === c.id ? (
                                                    <div className="flex gap-2 w-full items-center">
                                                        <input 
                                                            value={editCategoryName} 
                                                            onChange={(e) => setEditCategoryName(e.target.value)} 
                                                            onClick={(e) => e.stopPropagation()} 
                                                            className="flex-1 px-2 py-1 border rounded min-w-0 text-sm" 
                                                            autoFocus
                                                        />
                                                        <Button type="button" size="sm" onClick={(e) => saveEditCategory(c.id, e)} className="h-7 px-2 text-xs">Save</Button>
                                                        <Button type="button" size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingCategory(null); }} className="h-7 w-7"><X className="w-3 h-3" /></Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span 
                                                            onClick={() => { setCategoryId(c.id); setIsDropdownOpen(false); }} 
                                                            className="flex-1 cursor-pointer truncate"
                                                        >
                                                            {c.name}
                                                        </span>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                            <button type="button" onClick={(e) => startEditCategory(c, e)} className="p-1 text-muted-foreground hover:text-blue-500 rounded"><Edit2 size={14} /></button>
                                                            <button type="button" onClick={(e) => handleDeleteCategory(c.id, e)} className="p-1 text-muted-foreground hover:text-red-500 rounded"><Trash size={14} /></button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                        <div 
                                            className="p-3 bg-muted/20 cursor-pointer text-primary text-sm font-medium hover:bg-muted/50 transition-colors" 
                                            onClick={() => { setIsAddingCategory(true); setIsDropdownOpen(false); }}
                                        >
                                            + Add New Category
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium">Description</label>
                        <textarea
                            required
                            className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Price (₹)</label>
                        <input
                            type="number"
                            required
                            className="w-full px-3 py-2 border rounded-md"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Discount Price (Optional)</label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border rounded-md"
                            value={discountPrice}
                            onChange={e => setDiscountPrice(e.target.value)}
                        />
                    </div>
                </div>

                {/* Sizes and Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Sizes</label>
                        <div className="flex gap-2 flex-wrap">
                            {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map(size => (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => toggleSize(size)}
                                    className={`px-3 py-1 border rounded-full text-sm ${sizes.includes(size) ? 'bg-primary text-white border-primary' : 'bg-background'}`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 block">Colors</label>
                        <div className="flex gap-2 flex-wrap mb-3">
                            {colors.map(colorStr => {
                                const [name, hex] = colorStr.includes('|') ? colorStr.split('|') : [colorStr, '#cccccc'];
                                return (
                                    <div key={colorStr} className="flex items-center gap-2 px-3 py-1 border border-input rounded-full bg-background shadow-sm">
                                        <div className="w-4 h-4 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: hex }}></div>
                                        <span className="text-sm font-medium">{name}</span>
                                        <button 
                                            type="button" 
                                            onClick={() => removeColor(colorStr)} 
                                            className="text-muted-foreground hover:text-red-500 transition-colors ml-1"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex items-center gap-2 max-w-sm">
                            <div className="p-1 border border-input rounded-md flex-shrink-0 bg-background overflow-hidden relative w-10 h-10 shadow-sm cursor-pointer hover:border-primary/50 transition-colors">
                                <input 
                                    type="color" 
                                    value={newColorHex} 
                                    onChange={(e) => setNewColorHex(e.target.value)} 
                                    className="absolute inset-0 w-20 h-20 -top-2 -left-2 cursor-pointer" 
                                />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Color Name (e.g. Ruby Red)" 
                                value={newColorName} 
                                onChange={(e) => setNewColorName(e.target.value)} 
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddColor())}
                                className="flex-1 px-3 py-2 border border-input rounded-md text-sm shadow-sm" 
                            />
                            <Button type="button" onClick={handleAddColor} variant="outline" size="sm" className="h-[38px]">Add</Button>
                        </div>
                    </div>
                </div>

                {/* Stock */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Total Stock</label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border rounded-md"
                            value={stockTotal}
                            onChange={e => setStockTotal(Number(e.target.value))}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Remaining Stock</label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border rounded-md"
                            value={stockRemaining}
                            onChange={e => setStockRemaining(Number(e.target.value))}
                        />
                    </div>
                </div>

                {/* Combos & Advanced Pricing */}
                <div className="space-y-6 border-t pt-6">
                    <h3 className="text-lg font-medium">Advanced Variants & Combos</h3>
                    
                    {/* Mom & Baby */}
                    <div className="p-4 border rounded-md space-y-4 bg-muted/20">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="momBaby" checked={isMomBaby} onChange={e => setIsMomBaby(e.target.checked)} className="w-4 h-4" />
                            <label htmlFor="momBaby" className="font-medium">Mom & Baby Combo Available</label>
                        </div>
                        {isMomBaby && (
                            <div className="grid grid-cols-2 gap-4 pl-6">
                                <div className="space-y-2">
                                    <label className="text-sm">Mom Price (₹)</label>
                                    <input type="number" required placeholder="e.g. 1999" className="w-full px-3 py-2 border rounded-md" value={momPrice} onChange={e => setMomPrice(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm">Baby Base Price (₹)</label>
                                    <input type="number" required placeholder="e.g. 999" className="w-full px-3 py-2 border rounded-md" value={babyBasePriceMB} onChange={e => setBabyBasePriceMB(e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Family Combo */}
                    <div className="p-4 border rounded-md space-y-4 bg-muted/20">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="familyCombo" checked={isFamilyCombo} onChange={e => setIsFamilyCombo(e.target.checked)} className="w-4 h-4" />
                            <label htmlFor="familyCombo" className="font-medium">Family Combo Available</label>
                        </div>
                        {isFamilyCombo && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                                <div className="space-y-2">
                                    <label className="text-sm">Mother Price (₹)</label>
                                    <input type="number" required placeholder="e.g. 1999" className="w-full px-3 py-2 border rounded-md" value={motherPrice} onChange={e => setMotherPrice(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm">Father Price (₹)</label>
                                    <input type="number" required placeholder="e.g. 1499" className="w-full px-3 py-2 border rounded-md" value={fatherPrice} onChange={e => setFatherPrice(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm">Baby Base Price (₹)</label>
                                    <input type="number" required placeholder="e.g. 999" className="w-full px-3 py-2 border rounded-md" value={babyBasePriceFC} onChange={e => setBabyBasePriceFC(e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Couples Combo */}
                    <div className="p-4 border rounded-md space-y-4 bg-muted/20">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="coupleCombo" checked={isCoupleCombo} onChange={e => setIsCoupleCombo(e.target.checked)} className="w-4 h-4" />
                            <label htmlFor="coupleCombo" className="font-medium">Couples Combo Available (Women + Men)</label>
                        </div>
                        {isCoupleCombo && (
                            <div className="grid grid-cols-2 gap-4 pl-6">
                                <div className="space-y-2">
                                    <label className="text-sm">Women&apos;s Price (₹)</label>
                                    <input type="number" required placeholder="e.g. 1999" className="w-full px-3 py-2 border rounded-md" value={womenPrice} onChange={e => setWomenPrice(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm">Men&apos;s Shirt Price (₹)</label>
                                    <input type="number" required placeholder="e.g. 1299" className="w-full px-3 py-2 border rounded-md" value={menPrice} onChange={e => setMenPrice(e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Baby Only */}
                    <div className="p-4 border rounded-md space-y-4 bg-muted/20">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="allowBabyOnly" checked={allowBabyOnly} onChange={e => setAllowBabyOnly(e.target.checked)} className="w-4 h-4" />
                            <label htmlFor="allowBabyOnly" className="font-medium">Allow Baby-Only Purchase</label>
                        </div>
                        {allowBabyOnly && (
                            <p className="text-sm text-muted-foreground pl-6">
                                Customers can buy just the baby dress. Priced from the Baby Size Pricing list below — add sizes and prices there.
                            </p>
                        )}
                    </div>

                    {/* Customisation Add-on Charges */}
                    <div className="p-4 border rounded-md space-y-4 bg-muted/20">
                        <div className="flex items-center justify-between">
                            <label className="font-medium">Customisation Add-on Charges</label>
                            <Button type="button" variant="outline" size="sm" onClick={addAddon}>
                                <Plus className="w-4 h-4 mr-2" /> Add Charge
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">Extra charges shown at size selection (e.g. Extra Length, Feeding Zip). Add or remove as many as needed.</p>
                        {addons.map((addon, index) => (
                            <div key={index} className="flex gap-4 items-center pl-6">
                                <input
                                    type="text"
                                    placeholder="Name (e.g. Extra Length)"
                                    className="flex-1 px-3 py-2 border rounded-md"
                                    value={addon.name}
                                    onChange={e => updateAddon(index, 'name', e.target.value)}
                                />
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Price (₹)"
                                    className="flex-1 px-3 py-2 border rounded-md"
                                    value={addon.price}
                                    onChange={e => updateAddon(index, 'price', e.target.value)}
                                />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeAddon(index)}>
                                    <Trash className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* Dynamic Baby Sizing */}
                    <div className="p-4 border rounded-md space-y-4 bg-muted/20">
                        <div className="flex items-center justify-between">
                            <label className="font-medium">Dynamic Baby Size Pricing</label>
                            <Button type="button" variant="outline" size="sm" onClick={addBabySizePrice}>
                                <Plus className="w-4 h-4 mr-2" /> Add Size Price
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">Specify unique prices for different baby ages/sizes.</p>
                        {babySizePrices.map((bp, index) => (
                            <div key={index} className="flex gap-4 items-center pl-6">
                                <input
                                    type="text"
                                    placeholder="Size (e.g. 0-6m)"
                                    className="flex-1 px-3 py-2 border rounded-md"
                                    value={bp.size}
                                    onChange={e => updateBabySizePrice(index, 'size', e.target.value)}
                                    required
                                />
                                <input
                                    type="number"
                                    placeholder="Price (₹)"
                                    className="flex-1 px-3 py-2 border rounded-md"
                                    value={bp.price}
                                    onChange={e => updateBabySizePrice(index, 'price', e.target.value)}
                                    required
                                />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeBabySizePrice(index)}>
                                    <Trash className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Images */}
                <div>
                    <label className="text-sm font-medium mb-2 block">Images</label>
                    <p className="text-sm text-muted-foreground mb-3">
                        Drag a thumbnail to reorder, or use the arrows. The first image is what customers see first.
                        {colors.length > 0 && " Tag an image with a colour to show it only when that colour is selected — leave it as \"All colours\" to always show it."}
                    </p>
                    <div className="flex flex-wrap gap-4">
                        {images.map((img, index) => (
                            <div
                                key={img.key}
                                ref={registerSlot(img.key)}
                                className={cn(
                                    "w-24 space-y-1 select-none",
                                    draggingKey === img.key && "opacity-40"
                                )}
                                onPointerDown={(e) => handlePointerDown(e, img.key)}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerEnd}
                                onPointerCancel={handlePointerEnd}
                            >
                                <div
                                    className={cn(
                                        "relative w-24 h-32 border rounded overflow-hidden group transition-shadow",
                                        "md:cursor-grab md:active:cursor-grabbing",
                                        draggingKey && draggingKey !== img.key && "ring-1 ring-primary/30",
                                        draggingKey === img.key && "ring-2 ring-primary shadow-lg"
                                    )}
                                >
                                    <img
                                        src={img.url}
                                        alt=""
                                        // draggable={false} stops the browser's own
                                        // image drag, which is what produced the copy
                                        // ghost; the callout/select rules stop the
                                        // long-press "save image" menu on mobile.
                                        draggable={false}
                                        onContextMenu={(e) => e.preventDefault()}
                                        className="w-full h-full object-cover pointer-events-none select-none [-webkit-touch-callout:none]"
                                    />
                                    <div
                                        data-drag-handle
                                        title="Drag to reorder"
                                        // touch-action:none is what lets a touch drag
                                        // reach us at all — without it the browser
                                        // claims the gesture for scrolling. It is set
                                        // only on the grip so swiping anywhere else
                                        // still scrolls the page normally.
                                        className="absolute top-1 left-1 bg-black/60 text-white rounded p-1 cursor-grab active:cursor-grabbing touch-none md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                    >
                                        <GripVertical className="w-3 h-3 pointer-events-none" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeImage(img)}
                                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-md"
                                        title="Delete image"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                    {index === 0 && (
                                        <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] font-medium px-1.5 py-0.5 rounded">
                                            Cover
                                        </span>
                                    )}
                                </div>

                                {/* Explicit reorder controls: the reliable path on
                                    touch, and the only keyboard-reachable one. */}
                                <div className="flex items-center justify-between gap-1">
                                    <button
                                        type="button"
                                        onClick={() => shiftImage(img.key, -1)}
                                        disabled={index === 0}
                                        className="flex-1 flex items-center justify-center py-1 border rounded text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="Move earlier"
                                        aria-label={`Move image ${index + 1} earlier`}
                                    >
                                        <ArrowLeft className="w-3 h-3" />
                                    </button>
                                    <span className="text-[10px] text-muted-foreground tabular-nums w-4 text-center">
                                        {index + 1}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => shiftImage(img.key, 1)}
                                        disabled={index === images.length - 1}
                                        className="flex-1 flex items-center justify-center py-1 border rounded text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="Move later"
                                        aria-label={`Move image ${index + 1} later`}
                                    >
                                        <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                                {colors.length > 0 && (
                                    <select
                                        className="w-24 text-xs px-1 py-1 border rounded-md bg-background"
                                        value={img.color}
                                        onChange={e => updateImageColor(img.key, e.target.value)}
                                        aria-label="Image colour"
                                    >
                                        <option value="">All colours</option>
                                        {colors.map(colorStr => (
                                            <option key={colorStr} value={colorStr}>
                                                {colorStr.includes('|') ? colorStr.split('|')[0] : colorStr}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        ))}
                        <label className="w-24 h-32 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-muted">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                            <span className="text-xs mt-1">Add</span>
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                        </label>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-border">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                        Save Product
                    </Button>
                </div>
            </form>
        </div>
    );
}
