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
            <Link
                href={`/teams/${encodeURIComponent(seasonData[seasonData.length - 1].teamName)}?season=${seasonData[seasonData.length - 1].seasonId}`}
                className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-white transition-colors uppercase"
            >
                <ArrowLeft className="h-4 w-4" />
                BACK TO {latestTeam}
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
                                <Link
                                    href={`/teams/${encodeURIComponent(season.teamName)}?season=${season.seasonId}`}
                                    className="rounded-full bg-white/5 px-4 py-1 text-xs font-bold text-zinc-400 border border-white/10 hover:bg-white/10 transition-colors"
                                >
                                    {season.teamName}
                                </Link>
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
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-white/5">
                                        <TableRow className="border-white/5 hover:bg-transparent">
                                            <TableHead className="w-16 whitespace-nowrap sticky left-0 bg-zinc-900/90 backdrop-blur-md z-10">Game</TableHead>
                                            <TableHead className="whitespace-nowrap">Opponent</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-white uppercase tracking-tighter italic">PTS</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">PPG</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">FGM</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">FGA</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">FG%</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">2PM</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">2PA</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">2P%</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">3PM</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">3PA</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">3P%</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">FTM</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">FTA</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">FT%</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">OREB</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">DREB</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">REB</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">RPG</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">AST</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">APG</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">STL</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">SPG</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">BLK</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">BPG</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">TOV</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">TOVPG</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-bold text-zinc-500 uppercase tracking-tighter">PF</TableHead>
                                            <TableHead className="text-right whitespace-nowrap font-bold text-orange-500 uppercase tracking-tighter italic">EFF</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {season.gameLogs.map((log, idx) => {
                                            const twoPM = log.FieldGoalsMade - log.ThreesMade; // Corrected to be 2PM
                                            const twoPA = log.FieldGoalAttempts - log.ThreesAttempts; // Corrected to be 2PA
                                            const threePM = log.ThreesMade;
                                            const threePA = log.ThreesAttempts;
                                            const totalFGM = log.FieldGoalsMade; // Total FGM is already in log.FieldGoalsMade
                                            const totalFGA = log.FieldGoalAttempts; // Total FGA is already in log.FieldGoalAttempts

                                            const fgPct = ((totalFGM / (totalFGA || 1)) * 100).toFixed(1);
                                            const twoPct = ((twoPM / (twoPA || 1)) * 100).toFixed(1);
                                            const threePct = ((threePM / (threePA || 1)) * 100).toFixed(1);
                                            const ftPct = ((log.FreeThrowsMade / (log.FreeThrowsAttempts || 1)) * 100).toFixed(1);

                                            const missedFG = totalFGA - totalFGM;
                                            const missedFT = log.FreeThrowsAttempts - log.FreeThrowsMade;
                                            const eff = (log.Points + log.Rebounds + log.Assists + log.Steals + log.Blocks - missedFG - missedFT - log.Turnovers);

                                            return (
                                                <TableRow key={`${log.game_number}-${idx}`} className="border-white/5 hover:bg-white/5 transition-colors group">
                                                    <TableCell className="font-mono text-zinc-500 whitespace-nowrap sticky left-0 bg-zinc-900/90 backdrop-blur-md z-10">#{log.game_number}</TableCell>
                                                    <TableCell className="font-bold text-white whitespace-nowrap">{log.opponent || "—"}</TableCell>
                                                    <TableCell className="text-center font-bold text-white italic">{log.Points}</TableCell>
                                                    <TableCell className="text-center text-zinc-400 font-mono">{(log.Points / 1).toFixed(1)}</TableCell>
                                                    <TableCell className="text-center text-zinc-400">{totalFGM}</TableCell>
                                                    <TableCell className="text-center text-zinc-400">{totalFGA}</TableCell>
                                                    <TableCell className="text-center font-mono font-bold text-zinc-500">{fgPct}%</TableCell>
                                                    <TableCell className="text-center text-zinc-400">{twoPM}</TableCell>
                                                    <TableCell className="text-center text-zinc-400">{twoPA}</TableCell>
                                                    <TableCell className="text-center font-mono text-zinc-500">{twoPct}%</TableCell>
                                                    <TableCell className="text-center text-zinc-400">{threePM}</TableCell>
                                                    <TableCell className="text-center text-zinc-400">{threePA}</TableCell>
                                                    <TableCell className="text-center font-mono text-zinc-500">{threePct}%</TableCell>
                                                    <TableCell className="text-center text-zinc-400">{log.FreeThrowsMade}</TableCell>
                                                    <TableCell className="text-center text-zinc-400">{log.FreeThrowsAttempts}</TableCell>
                                                    <TableCell className="text-center font-mono text-zinc-500">{ftPct}%</TableCell>
                                                    <TableCell className="text-center text-zinc-400">{log.Offrebounds}</TableCell>
                                                    <TableCell className="text-center text-zinc-400">{log.Defrebounds}</TableCell>
                                                    <TableCell className="text-center font-bold text-zinc-300">{log.Rebounds}</TableCell>
                                                    <TableCell className="text-center text-zinc-400 font-mono">{(log.Rebounds / 1).toFixed(1)}</TableCell>
                                                    <TableCell className="text-center text-zinc-300">{log.Assists}</TableCell>
                                                    <TableCell className="text-center text-zinc-400 font-mono">{(log.Assists / 1).toFixed(1)}</TableCell>
                                                    <TableCell className="text-center text-zinc-300">{log.Steals}</TableCell>
                                                    <TableCell className="text-center text-zinc-400 font-mono">{(log.Steals / 1).toFixed(1)}</TableCell>
                                                    <TableCell className="text-center text-zinc-300">{log.Blocks}</TableCell>
                                                    <TableCell className="text-center text-zinc-400 font-mono">{(log.Blocks / 1).toFixed(1)}</TableCell>
                                                    <TableCell className="text-center text-zinc-300">{log.Turnovers}</TableCell>
                                                    <TableCell className="text-center text-zinc-400 font-mono">{(log.Turnovers / 1).toFixed(1)}</TableCell>
                                                    <TableCell className="text-center text-zinc-300">{log.PersonalFouls}</TableCell>
                                                    <TableCell className="text-right font-black text-orange-500 italic">{eff}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
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
