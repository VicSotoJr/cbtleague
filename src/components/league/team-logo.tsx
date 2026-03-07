"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface TeamLogoProps {
    teamName: string;
    className?: string;
    size?: number;
}

export default function TeamLogo({ teamName, className, size = 100 }: TeamLogoProps) {
    const [error, setError] = useState(false);

    // Format team name for file matching: lowercase, hyphens, trimmed
    const formattedName = teamName.trim().toLowerCase().replace(/\s+/g, "-");

    // Potential paths to check (Legacy used .jpg primarily)
    const src = `/images/team-logos/${formattedName}.jpg`;
    const fallbackSrc = "/images/cbt-logo1.jpg";

    return (
        <div
            className={cn(
                "relative overflow-hidden bg-zinc-800 flex items-center justify-center",
                className
            )}
            style={{ width: size, height: size }}
        >
            <img
                src={error ? fallbackSrc : src}
                alt={`${teamName} Logo`}
                className={cn(
                    "h-full w-full object-contain transition-opacity duration-300",
                    error ? "opacity-50 p-4" : "opacity-100 p-2"
                )}
                onError={() => setError(true)}
                loading={size > 150 ? "eager" : "lazy"}
            />
        </div>
    );
}
