"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, GripVertical, Loader2 } from "lucide-react";
import { FaStar } from "react-icons/fa";
import { ImageCropperModal } from "@/components/admin/ImageCropperModal";
import { toast } from "sonner";

interface Review {
    id: string;
    user_id: string;
    rating: number;
    comment: string;
    reviewer_name: string;
    reviewer_image?: string;
    verified: boolean;
    created_at: string;
}

export default function ReviewsAdminPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [rating, setRating] = useState(5);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState("");

    // Image Cropper State
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);

    // Fetch reviews from API
    const fetchReviews = async () => {
        try {
            const res = await fetch('/api/admin/reviews');
            if (res.ok) {
                const data = await res.json();
                setReviews(data.reviews || []);
            }
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
            toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile) {
            toast.error("Please select a reviewer image");
            return;
        }

        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('file', imageFile);
            formData.append('reviewer_name', name);
            formData.append('comment', description);
            formData.append('rating', String(rating));

            const res = await fetch('/api/admin/reviews', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create review');
            }

            toast.success('Review created successfully');
            setName("");
            setDescription("");
            setRating(5);
            setImageFile(null);
            setImagePreview("");
            setIsAdding(false);
            fetchReviews();
        } catch (error: any) {
            console.error('Failed to add review:', error);
            toast.error(error.message || 'Failed to add review');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this review?')) return;

        try {
            const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            toast.success('Review deleted');
            fetchReviews();
        } catch (error) {
            console.error('Failed to delete review:', error);
            toast.error('Failed to delete review');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempImage(reader.result as string);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = "";
    };

    const handleCropSave = async (croppedImage: string) => {
        // Convert base64 to file
        const response = await fetch(croppedImage);
        const blob = await response.blob();
        const file = new File([blob], `review_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setImageFile(file);
        setImagePreview(croppedImage);
        setShowCropper(false);
        setTempImage(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
            {showCropper && tempImage && (
                <ImageCropperModal
                    imageSrc={tempImage}
                    onClose={() => {
                        setShowCropper(false);
                        setTempImage(null);
                    }}
                    onSave={handleCropSave}
                />
            )}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-gray-900">Manage Reviews</h1>
                    <p className="text-muted-foreground mt-1">Add or remove customer testimonials stored in Supabase.</p>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    {isAdding ? "Cancel" : "Add Review"}
                </Button>
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-lg border shadow-sm animate-in fade-in slide-in-from-top-4">
                    <h2 className="text-lg font-semibold mb-4">New Testimonial</h2>
                    <form onSubmit={handleAdd} className="space-y-6">
                        {/* Reviewer Image */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Reviewer Image <span className="text-red-500">*</span></label>
                            <div className="flex items-center gap-4">
                                {imagePreview && (
                                    <div className="relative w-20 h-20 rounded-full overflow-hidden border border-border shrink-0">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Customer Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Customer Name <span className="text-red-500">*</span></label>
                            <input
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Enter customer name"
                            />
                        </div>

                        {/* Comment */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Review Comment</label>
                            <textarea
                                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Enter customer's review"
                            />
                        </div>

                        {/* Rating */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Rating <span className="text-red-500">*</span></label>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className="focus:outline-none transition-transform hover:scale-110"
                                    >
                                        <FaStar
                                            size={28}
                                            className={star <= rating ? "text-[#801848]" : "text-gray-300"}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <Button type="submit" disabled={submitting}>
                                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Review'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {reviews.map((review) => (
                    <div key={review.id} className="flex items-center gap-4 bg-white p-4 rounded-lg border group hover:border-primary/50 transition-colors">
                        <GripVertical className="text-muted-foreground cursor-grab opacity-50" />

                        {review.reviewer_image ? (
                            <img src={review.reviewer_image} alt={review.reviewer_name} className="w-12 h-12 rounded-full object-cover bg-gray-100" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center text-stone-400 font-bold text-xs uppercase">
                                {review.reviewer_name?.charAt(0) || '?'}
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium truncate">{review.reviewer_name}</h3>
                                <div className="flex text-[#801848] text-xs">
                                    {[...Array(review.rating)].map((_, i) => (
                                        <FaStar key={i} size={10} />
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {review.verified && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium border border-green-200">Verified Buyer</span>
                                )}
                            </div>
                            {review.comment && (
                                <p className="text-sm text-gray-500 line-clamp-1 mt-1">{review.comment}</p>
                            )}
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(review.id)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}

                {reviews.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                        No reviews yet. Add one to get started!
                    </div>
                )}
            </div>
        </div>
    );
}
