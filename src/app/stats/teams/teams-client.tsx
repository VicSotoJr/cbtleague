"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { Team, BaseStats } from "@/types/league";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { cn } from "@/lib/utils";
import allData from "@/data/data.json";

function getTeamsWithAggregatedStats(seasonId: string): (Team & { aggregated: BaseStats })[] {
    const teams: Team[] = (allData as any).seasons[seasonId]?.teams || [];

    return teams.map(team => {
        const aggregated: BaseStats = {
            Points: 0,
            FieldGoalsMade: 0,
            FieldGoalAttempts: 0,
            ThreesMade: 0,
            ThreesAttempts: 0,
            FreeThrowsMade: 0,
            FreeThrowsAttempts: 0,
            Rebounds: 0,
            Offrebounds: 0,
            Defrebounds: 0,
            Assists: 0,
            Blocks: 0,
            Steals: 0,
            Turnovers: 0,
            PersonalFouls: 0
        };

        team.roster.forEach(player => {
            player.stats.forEach(stat => {
                aggregated.Points += stat.Points || 0;
                aggregated.FieldGoalsMade += stat.FieldGoalsMade || 0;
                aggregated.FieldGoalAttempts += stat.FieldGoalAttempts || 0;
                aggregated.ThreesMade += stat.ThreesMade || 0;
                aggregated.ThreesAttempts += stat.ThreesAttempts || 0;
                aggregated.FreeThrowsMade += stat.FreeThrowsMade || 0;
                aggregated.FreeThrowsAttempts += stat.FreeThrowsAttempts || 0;
                aggregated.Rebounds += stat.Rebounds || 0;
                aggregated.Offrebounds += stat.Offrebounds || 0;
                aggregated.Defrebounds += stat.Defrebounds || 0;
                aggregated.Assists += stat.Assists || 0;
                aggregated.Blocks += stat.Blocks || 0;
                aggregated.Steals += stat.Steals || 0;
                aggregated.Turnovers += stat.Turnovers || 0;
                aggregated.PersonalFouls += stat.PersonalFouls || 0;
            });
        });

        return { ...team, aggregated };
    });
}

export default function TeamStatsClient() {
    const searchParams = useSearchParams();
    const seasonId = searchParams.get("season") || "3";
    const teams = getTeamsWithAggregatedStats(seasonId);

    const seasons = [
        { id: "3", label: "Season 3 - 2026" },
        { id: "2", label: "Season 2 - 2025" },
        { id: "1", label: "Season 1 - 2023" },
    ];

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

                <div className="flex gap-2">
                    {seasons.map(s => (
                        <Link
                            key={s.id}
                            href={`/stats/teams?season=${s.id}`}
                            className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${seasonId === s.id
                                ? "bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                                }`}
                        >
                            {s.id}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="mb-8 flex items-center justify-between rounded-xl bg-orange-600/10 p-4 border border-orange-500/20">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-orange-400 uppercase tracking-tighter">Current View:</span>
                    <span className="text-lg font-bold text-white">{seasons.find(s => s.id === seasonId)?.label}</span>
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
                                const fgPercent = ((team.aggregated.FieldGoalsMade + team.aggregated.ThreesMade) /
                                    (team.aggregated.FieldGoalAttempts + team.aggregated.ThreesAttempts) * 100 || 0).toFixed(1);
                                const threePercent = (team.aggregated.ThreesMade / team.aggregated.ThreesAttempts * 100 || 0).toFixed(1);

                                return (
                                    <TableRow key={team.Team} className="border-white/5 hover:bg-white/5 transition-colors group">
                                        <TableCell className="sticky left-0 bg-zinc-900/90 backdrop-blur-md z-10 font-bold text-white group-hover:text-orange-500">
                                            <Link href={`/teams/${encodeURIComponent(team.Team.trim())}?season=${seasonId}`}>
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
