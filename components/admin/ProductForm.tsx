"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash, ArrowRight, ArrowLeft, Upload, Plus, X, ChevronsUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getSupabaseClient } from "@/lib/supabase/client";

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

    // Images: existing URLs + new Files
    const [existingImages, setExistingImages] = useState<any[]>(initialData?.images || []);
    const [newImages, setNewImages] = useState<File[]>([]);

    // Sizes
    const [sizes, setSizes] = useState<string[]>(initialData?.sizes?.map((s: any) => s.size) || []);

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

    // Sync stock remaining with total for new products
    useEffect(() => {
        if (!initialData) setStockRemaining(stockTotal);
    }, [stockTotal, initialData]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setNewImages([...newImages, ...Array.from(e.target.files)]);
        }
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
                is_active: true
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

            // 2. Upload New Images
            if (newImages.length > 0) {
                const formData = new FormData();
                newImages.forEach(file => {
                    formData.append('file', file); // API expects single file currently?
                });

                // My API currently accepts one file per request for simplicity in `app/api/products/[id]/images`.
                // Implementing loop for multiple uploads
                for (const file of newImages) {
                    const fd = new FormData();
                    fd.append('file', file);
                    await fetch(`/api/products/${productId}/images`, { method: 'POST', body: fd });
                }
            }

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
                            <select
                                className="w-full px-3 py-2 border rounded-md"
                                required
                                value={categoryId}
                                onChange={handleCategoryChange}
                            >
                                <option value="">Select Category</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                <option value="new">+ Add New Category</option>
                            </select>
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

                {/* Sizes */}
                <div>
                    <label className="text-sm font-medium mb-2 block">Sizes</label>
                    <div className="flex gap-2 flex-wrap">
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
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

                {/* Images */}
                <div>
                    <label className="text-sm font-medium mb-2 block">Images</label>
                    <div className="flex flex-wrap gap-4">
                        {existingImages.map((img: any, i) => (
                            <div key={i} className="relative w-24 h-32 border rounded overflow-hidden">
                                <img src={img.image_url} className="w-full h-full object-cover" />
                            </div>
                        ))}
                        {newImages.map((file, i) => (
                            <div key={`new-${i}`} className="relative w-24 h-32 border rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                                <span className="text-xs text-center p-1">{file.name}</span>
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
