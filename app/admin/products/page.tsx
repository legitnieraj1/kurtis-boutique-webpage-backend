"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash, EyeOff, Loader2, Search, X, GripVertical, ArrowUpDown, Check, ArrowUp, ArrowDown, ChevronsUp } from "lucide-react";
import ProductForm from "@/components/admin/ProductForm";
import { toast } from "sonner";
import { getProductCategoryIds } from "@/lib/productCategories";

// Define matching types
interface Product {
    id: string;
    name: string;
    category: any;
    category_id?: string | null;
    category_ids?: string[] | null;
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
    const [search, setSearch] = useState("");
    const [activeSearch, setActiveSearch] = useState("");
    const [hasLoaded, setHasLoaded] = useState(false);
    const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
    // Reorder state
    const [reorderMode, setReorderMode] = useState(false);
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const dragIndexRef = useRef<number | null>(null);
    const startYRef = useRef<number>(0);
    const isDragActiveRef = useRef<boolean>(false);
    const tableContainerRef = useRef<HTMLDivElement | null>(null);
    const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const stopAutoScroll = () => {
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
        };
    }, []);

    useEffect(() => {
        fetch(`/api/categories?view=list&_t=${Date.now()}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                const names: Record<string, string> = {};
                for (const c of data.categories || []) names[c.id] = c.name;
                setCategoryNames(names);
            })
            .catch(() => { /* the primary category still renders from the product row */ });
    }, []);

    // Fetch Products
    const fetchProducts = useCallback(async (term: string = activeSearch) => {
        setLoading(true);
        try {
            // view=summary asks for only the columns this table renders. The
            // default shape joins eight related tables and every product
            // column, none of which appear below — that payload was the
            // reason this screen took seconds to appear.
            const query = term.trim() ? `&search=${encodeURIComponent(term.trim())}` : "";
            const res = await fetch(`/api/products?view=summary&limit=all${query}&t=${Date.now()}`, {
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

    // ── Drag-and-drop & Reorder helpers ──────────────────────────────────
    // Uses Pointer Events with touch-action:none and pointer capture so that
    // touch on mobile, mouse on desktop, and stylus work identically without
    // the mobile browser intercepting the long press as a "copy/save image" gesture.
    const moveProduct = useCallback((from: number, to: number) => {
        if (from === to || from < 0 || to < 0) return;
        setProducts(prev => {
            if (from >= prev.length || to >= prev.length) return prev;
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
    }, []);

    const moveOne = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= products.length) return;
        moveProduct(index, target);
    };

    const moveToTop = (index: number) => {
        if (index <= 0) return;
        setProducts(prev => {
            const next = [...prev];
            const [moved] = next.splice(index, 1);
            next.unshift(moved);
            return next;
        });
        toast.info("Moved to top");
    };

    const checkAutoScroll = (clientY: number) => {
        const threshold = 80;
        const viewportHeight = window.innerHeight;

        if (clientY < threshold) {
            const speed = -Math.max(4, Math.min(16, (threshold - clientY) / 3));
            if (!scrollIntervalRef.current) {
                scrollIntervalRef.current = setInterval(() => {
                    window.scrollBy({ top: speed, behavior: 'instant' as ScrollBehavior });
                }, 16);
            }
        } else if (clientY > viewportHeight - threshold) {
            const speed = Math.max(4, Math.min(16, (clientY - (viewportHeight - threshold)) / 3));
            if (!scrollIntervalRef.current) {
                scrollIntervalRef.current = setInterval(() => {
                    window.scrollBy({ top: speed, behavior: 'instant' as ScrollBehavior });
                }, 16);
            }
        } else {
            stopAutoScroll();
        }
    };

    const handleGripPointerDown = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
        if (e.button !== 0) return; // Only left click or primary touch
        dragIndexRef.current = index;
        startYRef.current = e.clientY;
        isDragActiveRef.current = false;
        try {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {}
    };

    const handleGripPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (dragIndexRef.current === null) return;

        const dy = Math.abs(e.clientY - startYRef.current);
        if (!isDragActiveRef.current) {
            if (dy < 6) return;
            isDragActiveRef.current = true;
            setDraggingIndex(dragIndexRef.current);
        }

        e.preventDefault();
        checkAutoScroll(e.clientY);

        // Probe for row under client coordinates. Clamp probeX slightly inside container
        // bounds so horizontal finger drifts near screen edges still hit rows cleanly.
        const containerRect = tableContainerRef.current?.getBoundingClientRect();
        const probeX = containerRect
            ? Math.min(Math.max(e.clientX, containerRect.left + 30), containerRect.right - 30)
            : e.clientX;

        const targetEl = document.elementFromPoint(probeX, e.clientY);
        const rowEl = targetEl?.closest('[data-reorder-index]');
        if (rowEl) {
            const toIndex = Number(rowEl.getAttribute('data-reorder-index'));
            const fromIndex = dragIndexRef.current;
            if (!Number.isNaN(toIndex) && toIndex !== fromIndex && toIndex >= 0 && toIndex < products.length) {
                moveProduct(fromIndex, toIndex);
                dragIndexRef.current = toIndex;
                setDraggingIndex(toIndex);
            }
        }
    };

    const handleGripPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
        stopAutoScroll();
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            try {
                e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {}
        }
        dragIndexRef.current = null;
        isDragActiveRef.current = false;
        setDraggingIndex(null);
    };

    const saveOrder = async () => {
        setIsSavingOrder(true);
        try {
            const order = products.map((p, i) => ({ id: p.id, display_order: i + 1 }));
            const res = await fetch('/api/admin/products/reorder', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || 'Failed to save order');
                return;
            }
            toast.success('Product order saved!');
            setReorderMode(false);
            fetchProducts();
        } catch {
            toast.error('Failed to save order');
        } finally {
            setIsSavingOrder(false);
        }
    };

    // Only the very first load takes over the screen. Later loads (a search,
    // a refresh) keep the table and search box mounted so typing is not
    // interrupted and focus is never lost.
    if (!hasLoaded) return <div className="p-4 sm:p-8 flex items-center gap-2"><Loader2 className="animate-spin" /> Loading products...</div>;

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold">Products ({products.length})</h1>
                    <Button variant="outline" size="sm" onClick={() => fetchProducts()} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                    </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {!isAdding && !editingProduct && !reorderMode && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setSearch(''); setReorderMode(true); }}
                            title="Drag rows or use arrows to reorder products on the shop page"
                        >
                            <ArrowUpDown className="w-4 h-4 mr-2" />
                            Reorder Products
                        </Button>
                    )}
                    {reorderMode && (
                        <>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setReorderMode(false); fetchProducts(); }}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={saveOrder}
                                disabled={isSavingOrder}
                            >
                                {isSavingOrder ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                Save Order
                            </Button>
                        </>
                    )}
                    {!isAdding && !editingProduct && !reorderMode && (
                        <Button onClick={() => setIsAdding(true)}>
                            <Plus className="w-4 h-4 mr-2" /> Add Product
                        </Button>
                    )}
                </div>
            </div>

            {!isAdding && !editingProduct && !reorderMode && (
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

            {(isAdding || editingProduct) && !reorderMode && (
                <ProductForm
                    initialData={editingProduct}
                    onSuccess={handleSave}
                    onCancel={() => { setIsAdding(false); setEditingProduct(null); }}
                />
            )}

            {!isAdding && !editingProduct && (
                <div
                    ref={tableContainerRef}
                    className="bg-background rounded-lg border border-border overflow-hidden shadow-sm"
                >
                    {reorderMode && (
                        <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 text-xs sm:text-sm text-amber-800 flex flex-wrap items-center justify-between gap-2 select-none">
                            <div className="flex items-center gap-2">
                                <GripVertical className="w-4 h-4 shrink-0 text-amber-700" />
                                <span>
                                    Drag the handle <span className="font-semibold">⋮⋮</span> or tap <span className="font-semibold">↑ / ↓</span> to reorder.
                                </span>
                            </div>
                            <span className="text-amber-900 font-medium text-[11px] sm:text-xs bg-amber-100 px-2 py-0.5 rounded">
                                Tap &quot;Save Order&quot; to apply
                            </span>
                        </div>
                    )}
                    <div className={reorderMode ? "overflow-x-visible" : "overflow-x-auto"}>
                        <table className={`w-full text-sm text-left ${reorderMode ? 'min-w-full' : 'min-w-[600px] md:min-w-full'}`}>
                            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border select-none">
                                <tr>
                                    {reorderMode && (
                                        <th className="px-2 sm:px-3 py-3 w-12 sm:w-16 text-center text-xs">
                                            #
                                        </th>
                                    )}
                                    <th className="px-3 sm:px-6 py-3">Product</th>
                                    <th className="px-6 py-3 hidden md:table-cell">Category</th>
                                    <th className={`px-4 sm:px-6 py-3 ${reorderMode ? 'hidden sm:table-cell' : ''}`}>Price</th>
                                    <th className="px-6 py-3 hidden md:table-cell">Stock</th>
                                    {reorderMode ? (
                                        <th className="px-2 sm:px-4 py-3 text-right text-xs">Move</th>
                                    ) : (
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {products.map((product, index) => {
                                    const inStock = product.stock_remaining > 0;
                                    const displayImage = product.images?.length
                                        ? [...product.images].sort(
                                            (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
                                        )[0].image_url
                                        : undefined;

                                    return (
                                        <tr
                                            key={product.id}
                                            data-reorder-index={index}
                                            className={`transition-colors select-none ${
                                                reorderMode && draggingIndex === index
                                                    ? 'bg-amber-100/70 dark:bg-amber-950/40 ring-2 ring-amber-400 ring-inset shadow-md'
                                                    : 'hover:bg-muted/10'
                                            }`}
                                        >
                                            {reorderMode && (
                                                <td className="px-2 sm:px-3 py-3 text-muted-foreground text-center align-middle">
                                                    <div className="flex items-center justify-center gap-1 select-none">
                                                        <div
                                                            data-drag-handle
                                                            style={{ touchAction: 'none' }}
                                                            className="p-2 -m-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none select-none [-webkit-touch-callout:none] [-webkit-user-select:none] flex items-center justify-center rounded hover:bg-muted/50 transition-colors"
                                                            onPointerDown={(e) => handleGripPointerDown(e, index)}
                                                            onPointerMove={handleGripPointerMove}
                                                            onPointerUp={handleGripPointerEnd}
                                                            onPointerCancel={handleGripPointerEnd}
                                                            title="Drag to reorder"
                                                            aria-label={`Drag to reorder ${product.name}`}
                                                        >
                                                            <GripVertical className="w-4 h-4 pointer-events-none" />
                                                        </div>
                                                        <span className="text-[11px] sm:text-xs font-mono text-muted-foreground/80 w-5 text-right tabular-nums select-none">
                                                            {index + 1}
                                                        </span>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-3 sm:px-6 py-3 font-medium text-foreground select-none">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded bg-muted overflow-hidden relative border border-border shrink-0 select-none">
                                                        {displayImage ? (
                                                            <img
                                                                src={displayImage}
                                                                alt={product.name}
                                                                draggable={false}
                                                                onContextMenu={(e) => e.preventDefault()}
                                                                className="w-full h-full object-cover select-none pointer-events-none [-webkit-touch-callout:none]"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-stone-200 select-none pointer-events-none" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0 select-none">
                                                        <span className="truncate max-w-[170px] sm:max-w-xs md:max-w-sm text-sm" title={product.name}>
                                                            {product.name}
                                                        </span>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span>Qty: {product.stock_remaining}</span>
                                                            {reorderMode && (
                                                                <span className="sm:hidden font-medium text-foreground">
                                                                    • {formatPrice(product.discount_price && product.discount_price < product.price ? product.discount_price : product.price)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 hidden md:table-cell select-none">
                                                {(() => {
                                                    const names = getProductCategoryIds(product)
                                                        .map(id => categoryNames[id])
                                                        .filter(Boolean);
                                                    const shown = names.length ? names : product.category?.name ? [product.category.name] : [];
                                                    if (!shown.length) return '-';
                                                    return (
                                                        <div className="flex flex-wrap gap-1">
                                                            {shown.map(name => (
                                                                <span key={name} className="px-2 py-0.5 rounded-full bg-muted text-xs capitalize whitespace-nowrap">
                                                                    {name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className={`px-4 sm:px-6 py-3 select-none ${reorderMode ? 'hidden sm:table-cell' : ''}`}>
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
                                            <td className="px-6 py-3 hidden md:table-cell select-none">
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
                                            {reorderMode ? (
                                                <td className="px-2 sm:px-4 py-3 text-right whitespace-nowrap select-none">
                                                    <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted touch-manipulation"
                                                            onClick={() => moveToTop(index)}
                                                            disabled={index === 0}
                                                            title="Move to top"
                                                            aria-label={`Move ${product.name} to top`}
                                                        >
                                                            <ChevronsUp className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted touch-manipulation"
                                                            onClick={() => moveOne(index, -1)}
                                                            disabled={index === 0}
                                                            title="Move up"
                                                            aria-label={`Move ${product.name} up`}
                                                        >
                                                            <ArrowUp className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted touch-manipulation"
                                                            onClick={() => moveOne(index, 1)}
                                                            disabled={index === products.length - 1}
                                                            title="Move down"
                                                            aria-label={`Move ${product.name} down`}
                                                        >
                                                            <ArrowDown className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            ) : (
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
                                            )}
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
