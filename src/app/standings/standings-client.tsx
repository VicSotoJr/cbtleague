"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import StandingsTable from "@/components/league/standings-table";
import SeasonToggle from "@/components/league/season-toggle";
import { getSeasonId, getSeasonLabel, getSeasonTeams, SEASON_OPTIONS } from "@/lib/league-summary";

export default function StandingsClient() {
    const searchParams = useSearchParams();
    const seasonId = getSeasonId(searchParams.get("season"));
    const teams = React.useMemo(() => getSeasonTeams(seasonId), [seasonId]);
    const seasonLabel = getSeasonLabel(seasonId);


    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                        League <span className="text-orange-500">Standings</span>
                    </h1>
                    <p className="mt-2 text-zinc-400">
                        Real-time rankings and historical records for all CBT seasons.
                    </p>
                </div>

                <SeasonToggle
                    seasonId={seasonId}
                    options={SEASON_OPTIONS}
                    hrefForSeason={(id) => `/standings/?season=${id}`}
                />
            </div>

            <div className="mb-8 flex items-center justify-between rounded-xl bg-orange-600/10 p-4 border border-orange-500/20">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-orange-400 uppercase tracking-tighter">Current View:</span>
                    <span className="text-lg font-bold text-white">{seasonLabel}</span>
                </div>
            </div>

            <StandingsTable teams={teams} seasonId={seasonId} />
        </div>
    );
}
