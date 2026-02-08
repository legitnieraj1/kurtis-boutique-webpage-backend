"use client";

import React, { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
// Slider not available, using native input
import { RotateCw, RotateCcw, X, Check, Minus, Plus } from "lucide-react";
import getCroppedImg from "@/lib/canvasUtils";

interface ImageCropperModalProps {
    imageSrc: string;
    onClose: () => void;
    onSave: (croppedImage: string) => void;
    aspect?: number; // Optional aspect ratio
}

export function ImageCropperModal({ imageSrc, onClose, onSave, aspect = 1 }: ImageCropperModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            if (!croppedAreaPixels) return;
            const croppedImage = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                rotation
            );
            onSave(croppedImage);
            onClose();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col h-[500px] md:h-[600px] animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                    <h2 className="font-semibold text-lg text-gray-800">Edit Photo</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Cropper Area */}
                <div className="relative flex-1 bg-gray-900 border-b border-gray-200">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        rotation={rotation}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={setCrop}
                        onRotationChange={setRotation}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        classes={{
                            containerClassName: "h-full w-full",
                        }}
                    />
                </div>

                {/* Controls */}
                <div className="p-4 bg-white space-y-4">
                    {/* Zoom Control */}
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-600 min-w-16">Zoom</span>
                        <Minus className="w-4 h-4 text-gray-400" />
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#801848]"
                        />
                        <Plus className="w-4 h-4 text-gray-400" />
                    </div>

                    {/* Rotate Control */}
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-600 min-w-16">Rotate</span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRotation(rotation - 90)}
                                className="h-9 px-3 gap-1 hover:bg-gray-50 hover:text-[#801848]"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span className="sr-only">Rotate Left</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRotation(rotation + 90)}
                                className="h-9 px-3 gap-1 hover:bg-gray-50 hover:text-[#801848]"
                            >
                                <RotateCw className="w-4 h-4" />
                                <span className="sr-only">Rotate Right</span>
                            </Button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="bg-[#801848] hover:bg-[#6b143c] text-white gap-2"
                        >
                            <Check className="w-4 h-4" />
                            Apply Changes
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
