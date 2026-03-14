"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
    getSeasonAwarePlayerProfileBackdropOverride,
    MISSING_PLAYER_HEADSHOT_KEYS,
    PLAYER_HEADSHOT_ALIASES,
    normalizePlayerHeadshotKey,
} from "@/lib/player-headshot-map";

interface PlayerHeadProps {
    playerName: string;
    playerHead?: string;
    seasonId?: string | null;
    className?: string;
    size?: "sm" | "md" | "lg" | "xl" | number;
    presentation?: "default" | "backdrop";
}

function stripFileExtension(value: string): string {
    return value.replace(/\.[a-z0-9]+$/i, "");
}

function hasFileExtension(value: string): boolean {
    return /\.[a-z0-9]+$/i.test(value);
}

function sanitizeCandidate(value: string): string {
    return value
        .trim()
        .replace(/^.*[\\/]/, "")
        .replace(/[?#].*$/, "");
}

function isKnownMissingHeadshot(fileName: string): boolean {
    const key = stripFileExtension(fileName).toLowerCase();
    return MISSING_PLAYER_HEADSHOT_KEYS.has(key);
}

function buildHeadshotCandidates(playerName: string, playerHead?: string): string[] {
    const candidates: string[] = [];
    const seen = new Set<string>();

    const pushCandidate = (rawValue: string) => {
        const cleaned = sanitizeCandidate(rawValue);
        if (!cleaned) return;
        if (isKnownMissingHeadshot(cleaned)) return;

        const lowered = cleaned.toLowerCase();
        const baseKey = stripFileExtension(lowered);
        const aliasBase = PLAYER_HEADSHOT_ALIASES[baseKey] ?? baseKey;

        // Prefer canonical ".jpg" keys to avoid extensionless 404s and case-mismatch churn.
        const canonicalJpg = `${baseKey}.jpg`;
        const aliasJpg = `${aliasBase}.jpg`;
        const variants = hasFileExtension(lowered)
            ? [aliasJpg, lowered]
            : [aliasJpg, canonicalJpg];

        for (const variant of variants) {
            if (!seen.has(variant)) {
                seen.add(variant);
                candidates.push(variant);
            }
        }
    };

    if (playerHead) {
        pushCandidate(playerHead);
    }

    const normalizedFromName = normalizePlayerHeadshotKey(playerName);
    if (normalizedFromName) {
        pushCandidate(normalizedFromName);
    }

    return candidates;
}

function PlayerHeadImage({
    playerName,
    dimension,
    sources,
    priority,
    canZoom,
    presentation,
    backdropStyle,
}: {
    playerName: string;
    dimension: number;
    sources: string[];
    priority: boolean;
    canZoom: boolean;
    presentation: "default" | "backdrop";
    backdropStyle: {
        objectPosition: string;
        scale: number;
        brightness: number;
        saturation: number;
    };
}) {
    const [sourceIndex, setSourceIndex] = useState(0);
    const [hasError, setHasError] = useState(sources.length === 0);
    const activeSrc = hasError ? null : sources[sourceIndex] ?? null;

    const handleImageError = () => {
        const nextIndex = sourceIndex + 1;
        if (nextIndex < sources.length) {
            setSourceIndex(nextIndex);
            return;
        }
        setHasError(true);
    };

    const showPlaceholder = hasError;

    return (
        <>
            <div className={cn(
                "absolute inset-0 flex items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-950 transition-opacity duration-500",
                showPlaceholder ? "opacity-100" : "opacity-0"
            )}>
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-2/3 w-2/3 text-zinc-500/70"
                >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            </div>

            {activeSrc && (
                // Static export + dynamic fallback sources are more reliable here with native img.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={activeSrc}
                    alt={playerName}
                    width={dimension}
                    height={dimension}
                    className={cn(
                        "h-full w-full transition-all duration-500",
                        presentation === "backdrop"
                            ? "object-cover"
                            : "object-cover object-top opacity-100 scale-100",
                        canZoom && presentation === "default" ? "group-hover:scale-110" : "transition-opacity duration-200"
                    )}
                    style={
                        presentation === "backdrop"
                            ? {
                                objectPosition: backdropStyle.objectPosition,
                                transformOrigin: backdropStyle.objectPosition,
                                filter: `saturate(${backdropStyle.saturation}) brightness(${backdropStyle.brightness})`,
                            }
                            : {
                                objectPosition: backdropStyle.objectPosition,
                            }
                    }
                    onError={handleImageError}
                    loading={priority ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={priority ? "high" : "auto"}
                    draggable={false}
                />
            )}
        </>
    );
}

export default function PlayerHead({
    playerName,
    playerHead,
    seasonId,
    className,
    size = "md",
    presentation = "default",
}: PlayerHeadProps) {
    const isProd = process.env.NODE_ENV === "production";
    const basePath = isProd ? "/cbtleague" : "";

    const sizeMap = {
        sm: 32,
        md: 48,
        lg: 128,
        xl: 192
    };

    const dimension = typeof size === "number" ? size : sizeMap[size];
    const backdropOverride = getSeasonAwarePlayerProfileBackdropOverride(playerName, seasonId);
    const backdropStyle = backdropOverride
        ? {
            objectPosition: backdropOverride.objectPosition,
            scale: backdropOverride.scale,
            brightness: backdropOverride.brightness ?? 0.86,
            saturation: backdropOverride.saturation ?? 0.9,
        }
        : null;

    const sources = useMemo(() => {
        const fileCandidates = buildHeadshotCandidates(playerName, playerHead);
        const sourceList: string[] = [];
        const seen = new Set<string>();

        const addSource = (url: string) => {
            if (!seen.has(url)) {
                seen.add(url);
                sourceList.push(url);
            }
        };

        for (const fileName of fileCandidates) {
            addSource(`${basePath}/images/player-heads/${fileName}`);
        }

        return sourceList;
    }, [basePath, playerHead, playerName]);

    const imageKey = `${sources.join("|")}|${dimension}`;
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
                sources={sources}
                priority={size === "xl" || size === "lg"}
                canZoom={dimension >= 64}
                presentation={presentation}
                backdropStyle={backdropStyle ?? {
                    objectPosition: "center 10%",
                    scale: 1.08,
                    brightness: 0.9,
                    saturation: 0.92,
                }}
            />
        </div>
    );
}
