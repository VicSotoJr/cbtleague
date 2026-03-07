"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { Team, Player, BaseStats } from "@/types/league";
import Link from "next/link";
import { cn } from "@/lib/utils";
import PlayerHead from "@/components/league/player-head";
import allData from "@/data/data.json";

interface LeaderStats extends BaseStats {
    PPG: number;
    RPG: number;
    APG: number;
    SPG: number;
    BPG: number;
    EFF: number;
    "FG%": number;
    "3P%": number;
}

interface PlayerWithTeam {
    player: Player;
    teamName: string;
    aggregated: LeaderStats;
}

function getLeagueLeaders(seasonId: string): PlayerWithTeam[] {
    const teams: Team[] = (allData as any).seasons[seasonId]?.teams || [];

    const leaders: PlayerWithTeam[] = [];

    teams.forEach(team => {
        team.roster.forEach(player => {
            const aggregated = (player.stats || []).reduce((acc, curr) => {
                Object.keys(acc).forEach(key => {
                    if (key in curr) {
                        (acc as any)[key] += (curr as any)[key] || 0;
                    }
                });
                return acc;
            }, {
                Points: 0, FieldGoalsMade: 0, FieldGoalAttempts: 0, ThreesMade: 0, ThreesAttempts: 0,
                FreeThrowsMade: 0, FreeThrowsAttempts: 0, Rebounds: 0, Offrebounds: 0, Defrebounds: 0,
                Assists: 0, Blocks: 0, Steals: 0, Turnovers: 0, PersonalFouls: 0,
                PPG: 0, RPG: 0, APG: 0, SPG: 0, BPG: 0, EFF: 0, "FG%": 0, "3P%": 0
            });

            const gp = player.GamesPlayed || 1;
            aggregated.PPG = Number((aggregated.Points / gp).toFixed(1));
            aggregated.RPG = Number((aggregated.Rebounds / gp).toFixed(1));
            aggregated.APG = Number((aggregated.Assists / gp).toFixed(1));
            aggregated.SPG = Number((aggregated.Steals / gp).toFixed(1));
            aggregated.BPG = Number((aggregated.Blocks / gp).toFixed(1));

            const missedFG = (aggregated.FieldGoalAttempts + aggregated.ThreesAttempts) - (aggregated.FieldGoalsMade + aggregated.ThreesMade);
            const missedFT = aggregated.FreeThrowsAttempts - aggregated.FreeThrowsMade;
            aggregated.EFF = Number(((aggregated.Points + aggregated.Rebounds + aggregated.Assists + aggregated.Steals + aggregated.Blocks - missedFG - missedFT - aggregated.Turnovers) / gp).toFixed(1));

            aggregated["FG%"] = Number((((aggregated.FieldGoalsMade + aggregated.ThreesMade) / (aggregated.FieldGoalAttempts + aggregated.ThreesAttempts)) * 100 || 0).toFixed(1));
            aggregated["3P%"] = Number(((aggregated.ThreesMade / aggregated.ThreesAttempts) * 100 || 0).toFixed(1));

            leaders.push({ player, teamName: team.Team, aggregated });
        });
    });

    return leaders;
}

export default function LeadersClient() {
    const searchParams = useSearchParams();
    const seasonId = searchParams.get("season") || "3";
    const players = getLeagueLeaders(seasonId);

    const categories = [
        { key: "PPG", label: "Points Per Game", color: "from-orange-500 to-orange-700" },
        { key: "RPG", label: "Rebounds Per Game", color: "from-blue-500 to-blue-700" },
        { key: "APG", label: "Assists Per Game", color: "from-green-500 to-green-700" },
        { key: "SPG", label: "Steals Per Game", color: "from-purple-500 to-purple-700" },
        { key: "BPG", label: "Blocks Per Game", color: "from-amber-500 to-amber-700" },
        { key: "EFF", label: "Efficiency Rating", color: "from-pink-500 to-pink-700" },
    ];

    const seasons = [
        { id: "3", label: "Season 3 - 2026" },
        { id: "2", label: "Season 2 - 2025" },
        { id: "1", label: "Season 1 - 2023" },
    ];

    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <div className="mb-12 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                        League <span className="text-orange-500">Leaders</span>
                    </h1>
                    <p className="mt-2 text-zinc-400">
                        Top individual performers across all statistical categories.
                    </p>
                </div>

                <div className="flex w-full flex-col gap-4 md:w-auto md:flex-row md:items-center">
                    <div className="flex gap-2">
                        {seasons.map(s => (
                            <Link
                                key={s.id}
                                href={`/stats/leaders?season=${s.id}`}
                                className={cn(
                                    "rounded-lg px-4 py-2 text-sm font-bold transition-all",
                                    seasonId === s.id
                                        ? "bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                                        : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                                )}
                            >
                                {s.id}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mb-8 flex items-center justify-between rounded-xl bg-orange-600/10 p-4 border border-orange-500/20">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-orange-400 uppercase tracking-tighter">Current View:</span>
                    <span className="text-lg font-bold text-white">{seasons.find(s => s.id === seasonId)?.label}</span>
                </div>
            </div>

            <div className="grid gap-12 lg:grid-cols-2">
                {categories.map((cat) => {
                    const topPlayers = [...players]
                        .sort((a, b) => (b.aggregated as any)[cat.key] - (a.aggregated as any)[cat.key])
                        .slice(0, 5);

                    return (
                        <div key={cat.key} className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-bold text-white shrink-0 italic uppercase tracking-tighter">{cat.label}</h2>
                                <div className="h-px w-full bg-white/10" />
                            </div>

                            <div className="space-y-3">
                                {topPlayers.map((p, i) => (
                                    <Link
                                        key={p.player.name + cat.key}
                                        href={`/players/${encodeURIComponent(p.player.name.trim())}`}
                                        className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50 p-4 transition-all hover:bg-zinc-900 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <div className={cn(
                                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-black italic shadow-inner",
                                            i === 0 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white" : "bg-white/5 text-zinc-600"
                                        )}>
                                            {i + 1}
                                        </div>

                                        <PlayerHead
                                            playerName={p.player.name}
                                            playerHead={p.player.PlayerHead}
                                            size="md"
                                            className="rounded-lg group-hover:scale-110 transition-transform"
                                        />

                                        <div className="flex-1">
                                            <h3 className="font-bold text-white group-hover:text-orange-500 transition-colors uppercase tracking-tight">{p.player.name}</h3>
                                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{p.teamName}</p>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-2xl font-black text-white italic tracking-tighter">{(p.aggregated as any)[cat.key]}</span>
                                        </div>

                                        {i === 0 && (
                                            <div className="absolute inset-y-0 right-0 w-1 bg-orange-600/50" />
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
