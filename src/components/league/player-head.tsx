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

    const src = `/cbtleague/images/player-heads/${filename}`;
    const fallbackSrc = "/cbtleague/images/cbt-logo1.jpg";

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
                "relative overflow-hidden bg-zinc-900 ring-2 ring-white/5 flex items-center justify-center",
                className
            )}
            style={{ width: dimension, height: dimension }}
        >
            <img
                src={error ? fallbackSrc : src}
                alt={playerName}
                className={cn(
                    "h-full w-full transition-opacity duration-300",
                    error ? "object-contain p-2 opacity-50" : "object-cover object-top opacity-100"
                )}
                onError={() => setError(true)}
                loading={size === "xl" || size === "lg" ? "eager" : "lazy"}
            />
        </div>
    );
}
