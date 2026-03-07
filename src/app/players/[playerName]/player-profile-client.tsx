"use client";

import React from "react";
import { PlayerStat, BaseStats, Team } from "@/types/league";
import Link from "next/link";
import { Activity, Zap, Target, TrendingUp, ArrowLeft } from "lucide-react";
import PlayerHead from "@/components/league/player-head";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import allData from "@/data/data.json";

interface SeasonStats {
    seasonId: string;
    seasonName: string;
    teamName: string;
    playerHead?: string;
    stats: BaseStats & { PPG: number; RPG: number; APG: number; EFF: number; GAMES: number };
    gameLogs: PlayerStat[];
}

function getPlayerData(playerName: string): SeasonStats[] {
    const results: SeasonStats[] = [];

    Object.entries((allData as any).seasons).forEach(([seasonId, seasonData]: [string, any]) => {
        seasonData.teams.forEach((team: Team) => {
            const player = team.roster.find(p => p.name.trim().toLowerCase() === playerName.toLowerCase());
            if (player) {
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
                    Assists: 0, Blocks: 0, Steals: 0, Turnovers: 0, PersonalFouls: 0
                });

                const gp = player.GamesPlayed || 1;
                const missedFG = (aggregated.FieldGoalAttempts + aggregated.ThreesAttempts) - (aggregated.FieldGoalsMade + aggregated.ThreesMade);
                const missedFT = aggregated.FreeThrowsAttempts - aggregated.FreeThrowsMade;

                const eff = (aggregated.Points + aggregated.Rebounds + aggregated.Assists + aggregated.Steals + aggregated.Blocks - missedFG - missedFT - aggregated.Turnovers) / gp;

                results.push({
                    seasonId,
                    seasonName: seasonData.name,
                    teamName: team.Team,
                    stats: {
                        ...aggregated,
                        PPG: Number((aggregated.Points / gp).toFixed(1)),
                        RPG: Number((aggregated.Rebounds / gp).toFixed(1)),
                        APG: Number((aggregated.Assists / gp).toFixed(1)),
                        EFF: Number(eff.toFixed(1)) || 0,
                        GAMES: player.GamesPlayed || 0
                    },
                    playerHead: player.PlayerHead,
                    gameLogs: player.stats || []
                });
            }
        });
    });

    return results;
}

export default function PlayerProfileClient({ playerName }: { playerName: string }) {
    const seasonData = getPlayerData(playerName);

    if (seasonData.length === 0) {
        return (
            <div className="container mx-auto px-4 py-24 text-center">
                <h1 className="text-4xl font-bold">Player Not Found</h1>
                <p className="mt-4 text-zinc-400">We couldn't find any historical records for {playerName}.</p>
                <Link href="/stats/leaders" className="mt-8 inline-flex text-orange-500 hover:underline">View League Leaders</Link>
            </div>
        );
    }

    // Aggregate totals for the header info
    const careerPoints = seasonData.reduce((acc, curr) => acc + curr.stats.Points, 0);
    const totalGames = seasonData.reduce((acc, curr) => acc + curr.stats.GAMES, 0);
    const avgPPG = (careerPoints / totalGames).toFixed(1);
    const latestTeam = seasonData[seasonData.length - 1].teamName;
    const playerHeadFilename = seasonData[seasonData.length - 1].playerHead;

    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <Link href="/stats/leaders" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" />
                BACK TO LEADERS
            </Link>

            {/* Profile Header */}
            <div className="relative mb-16 flex flex-col items-center gap-10 md:flex-row md:items-end">
                <PlayerHead
                    playerName={playerName}
                    playerHead={playerHeadFilename}
                    size="xl"
                    className="rounded-3xl border-4 border-orange-500/20 shadow-2xl"
                />
                <div className="text-center md:text-left">
                    <h1 className="text-5xl font-black tracking-tighter text-white md:text-7xl uppercase">{playerName}</h1>
                    <div className="mt-6 flex flex-wrap justify-center gap-8 md:justify-start">
                        <div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Latest Team</p>
                            <p className="text-2xl font-black text-white uppercase">{latestTeam}</p>
                        </div>
                        <div className="border-l border-white/10 pl-8">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Career Points</p>
                            <p className="text-2xl font-black text-white">{careerPoints}</p>
                        </div>
                        <div className="border-l border-white/10 pl-8">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Avg PPG</p>
                            <p className="text-2xl font-black text-orange-500">{avgPPG}</p>
                        </div>
                        <div className="border-l border-white/10 pl-8">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Games</p>
                            <p className="text-2xl font-black text-white">{totalGames}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Season Breakdowns */}
            <div className="space-y-20">
                {seasonData.reverse().map((season) => (
                    <div key={season.seasonId} className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <h2 className="text-3xl font-black text-white uppercase tracking-tight">{season.seasonName}</h2>
                                <span className="rounded-full bg-white/5 px-4 py-1 text-xs font-bold text-zinc-400 border border-white/10">{season.teamName}</span>
                            </div>
                            <div className="h-px flex-1 mx-8 bg-white/5 hidden md:block" />
                        </div>

                        {/* Season Averages Cards */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard label="PPG" value={season.stats.PPG} sub="Points per game" icon={<Zap className="h-4 w-4 text-orange-500" />} />
                            <StatCard label="RPG" value={season.stats.RPG} sub="Rebounds per game" icon={<Activity className="h-4 w-4 text-blue-500" />} />
                            <StatCard label="APG" value={season.stats.APG} sub="Assists per game" icon={<Target className="h-4 w-4 text-green-500" />} />
                            <StatCard label="EFF" value={season.stats.EFF} sub="Efficiency rating" icon={<TrendingUp className="h-4 w-4 text-purple-500" />} />
                        </div>

                        {/* Game Log Table */}
                        <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50">
                            <Table>
                                <TableHeader className="bg-white/5">
                                    <TableRow className="border-white/5">
                                        <TableHead className="w-16">Game</TableHead>
                                        <TableHead>Opponent</TableHead>
                                        <TableHead className="text-center">PTS</TableHead>
                                        <TableHead className="text-center">REB</TableHead>
                                        <TableHead className="text-center">AST</TableHead>
                                        <TableHead className="text-center">STL</TableHead>
                                        <TableHead className="text-center">BLK</TableHead>
                                        <TableHead className="text-right">FG%</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {season.gameLogs.map((log, idx) => {
                                        const fgPct = (((log.FieldGoalsMade + log.ThreesMade) / (log.FieldGoalAttempts + log.ThreesAttempts)) * 100 || 0).toFixed(1);
                                        return (
                                            <TableRow key={`${log.game_number}-${idx}`} className="border-white/5 hover:bg-white/5 transition-colors">
                                                <TableCell className="font-mono text-zinc-500">#{log.game_number}</TableCell>
                                                <TableCell className="font-bold text-white">{log.opponent || "—"}</TableCell>
                                                <TableCell className="text-center font-bold text-orange-500">{log.Points}</TableCell>
                                                <TableCell className="text-center text-zinc-300">{log.Rebounds}</TableCell>
                                                <TableCell className="text-center text-zinc-300">{log.Assists}</TableCell>
                                                <TableCell className="text-center text-zinc-300">{log.Steals}</TableCell>
                                                <TableCell className="text-center text-zinc-300">{log.Blocks}</TableCell>
                                                <TableCell className="text-right font-mono text-zinc-400">{fgPct}%</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StatCard({ label, value, sub, icon }: { label: string; value: number | string; sub: string; icon: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6 flex items-start gap-4">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
                {icon}
            </div>
            <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</p>
                <div className="flex items-baseline gap-1">
                    <p className="text-3xl font-black text-white">{value}</p>
                </div>
                <p className="text-[10px] text-zinc-600 font-medium uppercase mt-1">{sub}</p>
            </div>
        </div>
    );
}
