"use client";

import classNames from "classnames";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/lib/hooks/use-mobile";

export const BackgroundGradientAnimation = ({
    firstColor = "128, 24, 72",
    secondColor = "176, 84, 128",
    thirdColor = "212, 140, 168",
    fourthColor = "180, 120, 150",
    fifthColor = "150, 60, 100",
    pointerColor = "176, 84, 128",
    size = "80%",
    blendingValue = "hard-light",
    children,
    className,
    interactive = true,
    containerClassName,
}: {
    gradientBackgroundStart?: string;
    gradientBackgroundEnd?: string;
    firstColor?: string;
    secondColor?: string;
    thirdColor?: string;
    fourthColor?: string;
    fifthColor?: string;
    pointerColor?: string;
    size?: string;
    blendingValue?: string;
    children?: React.ReactNode;
    className?: string;
    interactive?: boolean;
    containerClassName?: string;
}) => {
    const interactiveRef = useRef<HTMLDivElement>(null);

    const curXRef = useRef(0);
    const curYRef = useRef(0);
    const tgXRef = useRef(0);
    const tgYRef = useRef(0);
    const animationFrameRef = useRef<number | null>(null);

    const [isSafari, setIsSafari] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Using simple logic instead of next-themes for now to avoid provider issues if not wrapped
    // Defaulting to light theme colors for this boutique
    const theme = "light";

    useEffect(() => {
        setMounted(true); // Hydration mismatch fix
    }, []);

    const gradientBackgroundStart = "rgb(250, 248, 245)"; // Soft Champagne/Ivory
    const gradientBackgroundEnd = "rgb(250, 248, 245)";   // Soft Champagne/Ivory

    useEffect(() => {
        document.body.style.setProperty(
            "--gradient-background-start",
            gradientBackgroundStart
        );
        document.body.style.setProperty(
            "--gradient-background-end",
            gradientBackgroundEnd
        );
        document.body.style.setProperty("--first-color", firstColor);
        document.body.style.setProperty("--second-color", secondColor);
        document.body.style.setProperty("--third-color", thirdColor);
        document.body.style.setProperty("--fourth-color", fourthColor);
        document.body.style.setProperty("--fifth-color", fifthColor);
        document.body.style.setProperty("--pointer-color", pointerColor);
        document.body.style.setProperty("--size", size);
        document.body.style.setProperty("--blending-value", blendingValue);
    }, [
        gradientBackgroundStart,
        gradientBackgroundEnd,
        firstColor,
        secondColor,
        thirdColor,
        fourthColor,
        fifthColor,
        pointerColor,
        size,
        blendingValue,
    ]);

    useEffect(() => {
        setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
    }, []);

    // Use our hook to detect mobile
    const isMobile = useIsMobile();
    const [mountInteractive, setMountInteractive] = useState(false);

    useEffect(() => {
        // Only enable interactive mode on desktop to save resources
        if (!isMobile && interactive) {
            setMountInteractive(true);
        } else {
            setMountInteractive(false);
        }
    }, [isMobile, interactive]);


    useEffect(() => {
        if (!mountInteractive) return;

        function animateMovement() {
            if (!interactiveRef.current) {
                animationFrameRef.current = requestAnimationFrame(animateMovement);
                return;
            }

            curXRef.current =
                curXRef.current + (tgXRef.current - curXRef.current) / 20;
            curYRef.current =
                curYRef.current + (tgYRef.current - curYRef.current) / 20;

            if (interactiveRef.current) {
                interactiveRef.current.style.transform = `translate(${Math.round(
                    curXRef.current
                )}px, ${Math.round(curYRef.current)}px)`;
            }

            animationFrameRef.current = requestAnimationFrame(animateMovement);
        }

        animateMovement();

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [mountInteractive]);

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!interactiveRef.current) return;

        const rect = interactiveRef.current.getBoundingClientRect();
        tgXRef.current = event.clientX - rect.left;
        tgYRef.current = event.clientY - rect.top;
    };

    if (!mounted) return null;

    return (
        <div
            className={classNames(
                "h-screen w-screen relative overflow-hidden top-0 left-0 bg-[linear-gradient(40deg,var(--gradient-background-start),var(--gradient-background-end))]",
                containerClassName,
                "paint-contain" // Add paint containment
            )}
        >
            <svg className="hidden">
                <defs>
                    <filter id="blurMe">
                        <feGaussianBlur
                            in="SourceGraphic"
                            stdDeviation="10"
                            result="blur"
                        />
                        <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
                            result="goo"
                        />
                        <feBlend in="SourceGraphic" in2="goo" />
                    </filter>
                </defs>
            </svg>
            <div className={classNames(className, "relative z-10")}>{children}</div>
            <div
                className={classNames(
                    "gradients-container h-full w-full blur-lg absolute inset-0 z-0 mobile-gpu", // Add GPU promotion
                    isSafari ? "blur-2xl" : "[filter:url(#blurMe)_blur(40px)]"
                )}
            >
                <div
                    className={classNames(
                        `absolute [background:radial-gradient(circle_at_center,_rgba(var(--first-color),_0.8)_0,_rgba(var(--first-color),_0)_50%)_no-repeat]`,
                        `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
                        `[transform-origin:center_center]`,
                        `animate-first`,
                        `opacity-100`
                    )}
                ></div>
                <div
                    className={classNames(
                        `absolute [background:radial-gradient(circle_at_center,_rgba(var(--second-color),_0.8)_0,_rgba(var(--second-color),_0)_50%)_no-repeat]`,
                        `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
                        `[transform-origin:calc(50%-400px)]`,
                        `animate-second`,
                        `opacity-100`
                    )}
                ></div>
                <div
                    className={classNames(
                        `absolute [background:radial-gradient(circle_at_center,_rgba(var(--third-color),_0.8)_0,_rgba(var(--third-color),_0)_50%)_no-repeat]`,
                        `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
                        `[transform-origin:calc(50%+400px)]`,
                        `animate-third`,
                        `opacity-100`
                    )}
                ></div>
                <div
                    className={classNames(
                        `absolute [background:radial-gradient(circle_at_center,_rgba(var(--fourth-color),_0.8)_0,_rgba(var(--fourth-color),_0)_50%)_no-repeat]`,
                        `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
                        `[transform-origin:calc(50%-200px)]`,
                        `animate-fourth`,
                        `opacity-70`
                    )}
                ></div>
                <div
                    className={classNames(
                        `absolute [background:radial-gradient(circle_at_center,_rgba(var(--fifth-color),_0.8)_0,_rgba(var(--fifth-color),_0)_50%)_no-repeat]`,
                        `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
                        `[transform-origin:calc(50%-800px)_calc(50%+800px)]`,
                        `animate-fifth`,
                        `opacity-100`
                    )}
                ></div>

                {mountInteractive && (
                    <div
                        ref={interactiveRef}
                        onMouseMove={handleMouseMove}
                        className={classNames(
                            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--pointer-color),_0.8)_0,_rgba(var(--pointer-color),_0)_50%)_no-repeat]`,
                            `[mix-blend-mode:var(--blending-value)] w-full h-full -top-1/2 -left-1/2`,
                            `opacity-70`
                        )}
                    ></div>
                )}
            </div>
        </div>
    );
};
