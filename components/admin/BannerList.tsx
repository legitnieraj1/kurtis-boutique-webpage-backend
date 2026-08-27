"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUp, ArrowDown, Eye, Edit, Trash2, Monitor, Smartphone, MonitorSmartphone } from "lucide-react";
import { toast } from "sonner";
import { BannerForm } from "./BannerForm";
import {
    BANNER_DEVICE_LABEL,
    BANNER_DEVICE_TYPES,
    normalizeDeviceType,
    type BannerDeviceType,
} from "@/lib/banners";

interface Banner {
    id: string;
    image_url: string;
    link_url: string;
    title?: string;
    subtitle?: string;
    is_active: boolean;
    display_order: number;
    device_type?: BannerDeviceType | null;
}

const TAB_ICON: Record<BannerDeviceType, typeof Monitor> = {
    all: MonitorSmartphone,
    desktop: Monitor,
    mobile: Smartphone,
};

const TAB_HINT: Record<BannerDeviceType, string> = {
    all: "Legacy banners shown on every screen size. 21:9 landscape.",
    desktop: "Shown only on screens 768px and wider. 21:9 landscape.",
    mobile: "Shown only on screens under 768px. 9:16 portrait, fills the phone screen.",
};

export function BannerList() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [activeTab, setActiveTab] = useState<BannerDeviceType>("desktop");
    const [isReordering, setIsReordering] = useState(false);
    // Land on the legacy group when it still holds banners, so an existing
    // setup does not open on an empty tab.
    const pickedInitialTab = useRef(false);

    // Fetch banners from API
    const fetchBanners = async () => {
        try {
            const res = await fetch('/api/admin/banners');
            if (!res.ok) throw new Error('Failed to fetch banners');
            const data = await res.json();
            setBanners(data.banners || []);
        } catch (error) {
            console.error('Failed to fetch banners:', error);
            toast.error('Failed to load banners');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    // Each device group is an independent carousel, so it is ordered on its own.
    const groups = useMemo(() => {
        const byDevice: Record<BannerDeviceType, Banner[]> = { all: [], desktop: [], mobile: [] };
        for (const banner of banners) {
            byDevice[normalizeDeviceType(banner.device_type)].push(banner);
        }
        for (const key of BANNER_DEVICE_TYPES) {
            byDevice[key].sort((a, b) => a.display_order - b.display_order);
        }
        return byDevice;
    }, [banners]);

    useEffect(() => {
        if (loading || pickedInitialTab.current) return;
        pickedInitialTab.current = true;
        if (groups.all.length > 0) setActiveTab('all');
    }, [loading, groups]);

    const visibleBanners = groups[activeTab];

    // Close form handler
    const closeForm = () => {
        setEditingBanner(null);
        setIsCreating(false);
        fetchBanners(); // Refresh after form close
    };

    // Toggle banner status
    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/admin/banners/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !currentStatus })
            });
            if (!res.ok) throw new Error('Failed to update status');
            toast.success(`Banner ${!currentStatus ? 'activated' : 'deactivated'}`);
            fetchBanners();
        } catch (error) {
            console.error('Failed to toggle status:', error);
            toast.error('Failed to update banner status');
        }
    };

    // Delete banner
    const deleteBanner = async (id: string) => {
        if (!confirm('Are you sure you want to delete this banner?')) return;
        try {
            const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete banner');
            toast.success('Banner deleted');
            fetchBanners();
        } catch (error) {
            console.error('Failed to delete banner:', error);
            toast.error('Failed to delete banner');
        }
    };

    // Move a banner within its own device group.
    const moveBanner = async (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= visibleBanners.length || isReordering) return;

        const reordered = [...visibleBanners];
        const [removed] = reordered.splice(index, 1);
        reordered.splice(newIndex, 0, removed);

        setIsReordering(true);
        try {
            await Promise.all(
                reordered.map((banner, i) =>
                    fetch(`/api/admin/banners/${banner.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ display_order: i })
                    })
                )
            );
            await fetchBanners();
        } catch (error) {
            console.error('Failed to reorder banners:', error);
            toast.error('Failed to reorder banners');
        } finally {
            setIsReordering(false);
        }
    };

    const isFormOpen = isCreating || !!editingBanner;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-6 md:p-0">
            {!isFormOpen && (
                <>
                    {/* Device sub-sections */}
                    <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
                        {BANNER_DEVICE_TYPES.map((tab) => {
                            const Icon = TAB_ICON[tab];
                            const count = groups[tab].length;
                            // The legacy "All Devices" group is hidden once it is empty,
                            // so new setups only see the two real choices.
                            if (tab === 'all' && count === 0) return null;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab
                                        ? "bg-[#C5A265] text-white shadow-sm"
                                        : "text-stone-600 hover:bg-stone-100"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {BANNER_DEVICE_LABEL[tab]}
                                    <span className={`text-xs rounded-full px-1.5 py-0.5 ${activeTab === tab ? "bg-white/25" : "bg-stone-200 text-stone-600"
                                        }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <p className="text-sm text-stone-500">{TAB_HINT[activeTab]}</p>
                        <Button
                            onClick={() => setIsCreating(true)}
                            className="bg-[#C5A265] hover:bg-[#B08D55] text-white rounded-md px-6 py-2 h-10 shadow-sm transition-colors text-sm font-medium w-full md:w-auto shrink-0"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Add {BANNER_DEVICE_LABEL[activeTab]} Banner
                        </Button>
                    </div>
                </>
            )}

            {isFormOpen ? (
                <div className="animate-in slide-in-from-top-4 fade-in duration-300">
                    <BannerForm
                        initialData={editingBanner}
                        defaultDeviceType={activeTab}
                        onClose={closeForm}
                    />
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
                    <div className="w-full">
                        {/* Table Header */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                            <div className="col-span-4">Banner Image</div>
                            <div className="col-span-4">Redirect Link</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2 text-right">Actions</div>
                        </div>

                        {/* Table Body */}
                        <div className="px-4 py-4 md:px-6 md:py-0">
                            {visibleBanners.length === 0 ? (
                                <div className="text-center py-24">
                                    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Plus className="w-8 h-8 text-stone-300" />
                                    </div>
                                    <h3 className="text-lg font-medium text-stone-900 mb-1">
                                        No {BANNER_DEVICE_LABEL[activeTab].toLowerCase()} banners yet
                                    </h3>
                                    <p className="text-stone-500 max-w-sm mx-auto">
                                        {activeTab === 'mobile'
                                            ? 'Add a 9:16 banner that fills the phone screen.'
                                            : 'Add your first hero banner.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4 md:space-y-0 divide-y divide-stone-100">
                                    {visibleBanners.map((banner, index) => (
                                        <div
                                            key={banner.id}
                                            className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 items-center"
                                        >
                                            {/* Image */}
                                            <div className="col-span-4">
                                                {banner.image_url ? (
                                                    <img
                                                        src={banner.image_url}
                                                        alt="Banner"
                                                        className={`object-cover rounded border ${activeTab === 'mobile' ? 'w-12 h-[85px]' : 'w-24 h-14'
                                                            }`}
                                                    />
                                                ) : (
                                                    <div className={`bg-stone-100 rounded border flex items-center justify-center text-stone-400 text-xs ${activeTab === 'mobile' ? 'w-12 h-[85px]' : 'w-24 h-14'
                                                        }`}>
                                                        No Img
                                                    </div>
                                                )}
                                            </div>

                                            {/* Link */}
                                            <div className="col-span-4 text-sm text-primary truncate">
                                                {banner.link_url || '/'}
                                            </div>

                                            {/* Status */}
                                            <div className="col-span-2">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${banner.is_active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-stone-100 text-stone-500'
                                                    }`}>
                                                    {banner.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="col-span-2 flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => moveBanner(index, 'up')}
                                                    disabled={index === 0 || isReordering}
                                                    className="p-1.5 text-stone-400 hover:text-stone-600 disabled:opacity-30"
                                                >
                                                    <ArrowUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => moveBanner(index, 'down')}
                                                    disabled={index === visibleBanners.length - 1 || isReordering}
                                                    className="p-1.5 text-stone-400 hover:text-stone-600 disabled:opacity-30"
                                                >
                                                    <ArrowDown className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(banner.id, banner.is_active)}
                                                    className="p-1.5 text-stone-400 hover:text-stone-600"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingBanner(banner)}
                                                    className="p-1.5 text-stone-400 hover:text-blue-600"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteBanner(banner.id)}
                                                    className="p-1.5 text-stone-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
