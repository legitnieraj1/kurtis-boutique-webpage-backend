"use client";

import React, { useEffect, useRef, useState } from 'react';
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
    className?: string; // Additional classes
    fullscreen?: boolean; // Whether to take up full screen (fixed) or container (absolute/relative)
    text?: string;       // Optional text below loader
    startTime?: number;  // Start time in seconds
    endTime?: number;    // End time in seconds
}

export function LoadingScreen({ className, fullscreen = true, text, startTime = 0, endTime }: LoadingScreenProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        if (startTime > 0) {
            video.currentTime = startTime;
        }

        let animationFrameId: number;

        const processFrame = () => {
            if (!video || !canvas || !ctx) return;
            if (video.paused || video.ended) {
                animationFrameId = requestAnimationFrame(processFrame);
                return;
            }

            // Handle custom looping
            if (endTime && video.currentTime >= endTime) {
                video.currentTime = startTime;
            }

            // Resize canvas to match window/container (for crisp rendering)
            const containerRect = canvas.parentElement?.getBoundingClientRect();
            if (containerRect) {
                if (canvas.width !== containerRect.width || canvas.height !== containerRect.height) {
                    canvas.width = containerRect.width;
                    canvas.height = containerRect.height;
                }
            }

            const vw = video.videoWidth;
            const vh = video.videoHeight;
            const cw = canvas.width;
            const ch = canvas.height;

            if (vw > 0 && vh > 0 && cw > 0 && ch > 0) {
                // Calculate 'contain' dimensions
                const videoRatio = vw / vh;
                const canvasRatio = cw / ch;

                let drawW, drawH;

                if (canvasRatio > videoRatio) {
                    drawH = ch;
                    drawW = ch * videoRatio;
                } else {
                    drawW = cw;
                    drawH = cw / videoRatio;
                }

                const drawX = (cw - drawW) / 2;
                const drawY = (ch - drawH) / 2;

                // Draw video frame to canvas
                ctx.drawImage(video, drawX, drawY, drawW, drawH);

                // Get pixel data
                const frame = ctx.getImageData(0, 0, cw, ch);
                const l = frame.data.length;

                // Loop through pixels to remove black background
                for (let i = 0; i < l; i += 4) {
                    const r = frame.data[i];
                    const g = frame.data[i + 1];
                    const b = frame.data[i + 2];

                    // Threshold for "Black" pixels
                    if (r < 50 && g < 50 && b < 50) {
                        frame.data[i + 3] = 0; // Alpha = 0 (Transparent)
                    }
                }

                // Put modified data back
                ctx.putImageData(frame, 0, 0);
            }

            animationFrameId = requestAnimationFrame(processFrame);
        };

        const handlePlay = () => {
            processFrame();
        };

        video.addEventListener('play', handlePlay);

        // Initial kick if already playing
        if (!video.paused) {
            processFrame();
        }

        // Force play
        video.play().catch(() => { });

        return () => {
            video.removeEventListener('play', handlePlay);
            cancelAnimationFrame(animationFrameId);
        };
    }, [mounted, startTime, endTime]);

    if (!mounted) return null;

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center bg-white z-[9999]",
                fullscreen ? "fixed inset-0" : "absolute inset-0 w-full h-full",
                className
            )}
        >
            <div className="relative w-full h-full flex items-center justify-center">
                {/* Hidden Source Video */}
                <video
                    ref={videoRef}
                    loop
                    muted
                    playsInline
                    crossOrigin="anonymous"
                    className="hidden"
                    src="/Logo_Hanger_Animation_For_Loading.mp4"
                />

                {/* Rendering Canvas */}
                <canvas
                    ref={canvasRef}
                    className="block w-full h-full object-contain"
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
            {text && (
                <div className="absolute bottom-10 left-0 right-0 text-center">
                    <p className="text-sm font-medium text-muted-foreground animate-pulse">{text}</p>
                </div>
            )}
        </div>
    );
}
