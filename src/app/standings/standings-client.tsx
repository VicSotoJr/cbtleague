"use client";

import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import StandingsTable from "@/components/league/standings-table";
import SeasonToggle from "@/components/league/season-toggle";
import { getSeasonId, getSeasonLabel, getSeasonTeams, SEASON_OPTIONS } from "@/lib/league-summary";
import { buildCurrentReturnTo } from "@/lib/player-links";

export default function StandingsClient() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const seasonId = getSeasonId(searchParams.get("season"));
    const teams = React.useMemo(() => getSeasonTeams(seasonId), [seasonId]);
    const seasonLabel = getSeasonLabel(seasonId);
    const returnTo = React.useMemo(() => buildCurrentReturnTo(pathname, searchParams), [pathname, searchParams]);


    return (
        <div className="container mx-auto overflow-x-hidden px-4 py-12 md:px-6">
            <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div className="min-w-0">
                    <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
                        League <span className="text-copper-500">Standings</span>
                    </h1>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                        Real-time rankings and historical records for all CBT seasons.
                    </p>
                </div>

                <SeasonToggle
                    seasonId={seasonId}
                    options={SEASON_OPTIONS}
                    hrefForSeason={(id) => `/standings/?season=${id}`}
                />
            </div>

            <div className="mb-8 flex flex-col gap-2 rounded-xl border border-copper-500/20 bg-copper-600/10 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="text-sm font-bold text-copper-400 uppercase tracking-tighter">Current View:</span>
                    <span className="text-lg font-bold text-white">{seasonLabel}</span>
                </div>
            </div>

            <StandingsTable teams={teams} seasonId={seasonId} returnTo={returnTo} />
        </div>
    );
}
