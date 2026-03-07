"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { MISSING_PLAYER_HEADSHOT_KEYS, PLAYER_HEADSHOT_ALIASES } from "@/lib/player-headshot-map";

interface PlayerHeadProps {
    playerName: string;
    playerHead?: string;
    className?: string;
    size?: "sm" | "md" | "lg" | "xl" | number;
}

type SourceMode = "full" | "error";

function PlayerHeadImage({
    playerName,
    dimension,
    fullSrc,
    priority,
    initialMode,
    canZoom,
}: {
    playerName: string;
    dimension: number;
    fullSrc: string;
    priority: boolean;
    initialMode: SourceMode;
    canZoom: boolean;
}) {
    const [sourceMode, setSourceMode] = useState<SourceMode>(initialMode);
    const showFallback = sourceMode === "error";

    return (
        <>
            <div className={cn(
                "absolute inset-0 flex items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-950 transition-opacity duration-500",
                showFallback ? "opacity-100" : "opacity-0"
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

            {sourceMode === "full" && (
                <Image
                    src={fullSrc}
                    alt={playerName}
                    width={dimension}
                    height={dimension}
                    sizes={`${dimension}px`}
                    className={cn(
                        "h-full w-full object-cover object-top",
                        canZoom ? "transition-all duration-500" : "transition-opacity duration-200",
                        showFallback ? "opacity-0" : "opacity-100 scale-100",
                        canZoom && "group-hover:scale-110"
                    )}
                    onError={() => setSourceMode("error")}
                    priority={priority}
                    loading={priority ? "eager" : "lazy"}
                />
            )}
        </>
    );
}

export default function PlayerHead({ playerName, playerHead, className, size = "md" }: PlayerHeadProps) {
    const isProd = process.env.NODE_ENV === "production";
    const basePath = isProd ? "/cbtleague" : "";

    const sizeMap = {
        sm: 32,
        md: 48,
        lg: 128,
        xl: 192
    };

    const dimension = typeof size === "number" ? size : sizeMap[size];

    const { fullSrc, initialMode } = useMemo(() => {
        const rawValue = (playerHead || playerName).trim().toLowerCase();
        const normalized = rawValue
            .replace(/\s+/g, "")
            .replace(/['’`]/g, "")
            .replace(/[^a-z0-9._-]/g, "");

        const dot = normalized.lastIndexOf(".");
        const noExt = dot > 0 ? normalized.slice(0, dot) : normalized;
        const resolvedBaseName = PLAYER_HEADSHOT_ALIASES[noExt] ?? noExt;
        const fullFileName = `${resolvedBaseName}.jpg`;

        if (MISSING_PLAYER_HEADSHOT_KEYS.has(resolvedBaseName)) {
            return {
                fullSrc: `${basePath}/images/player-heads/${fullFileName}`,
                initialMode: "error" as const,
            };
        }

        return {
            fullSrc: `${basePath}/images/player-heads/${fullFileName}`,
            initialMode: "full" as const,
        };
    }, [basePath, playerHead, playerName]);

    const imageKey = `${fullSrc}`;
    return (
        <div
            className={cn(
                "relative overflow-hidden bg-zinc-900/50 ring-1 ring-white/10 flex items-center justify-center group",
                className
            )}
            style={{ width: dimension, height: dimension }}
        >
            <PlayerHeadImage
                key={imageKey}
                playerName={playerName}
                dimension={dimension}
                fullSrc={fullSrc}
                priority={size === "xl" || size === "lg"}
                initialMode={initialMode}
                canZoom={dimension >= 64}
            />
        </div>
    );
}
