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

            // Critical: Data consistency fix. Season 1 has inclusive FGM, Season 2 has separate FGM.
            const pointsFromInclusive = ((aggregated.FieldGoalsMade - aggregated.ThreesMade) * 2) + (aggregated.ThreesMade * 3);
            const pointsFromSeparate = (aggregated.FieldGoalsMade * 2) + (aggregated.ThreesMade * 3);
            const isInclusive = Math.abs(pointsFromInclusive - aggregated.Points) <= Math.abs(pointsFromSeparate - aggregated.Points);

            const totalFGM = isInclusive ? aggregated.FieldGoalsMade : (aggregated.FieldGoalsMade + aggregated.ThreesMade);
            const totalFGA = isInclusive ? aggregated.FieldGoalAttempts : (aggregated.FieldGoalAttempts + aggregated.ThreesAttempts);

            // Robust safety guards
            const threePM = aggregated.ThreesMade;
            const threePA = aggregated.ThreesAttempts;
            const twoPM = Math.max(0, totalFGM - threePM);
            const twoPA = Math.max(twoPM, totalFGA - threePA);

            (aggregated as any).PPG = Number((aggregated.Points / gp).toFixed(1));
            (aggregated as any).RPG = Number((aggregated.Rebounds / gp).toFixed(1));
            (aggregated as any).APG = Number((aggregated.Assists / gp).toFixed(1));
            (aggregated as any).SPG = Number((aggregated.Steals / gp).toFixed(1));
            (aggregated as any).BPG = Number((aggregated.Blocks / gp).toFixed(1));
            (aggregated as any).TOVPG = Number((aggregated.Turnovers / gp).toFixed(1));

            const missedFG = Math.max(0, totalFGA - totalFGM);
            const missedFT = Math.max(0, aggregated.FreeThrowsAttempts - aggregated.FreeThrowsMade);
            const eff = (aggregated.Points + aggregated.Rebounds + aggregated.Assists + aggregated.Steals + aggregated.Blocks - missedFG - missedFT - aggregated.Turnovers) / gp;

            players.push({
                ...player,
                teamName: team.Team,
                aggregated: {
                    ...aggregated,
                    FieldGoalsMade: totalFGM, // Store the correctly calculated total
                    FieldGoalAttempts: totalFGA,
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

    const [searchQuery, setSearchQuery] = React.useState("");

    const filteredPlayers = React.useMemo(() => {
        return players.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [players, searchQuery]);

    const seasons = [
        { id: "3", label: "Season 3 - 2026" },
        { id: "2", label: "Season 2 - 2025" },
        { id: "1", label: "Season 1 - 2023" },
    ];

    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl uppercase italic">
                        Player <span className="text-orange-500">Stats</span>
                    </h1>
                    <p className="mt-2 text-zinc-400">
                        Detailed statistical records for every player in the league.
                    </p>
                </div>

                <div className="flex w-full flex-col gap-4 md:w-auto md:flex-row md:items-center">
                    <div className="relative w-full max-w-sm">
                        <input
                            type="text"
                            placeholder="Search players..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-2 text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/20"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold uppercase tracking-widest text-zinc-500">Season</span>
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
                                {[
                                    "GP", "PTS", "PPG", "FGM", "FGA", "FG%", "2PM", "2PA", "2P%", "3PM", "3PA", "3P%",
                                    "FTM", "FTA", "FT%", "OREB", "DREB", "REB", "RPG", "AST", "APG", "STL", "SPG",
                                    "BLK", "BPG", "TOV", "TOVPG", "PF", "EFF"
                                ].map(stat => (
                                    <TableHead key={stat} className={cn(
                                        "text-center font-bold uppercase tracking-tighter whitespace-nowrap px-4",
                                        stat === "PPG" || stat === "EFF" ? "text-orange-500" : "text-zinc-500"
                                    )}>{stat}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPlayers.map((player, i) => {
                                const totalFGM = player.aggregated.FieldGoalsMade;
                                const totalFGA = player.aggregated.FieldGoalAttempts;
                                const threePM = player.aggregated.ThreesMade;
                                const threePA = player.aggregated.ThreesAttempts;
                                const twoPM = totalFGM - threePM;
                                const twoPA = totalFGA - threePA;

                                const fgPct = ((totalFGM / (totalFGA || 1)) * 100).toFixed(1);
                                const twoPct = ((twoPM / (twoPA || 1)) * 100).toFixed(1);
                                const threePct = ((threePM / (threePA || 1)) * 100).toFixed(1);
                                const ftPct = ((player.aggregated.FreeThrowsMade / (player.aggregated.FreeThrowsAttempts || 1)) * 100).toFixed(1);

                                const gp = player.GamesPlayed || 1;

                                return (
                                    <TableRow key={`${player.name}-${player.teamName}-${i}`} className="border-white/5 hover:bg-white/5 transition-colors group">
                                        <TableCell className="sticky left-0 bg-zinc-900/90 backdrop-blur-md z-10 font-bold text-white group-hover:text-orange-500">
                                            <Link href={`/players/${encodeURIComponent(player.name.trim())}`} className="flex items-center gap-3">
                                                <PlayerHead
                                                    playerName={player.name}
                                                    playerHead={player.PlayerHead}
                                                    size="sm"
                                                    className="rounded-full"
                                                />
                                                <span className="uppercase tracking-tight whitespace-nowrap">{player.name}</span>
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-zinc-500 font-bold text-sm uppercase tracking-tight whitespace-nowrap">
                                            <Link href={`/teams/${encodeURIComponent(player.teamName.trim())}?season=${seasonId}`} className="hover:text-white transition-colors">
                                                {player.teamName}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{player.GamesPlayed}</TableCell>
                                        <TableCell className="text-center font-black text-white">{player.aggregated.Points}</TableCell>
                                        <TableCell className="text-center font-black text-orange-500 italic">{player.aggregated.PPG}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{totalFGM}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{totalFGA}</TableCell>
                                        <TableCell className="text-center font-mono font-bold text-zinc-500">{fgPct}%</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{twoPM}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{twoPA}</TableCell>
                                        <TableCell className="text-center font-mono font-bold text-zinc-500">{twoPct}%</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{threePM}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{threePA}</TableCell>
                                        <TableCell className="text-center font-mono font-bold text-zinc-500">{threePct}%</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{player.aggregated.FreeThrowsMade}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{player.aggregated.FreeThrowsAttempts}</TableCell>
                                        <TableCell className="text-center font-mono font-bold text-zinc-500">{ftPct}%</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{player.aggregated.Offrebounds}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-400">{player.aggregated.Defrebounds}</TableCell>
                                        <TableCell className="text-center font-bold text-zinc-300">{player.aggregated.Rebounds}</TableCell>
                                        <TableCell className="text-center font-mono text-zinc-400">{player.aggregated.RPG}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-300">{player.aggregated.Assists}</TableCell>
                                        <TableCell className="text-center font-mono text-zinc-400">{player.aggregated.APG}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-300">{player.aggregated.Steals}</TableCell>
                                        <TableCell className="text-center font-mono text-zinc-400">{(player.aggregated.Steals / gp).toFixed(1)}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-300">{player.aggregated.Blocks}</TableCell>
                                        <TableCell className="text-center font-mono text-zinc-400">{(player.aggregated.Blocks / gp).toFixed(1)}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-300">{player.aggregated.Turnovers}</TableCell>
                                        <TableCell className="text-center font-mono text-zinc-400">{(player.aggregated.Turnovers / gp).toFixed(1)}</TableCell>
                                        <TableCell className="text-center font-medium text-zinc-300">{player.aggregated.PersonalFouls}</TableCell>
                                        <TableCell className="text-right font-black text-orange-500 italic">{player.aggregated.EFF}</TableCell>
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
