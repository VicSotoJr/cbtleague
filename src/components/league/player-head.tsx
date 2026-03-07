"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface PlayerHeadProps {
    playerName: string;
    playerHead?: string;
    className?: string;
    size?: "sm" | "md" | "lg" | "xl" | number;
}

export default function PlayerHead({ playerName, playerHead, className, size = "md" }: PlayerHeadProps) {
    const [error, setError] = useState(false);

    // Robust filename handling
    let filename = (playerHead || playerName).trim().toLowerCase().replace(/\s+/g, "");

    // Ensure .jpg extension if no extension is present
    if (!filename.includes(".")) {
        filename += ".jpg";
    }

    const isProd = process.env.NODE_ENV === 'production';
    const basePath = isProd ? '/cbtleague' : '';
    const src = `${basePath}/images/player-heads/${filename}`;
    const fallbackSrc = `${basePath}/images/cbt-logo1.jpg`;

    const sizeMap = {
        sm: 32,
        md: 48,
        lg: 128,
        xl: 192
    };

    const dimension = typeof size === "number" ? size : sizeMap[size];

    return (
        <div
            className={cn(
                "relative overflow-hidden bg-zinc-900/50 ring-1 ring-white/10 flex items-center justify-center group",
                className
            )}
            style={{ width: dimension, height: dimension }}
        >
            {/* Professional Silhouette Fallback */}
            <div className={cn(
                "absolute inset-0 flex items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-950 transition-opacity duration-500",
                error ? "opacity-100" : "opacity-0"
            )}>
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-2/3 w-2/3 text-zinc-700/50"
                >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            </div>

            <img
                src={src}
                alt={playerName}
                className={cn(
                    "h-full w-full transition-all duration-500 object-cover object-top",
                    error ? "opacity-0 scale-95" : "opacity-100 scale-100 group-hover:scale-110"
                )}
                onError={() => {
                    if (!error) {
                        console.warn(`[CBT League] Missing headshot: ${src}`);
                        setError(true);
                    }
                }}
                loading={size === "xl" || size === "lg" ? "eager" : "lazy"}
            />
        </div>
    );
}
