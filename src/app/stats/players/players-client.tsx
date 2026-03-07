"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { Team, Player, BaseStats } from "@/types/league";
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
import PlayerSearch from "@/components/league/player-search";
import PlayerHead from "@/components/league/player-head";
import allData from "@/data/data.json";

interface AggregatedPlayer extends Player {
    teamName: string;
    aggregated: BaseStats & { PPG: number; RPG: number; APG: number; EFF: number };
}

function getAggregatedPlayers(seasonId: string): AggregatedPlayer[] {
    const teams: Team[] = (allData as any).seasons[seasonId]?.teams || [];
    const players: AggregatedPlayer[] = [];

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
                Assists: 0, Blocks: 0, Steals: 0, Turnovers: 0, PersonalFouls: 0
            });

            const gp = player.GamesPlayed || 1;
            const missedFG = (aggregated.FieldGoalAttempts + aggregated.ThreesAttempts) - (aggregated.FieldGoalsMade + aggregated.ThreesMade);
            const missedFT = aggregated.FreeThrowsAttempts - aggregated.FreeThrowsMade;
            const eff = (aggregated.Points + aggregated.Rebounds + aggregated.Assists + aggregated.Steals + aggregated.Blocks - missedFG - missedFT - aggregated.Turnovers) / gp;

            players.push({
                ...player,
                teamName: team.Team,
                aggregated: {
                    ...aggregated,
                    PPG: Number((aggregated.Points / gp).toFixed(1)),
                    RPG: Number((aggregated.Rebounds / gp).toFixed(1)),
                    APG: Number((aggregated.Assists / gp).toFixed(1)),
                    EFF: Number(eff.toFixed(1))
                }
            });
        });
    });

    return players.sort((a, b) => b.aggregated.PPG - a.aggregated.PPG);
}

function getAllPlayersForSearch(seasonId: string): any[] {
    const teams: Team[] = (allData as any).seasons[seasonId]?.teams || [];
    const allPlayers: any[] = [];

    teams.forEach(team => {
        team.roster.forEach(player => {
            allPlayers.push({
                name: player.name,
                team: team.Team,
                playerHead: player.PlayerHead
            });
        });
    });

    return allPlayers;
}

export default function PlayersClient() {
    const searchParams = useSearchParams();
    const seasonId = searchParams.get("season") || "3";
    const players = getAggregatedPlayers(seasonId);
    const allPlayers = getAllPlayersForSearch(seasonId);

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
                        Player <span className="text-orange-500">Stats</span>
                    </h1>
                    <p className="mt-2 text-zinc-400">
                        Detailed statistical records for every player in the league.
                    </p>
                </div>

                <div className="flex w-full flex-col gap-4 md:w-auto md:flex-row md:items-center">
                    <PlayerSearch players={allPlayers} />
                    <div className="flex gap-2">
                        {seasons.map(s => (
                            <Link
                                key={s.id}
                                href={`/stats/players?season=${s.id}`}
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

            <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50 backdrop-blur-sm shadow-2xl">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-white/5">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="sticky left-0 bg-zinc-900 z-10 min-w-[200px] font-bold text-white uppercase tracking-tighter italic">Player</TableHead>
                                <TableHead className="min-w-[120px] font-bold text-zinc-500 uppercase tracking-tighter">Team</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500 uppercase tracking-tighter">GP</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500 uppercase tracking-tighter">PTS</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500 uppercase tracking-tighter">FGM</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500 uppercase tracking-tighter">FGA</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500 uppercase tracking-tighter">3PM</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500 uppercase tracking-tighter">3PA</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500 uppercase tracking-tighter">FTM</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500 uppercase tracking-tighter">FTA</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500 uppercase tracking-tighter">OREB</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500 uppercase tracking-tighter">DREB</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500 uppercase tracking-tighter">REB</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500 uppercase tracking-tighter">AST</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500 uppercase tracking-tighter">STL</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500 uppercase tracking-tighter">BLK</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500 uppercase tracking-tighter">TOV</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500 uppercase tracking-tighter">PF</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500 uppercase tracking-tighter">FG%</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500 uppercase tracking-tighter">3P%</TableHead>
                                <TableHead className="text-center font-bold text-orange-500 uppercase tracking-tighter">PPG</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500 uppercase tracking-tighter">RPG</TableHead>
                                <TableHead className="text-center font-bold text-zinc-500 uppercase tracking-tighter">APG</TableHead>
                                <TableHead className="text-right font-bold text-zinc-500 uppercase tracking-tighter">EFF</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {players.map((player) => {
                                const gp = player.GamesPlayed || 1;
                                const fgPct = (((player.aggregated.FieldGoalsMade + player.aggregated.ThreesMade) / (player.aggregated.FieldGoalAttempts + player.aggregated.ThreesAttempts)) * 100 || 0).toFixed(1);
                                const threePct = ((player.aggregated.ThreesMade / player.aggregated.ThreesAttempts) * 100 || 0).toFixed(1);

                                return (
                                    <TableRow key={player.name + player.teamName} className="border-white/5 hover:bg-white/5 transition-colors group">
                                        <TableCell className="sticky left-0 bg-zinc-900/90 backdrop-blur-md z-10 font-bold text-white group-hover:text-orange-500">
                                            <Link href={`/players/${encodeURIComponent(player.name.trim())}`} className="flex items-center gap-3">
                                                <PlayerHead
                                                    playerName={player.name}
                                                    playerHead={player.PlayerHead}
                                                    size="sm"
                                                    className="rounded-full"
                                                />
                                                <span className="uppercase tracking-tight">{player.name}</span>
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-zinc-500 font-bold text-xs uppercase tracking-tight">
                                            <Link href={`/teams/${encodeURIComponent(player.teamName.trim())}?season=${seasonId}`} className="hover:text-white transition-colors">
                                                {player.teamName}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{player.GamesPlayed}</TableCell>
                                        <TableCell className="text-center font-medium text-white">{player.aggregated.Points}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{player.aggregated.FieldGoalsMade}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{player.aggregated.FieldGoalAttempts}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{player.aggregated.ThreesMade}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{player.aggregated.ThreesAttempts}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{player.aggregated.FreeThrowsMade}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{player.aggregated.FreeThrowsAttempts}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{player.aggregated.Offrebounds}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{player.aggregated.Defrebounds}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{player.aggregated.Rebounds}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{player.aggregated.Assists}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{player.aggregated.Steals}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{player.aggregated.Blocks}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{player.aggregated.Turnovers}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{player.aggregated.PersonalFouls}</TableCell>
                                        <TableCell className="text-center font-mono font-bold text-zinc-400">{fgPct}%</TableCell>
                                        <TableCell className="text-center font-mono font-bold text-zinc-400">{threePct}%</TableCell>
                                        <TableCell className="text-center font-black text-orange-500">{player.aggregated.PPG}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-300">{player.aggregated.RPG}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-300">{player.aggregated.APG}</TableCell>
                                        <TableCell className="text-right font-black text-white italic">{player.aggregated.EFF}</TableCell>
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
