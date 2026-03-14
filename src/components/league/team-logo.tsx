"use client";

import React, { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface TeamLogoProps {
    teamName: string;
    className?: string;
    size?: number;
}

export default function TeamLogo({ teamName, className, size = 100 }: TeamLogoProps) {
    const [error, setError] = useState(false);
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

    // Format team name for file matching: lowercase, hyphens, trimmed
    const formattedName = teamName.trim().toLowerCase().replace(/\s+/g, "-");

    // Potential paths to check (Legacy used .jpg primarily)
    const src = `${basePath}/images/team-logos/${formattedName}.jpg`;
    const fallbackSrc = `${basePath}/images/cbt-logo1.jpg`;

    return (
        <div
            className={cn(
                "relative overflow-hidden bg-zinc-800 flex items-center justify-center",
                className
            )}
            style={{ width: size, height: size }}
        >
            <Image
                src={error ? fallbackSrc : src}
                alt={`${teamName} Logo`}
                fill
                sizes={`${size}px`}
                className={cn(
                    "h-full w-full object-contain transition-opacity duration-300",
                    error ? "opacity-50 p-4" : "opacity-100 p-2"
                )}
                onError={() => setError(true)}
                priority={size > 150}
            />
        </div>
    );
}
