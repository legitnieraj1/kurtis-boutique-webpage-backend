"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef } from "react";
import { X, Upload, Trash2, Loader2, Monitor, Smartphone, MonitorSmartphone } from "lucide-react";
import { ImageCropperModal } from "./ImageCropperModal";
import { toast } from "sonner";
import {
    BANNER_ASPECT,
    BANNER_DEVICE_LABEL,
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

interface BannerFormProps {
    initialData?: Banner | null;
    /** Device group the admin was viewing when they hit "Add Banner". */
    defaultDeviceType?: BannerDeviceType;
    onClose: () => void;
}

type FormData = {
    link_url: string;
    is_active: boolean;
};

const DEVICE_OPTIONS: { value: BannerDeviceType; icon: typeof Monitor; hint: string }[] = [
    { value: "all", icon: MonitorSmartphone, hint: "Shown to everyone (21:9)" },
    { value: "desktop", icon: Monitor, hint: "Only screens ≥ 768px (21:9)" },
    { value: "mobile", icon: Smartphone, hint: "Only screens < 768px (9:16, full screen)" },
];

export function BannerForm({ initialData, defaultDeviceType = "all", onClose }: BannerFormProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.image_url || null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deviceType, setDeviceType] = useState<BannerDeviceType>(
        initialData ? normalizeDeviceType(initialData.device_type) : defaultDeviceType,
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cropper State
    const [showCropper, setShowCropper] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);

    const { register, handleSubmit } = useForm<FormData>({
        defaultValues: {
            link_url: initialData?.link_url || "",
            is_active: initialData?.is_active ?? true,
        },
    });

    const isMobileBanner = deviceType === "mobile";
    const aspect = BANNER_ASPECT[deviceType];
    // Portrait previews are capped so the 9:16 box does not take over the form.
    const previewBoxClass = isMobileBanner
        ? "relative w-full max-w-[240px] aspect-[9/16] rounded-lg overflow-hidden border border-stone-200 group"
        : "relative w-full aspect-[21/9] rounded-lg overflow-hidden border border-stone-200 group";
    const emptyBoxClass = isMobileBanner
        ? "w-full max-w-[240px] aspect-[9/16] rounded-lg border-2 border-dashed border-stone-200 hover:border-stone-400 hover:bg-stone-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-stone-400 hover:text-stone-600"
        : "w-full aspect-[21/9] rounded-lg border-2 border-dashed border-stone-200 hover:border-stone-400 hover:bg-stone-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-stone-400 hover:text-stone-600";

    // Changing the target device changes the required crop, so an image cropped
    // for the previous shape is flagged rather than silently saved.
    const [croppedFor, setCroppedFor] = useState<BannerDeviceType | null>(null);
    const ratioMismatch =
        !!previewUrl &&
        (croppedFor
            ? BANNER_ASPECT[croppedFor] !== aspect
            : !!initialData && BANNER_ASPECT[normalizeDeviceType(initialData.device_type)] !== aspect);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 20 * 1024 * 1024) {
            toast.error("File is too large. Please choose an image under 20MB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setTempImage(base64String);
            setShowCropper(true);
            if (fileInputRef.current) fileInputRef.current.value = "";
        };
        reader.readAsDataURL(file);
    };

    const handleCroppedImage = async (croppedBase64: string) => {
        // Convert base64 to blob for upload
        const response = await fetch(croppedBase64);
        const blob = await response.blob();
        const file = new File([blob], `banner_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedFile(file);
        setPreviewUrl(croppedBase64);
        setCroppedFor(deviceType);
        setShowCropper(false);
        setTempImage(null);
    };

    const handleRemoveImage = () => {
        setPreviewUrl(null);
        setSelectedFile(null);
        setCroppedFor(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const onSubmit = async (data: FormData) => {
        if (!previewUrl && !selectedFile) {
            toast.error("Please select an image.");
            return;
        }

        setIsSubmitting(true);

        try {
            if (initialData) {
                // UPDATE existing banner
                // If new file selected, upload it first
                if (selectedFile && !previewUrl?.startsWith('http')) {
                    const formData = new FormData();
                    formData.append('file', selectedFile);
                    formData.append('link_url', data.link_url);
                    formData.append('is_active', String(data.is_active));
                    formData.append('device_type', deviceType);

                    const res = await fetch(`/api/admin/banners/${initialData.id}`, {
                        method: 'PUT',
                        body: formData,
                    });

                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Failed to update banner');
                    }
                } else {
                    // Just update metadata
                    const res = await fetch(`/api/admin/banners/${initialData.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            link_url: data.link_url,
                            is_active: data.is_active,
                            device_type: deviceType,
                        }),
                    });

                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Failed to update banner');
                    }
                }

                toast.success("Banner updated successfully");
            } else {
                // CREATE new banner
                if (!selectedFile) {
                    toast.error("Please select an image.");
                    return;
                }

                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('link_url', data.link_url);
                formData.append('is_active', String(data.is_active));
                formData.append('display_order', '0');
                formData.append('device_type', deviceType);

                const res = await fetch('/api/admin/banners', {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to create banner');
                }

                toast.success("Banner created successfully");
            }

            onClose();
        } catch (error: any) {
            console.error('Banner save error:', error);
            toast.error(error.message || 'Failed to save banner');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {showCropper && tempImage && (
                <ImageCropperModal
                    imageSrc={tempImage}
                    onClose={() => setShowCropper(false)}
                    onSave={handleCroppedImage}
                    aspect={aspect}
                />
            )}

            <div className="bg-white border border-stone-100 rounded-xl p-8 shadow-xl max-w-2xl mx-auto relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-200 to-stone-200" />

                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                    disabled={isSubmitting}
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-8">
                    <h2 className="text-2xl font-serif font-medium text-stone-900 mb-2">
                        {initialData ? "Edit Banner" : `Add ${BANNER_DEVICE_LABEL[deviceType]} Banner`}
                    </h2>
                    <p className="text-stone-500 text-sm">
                        Upload an image and set details for your homepage hero carousel.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Device targeting */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-stone-700">Show On</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {DEVICE_OPTIONS.map(({ value, icon: Icon, hint }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setDeviceType(value)}
                                    disabled={isSubmitting}
                                    className={`text-left p-3 rounded-lg border transition-colors ${deviceType === value
                                        ? "border-[#C5A265] bg-[#C5A265]/10 ring-1 ring-[#C5A265]"
                                        : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                                        }`}
                                >
                                    <span className="flex items-center gap-2 text-sm font-medium text-stone-900">
                                        <Icon className="w-4 h-4" />
                                        {BANNER_DEVICE_LABEL[value]}
                                    </span>
                                    <span className="block text-xs text-stone-500 mt-1">{hint}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-stone-700">
                            Banner Image {isMobileBanner ? "(9:16 portrait)" : "(21:9 landscape)"}
                        </label>

                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {previewUrl ? (
                            <div className={previewBoxClass}>
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button
                                        type="button"
                                        onClick={triggerFileInput}
                                        variant="secondary"
                                        className="bg-white/90 hover:bg-white text-stone-900"
                                        disabled={isSubmitting}
                                    >
                                        Change
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        variant="destructive"
                                        size="icon"
                                        className="bg-red-500 hover:bg-red-600"
                                        disabled={isSubmitting}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div onClick={triggerFileInput} className={emptyBoxClass}>
                                <div className="p-4 rounded-full bg-stone-100">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <div className="text-center px-4">
                                    <p className="text-sm font-medium text-stone-700">Click to upload image</p>
                                    <p className="text-xs text-stone-400">PNG, JPG or GIF (max. 20MB)</p>
                                </div>
                            </div>
                        )}

                        {ratioMismatch && (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                                This image was cropped for a different shape. Re-upload it so it fits the{" "}
                                {isMobileBanner ? "9:16 mobile" : "21:9 desktop"} frame.
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-stone-700">Redirect Link</label>
                        <Input
                            {...register("link_url")}
                            placeholder="Enter redirect link (e.g., /shop?category=new)"
                            className="border-stone-200"
                        />
                    </div>

                    <div className="bg-stone-50 p-4 rounded-lg flex items-center justify-between border border-stone-100">
                        <div className="space-y-0.5">
                            <label htmlFor="is_active" className="text-sm font-medium text-stone-900 block cursor-pointer">
                                Active Status
                            </label>
                            <p className="text-xs text-stone-500">Visible on the homepage carousel</p>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                id="is_active"
                                {...register("is_active")}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-stone-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-stone-100">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="text-stone-500"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-[#C5A265] hover:bg-[#B08D55] text-white shadow-md"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                initialData ? "Save Changes" : "Create Banner"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
