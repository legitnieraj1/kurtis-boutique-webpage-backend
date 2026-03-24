"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Trash, ArrowRight, ArrowLeft, Upload, Plus, X, ChevronsUp, Loader2, ChevronDown, Edit2 } from "lucide-react";
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
                is_active: true,
                colors,
                is_mom_baby: isMomBaby,
                is_family_combo: isFamilyCombo,
                mom_baby_combos: isMomBaby && momPrice && babyBasePriceMB ? [{ mom_price: parseFloat(momPrice + ''), baby_base_price: parseFloat(babyBasePriceMB + '') }] : [],
                family_combos: isFamilyCombo && motherPrice && fatherPrice && babyBasePriceFC ? [{ mother_price: parseFloat(motherPrice + ''), father_price: parseFloat(fatherPrice + ''), baby_base_price: parseFloat(babyBasePriceFC + '') }] : [],
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
                    <div className="flex flex-wrap gap-4">
                        {existingImages.map((img: any, i) => (
                            <div key={img.id || i} className="relative w-24 h-32 border rounded overflow-hidden group">
                                <img src={img.image_url} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!initialData?.id || !img.id) return;
                                        if (!confirm("Delete this image?")) return;
                                        try {
                                            const res = await fetch(`/api/products/${initialData.id}/images?imageId=${img.id}`, { method: 'DELETE' });
                                            if (!res.ok) throw new Error("Failed to delete");
                                            setExistingImages(existingImages.filter((_: any, idx: number) => idx !== i));
                                            toast.success("Image deleted");
                                        } catch (error) {
                                            toast.error("Failed to delete image");
                                        }
                                    }}
                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                    title="Delete image"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        {newImages.map((file, i) => (
                            <div key={`new-${i}`} className="relative w-24 h-32 border rounded overflow-hidden bg-gray-100 flex items-center justify-center group">
                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setNewImages(newImages.filter((_, idx) => idx !== i))}
                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                    title="Remove image"
                                >
                                    <X className="w-3 h-3" />
                                </button>
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
