"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash, EyeOff, Loader2, Search, X } from "lucide-react";
import ProductForm from "@/components/admin/ProductForm";
import { toast } from "sonner";

// Define matching types
interface Product {
    id: string;
    name: string;
    category: any;
    price: number;
    discount_price?: number;
    stock_remaining: number;
    is_active: boolean;
    images: { image_url: string; display_order?: number }[];
}

export default function AdminProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [editLoadingId, setEditLoadingId] = useState<string | null>(null);
    // Search runs server-side so it covers the whole catalogue, not just the
    // first page of rows already loaded into the table.
    const [search, setSearch] = useState("");
    const [activeSearch, setActiveSearch] = useState("");
    const [hasLoaded, setHasLoaded] = useState(false);

    // Fetch Products
    const fetchProducts = useCallback(async (term: string = activeSearch) => {
        setLoading(true);
        try {
            // view=summary asks for only the columns this table renders. The
            // default shape joins eight related tables and every product
            // column, none of which appear below — that payload was the
            // reason this screen took seconds to appear.
            const query = term.trim() ? `&search=${encodeURIComponent(term.trim())}` : "";
            const res = await fetch(`/api/products?view=summary&limit=100${query}&t=${Date.now()}`, {
                headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
            });
            const data = await res.json();
            if (data.products) {
                setProducts(data.products);
            }
        } catch (error) {
            console.error("Failed to fetch products", error);
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
            setHasLoaded(true);
        }
    }, [activeSearch]);

    // Debounce typing so each keystroke does not fire its own request.
    useEffect(() => {
        const timer = setTimeout(() => setActiveSearch(search), 350);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchProducts(activeSearch);
    }, [activeSearch, fetchProducts]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        try {
            const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            
            const data = await res.json().catch(() => ({}));
            
            if (!res.ok) {
                if (res.status === 400 && data.softDeleted) {
                    toast.success(data.message || "Product marked as inactive.");
                    fetchProducts();
                    return;
                }
                throw new Error(data.error || "Failed to delete");
            }
            
            toast.success("Product deleted successfully");
            fetchProducts();
        } catch (error: any) {
            toast.error(error.message || "Error deleting product");
        }
    };

    // The list is fetched with view=summary, which omits sizes, colours,
    // combo pricing and add-ons. Handing that trimmed row to ProductForm
    // would open the editor with those sections blank and then save the
    // blanks over the real data — so load the full record on demand.
    const startEdit = async (id: string) => {
        setEditLoadingId(id);
        try {
            const res = await fetch(`/api/products/${id}?t=${Date.now()}`, {
                headers: { 'Cache-Control': 'no-cache' }
            });
            const data = await res.json();
            if (!res.ok || !data.product) throw new Error(data.error || "Failed to load product");
            setEditingProduct(data.product);
        } catch (error: any) {
            toast.error(error.message || "Could not open product for editing");
        } finally {
            setEditLoadingId(null);
        }
    };

    const handleSave = () => {
        setIsAdding(false);
        setEditingProduct(null);
        fetchProducts(); // Refresh list
    };

    // Only the very first load takes over the screen. Later loads (a search,
    // a refresh) keep the table and search box mounted so typing is not
    // interrupted and focus is never lost.
    if (!hasLoaded) return <div className="p-8 flex items-center gap-2"><Loader2 className="animate-spin" /> Loading products...</div>;

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-serif font-bold">Products ({products.length})</h1>
                    <Button variant="outline" size="sm" onClick={() => fetchProducts()} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                    </Button>
                </div>
                {!isAdding && !editingProduct && (
                    <Button onClick={() => setIsAdding(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Add Product
                    </Button>
                )}
            </div>

            {!isAdding && !editingProduct && (
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search products by name"
                        aria-label="Search products by name"
                        className="pl-9 pr-9 bg-background"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch("")}
                            aria-label="Clear search"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
                        >
                            <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                    )}
                </div>
            )}

            {(isAdding || editingProduct) && (
                <ProductForm
                    initialData={editingProduct}
                    onSuccess={handleSave}
                    onCancel={() => { setIsAdding(false); setEditingProduct(null); }}
                />
            )}

            {!isAdding && !editingProduct && (
                <div className="bg-background rounded-lg border border-border overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[600px] md:min-w-full">
                            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                                <tr>
                                    <th className="px-6 py-3">Product</th>
                                    <th className="px-6 py-3 hidden md:table-cell">Category</th>
                                    <th className="px-6 py-3">Price</th>
                                    <th className="px-6 py-3 hidden md:table-cell">Stock</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {products.map(product => {
                                    const inStock = product.stock_remaining > 0;
                                    // Nested rows come back in no guaranteed order,
                                    // so pick the lowest display_order rather than
                                    // trusting whichever row arrived first.
                                    const displayImage = product.images?.length
                                        ? [...product.images].sort(
                                            (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
                                        )[0].image_url
                                        : undefined;

                                    return (
                                        <tr key={product.id} className="hover:bg-muted/10">
                                            <td className="px-6 py-4 font-medium text-foreground flex items-center gap-3">
                                                <div className="w-10 h-10 rounded bg-muted overflow-hidden relative border border-border shrink-0">
                                                    {displayImage ? (
                                                        <img src={displayImage} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-stone-200" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span>{product.name}</span>
                                                    <span className="text-xs text-muted-foreground md:hidden">Qty: {product.stock_remaining}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 capitalize hidden md:table-cell">{product.category?.name || '-'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    {product.discount_price && product.discount_price < product.price ? (
                                                        <>
                                                            <span className="font-medium">{formatPrice(product.discount_price)}</span>
                                                            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>
                                                        </>
                                                    ) : (
                                                        formatPrice(product.price)
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex gap-2">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {inStock ? 'In Stock' : 'Out of Stock'}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground ml-2">({product.stock_remaining})</span>
                                                    </div>
                                                    {!product.is_active && (
                                                        <span className="inline-flex items-center w-fit px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => startEdit(product.id)}
                                                    disabled={editLoadingId === product.id}
                                                >
                                                    {editLoadingId === product.id
                                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                                        : <Edit className="w-4 h-4" />}
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(product.id)}>
                                                    <Trash className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {!loading && products.length === 0 && (
                            <div className="p-10 text-center text-muted-foreground text-sm">
                                {activeSearch
                                    ? `No products match "${activeSearch}".`
                                    : "No products yet."}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
