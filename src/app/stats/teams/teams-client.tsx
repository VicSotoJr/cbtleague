"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import SeasonToggle from "@/components/league/season-toggle";
import { getSeasonId, getSeasonLabel, getSeasonTeamsWithAggregates, SEASON_OPTIONS } from "@/lib/league-summary";

export default function TeamStatsClient() {
    const searchParams = useSearchParams();
    const seasonId = getSeasonId(searchParams.get("season"));
    const teams = React.useMemo(() => getSeasonTeamsWithAggregates(seasonId), [seasonId]);
    const seasonLabel = getSeasonLabel(seasonId);

    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                        Team <span className="text-orange-500">Stats</span>
                    </h1>
                    <p className="mt-2 text-zinc-400">
                        Comprehensive offensive and defensive breakdown for all teams.
                    </p>
                </div>

                <SeasonToggle
                    seasonId={seasonId}
                    options={SEASON_OPTIONS}
                    hrefForSeason={(id) => `/stats/teams/?season=${id}`}
                />
            </div>

            <div className="mb-8 flex items-center justify-between rounded-xl bg-orange-600/10 p-4 border border-orange-500/20">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-orange-400 uppercase tracking-tighter">Current View:</span>
                    <span className="text-lg font-bold text-white">{seasonLabel}</span>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50 backdrop-blur-sm shadow-2xl">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-white/5">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="sticky left-0 bg-zinc-900 z-10 min-w-[150px] font-bold text-white">Team</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500">GP</TableHead>
                                <TableHead className="text-center font-bold text-orange-500">PTS</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500">FG%</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500">3PM</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500">3P%</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500">REB</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500">AST</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500">STL</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500">BLK</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500">TOV</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teams.map((team) => {
                                const fgPercent = team.aggregated["FG%"].toFixed(1);
                                const threePercent = team.aggregated["3P%"].toFixed(1);

                                return (
                                    <TableRow key={team.Team} className="border-white/5 hover:bg-white/5 transition-colors group">
                                        <TableCell className="sticky left-0 bg-zinc-900/90 backdrop-blur-md z-10 font-bold text-white group-hover:text-orange-500">
                                            <Link href={`/teams/${encodeURIComponent(team.Team.trim())}/?season=${seasonId}`} prefetch={false}>
                                                {team.Team}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{team.gamesPlayed}</TableCell>
                                        <TableCell className="text-center font-black text-orange-500">{team.aggregated.Points}</TableCell>
                                        <TableCell className="text-center font-mono font-bold text-zinc-300">{fgPercent}%</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{team.aggregated.ThreesMade}</TableCell>
                                        <TableCell className="text-center font-mono font-bold text-zinc-300">{threePercent}%</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{team.aggregated.Rebounds}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{team.aggregated.Assists}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{team.aggregated.Steals}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{team.aggregated.Blocks}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{team.aggregated.Turnovers}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
