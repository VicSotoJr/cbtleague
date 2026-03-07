"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { Team } from "@/types/league";
import Link from "next/link";
import TeamLogo from "@/components/league/team-logo";
import PlayerHead from "@/components/league/player-head";
import { Trophy, BarChart2, ArrowLeft } from "lucide-react";
import allData from "@/data/data.json";

function getTeamData(teamName: string, seasonId: string): Team | null {
    const teams: Team[] = (allData as any).seasons[seasonId]?.teams || [];
    // Try exact match first
    let team = teams.find(t => t.Team.trim() === teamName);

    // If no exact match, try fuzzy match (ignoring spaces and case)
    if (!team) {
        const normalizedInput = teamName.replace(/\s+/g, "").toLowerCase();
        team = teams.find(t => t.Team.replace(/\s+/g, "").toLowerCase() === normalizedInput);
    }

    return team || null;
}

export default function TeamProfileClient({ teamName }: { teamName: string }) {
    const searchParams = useSearchParams();
    const seasonId = searchParams.get("season") || "3";
    const team = getTeamData(teamName, seasonId);

    if (!team) {
        return (
            <div className="container mx-auto px-4 py-24 text-center">
                <h1 className="text-4xl font-bold">Team Not Found</h1>
                <p className="mt-4 text-zinc-400">The team you are looking for does not exist in season {seasonId}.</p>
                <Link href="/teams" className="mt-8 inline-flex text-orange-500 hover:underline">Back to Teams</Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <Link href={`/teams?season=${seasonId}`} className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" />
                BACK TO TEAMS
            </Link>

            {/* Header */}
            <div className="relative mb-12 flex flex-col items-center gap-8 md:flex-row md:items-end">
                <TeamLogo
                    teamName={team.Team}
                    size={192}
                    className="rounded-3xl shadow-2xl"
                />
                <div className="text-center md:text-left">
                    <div className="flex flex-wrap justify-center gap-2 md:justify-start mb-4">
                        <span className="rounded-full bg-orange-600/10 px-3 py-1 text-xs font-bold text-orange-500 border border-orange-500/20 uppercase tracking-widest">Season {seasonId}</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-white md:text-7xl uppercase">{team.Team}</h1>
                    <div className="mt-4 flex flex-wrap justify-center gap-6 md:justify-start">
                        <div className="text-center md:text-left">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Record</p>
                            <p className="text-2xl font-black text-white">{team.wins}W - {team.loss}L</p>
                        </div>
                        <div className="text-center md:text-left border-l border-white/10 pl-6">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Win %</p>
                            <p className="text-2xl font-black text-orange-500">{(team.wins / (team.wins + team.loss) || 0).toFixed(3)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-12">
                {/* Roster Section */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-white shrink-0 italic uppercase tracking-tighter">Team Roster</h2>
                        <div className="h-px w-full bg-white/10" />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {team.roster.map((player, i) => (
                            <Link
                                key={`${player.name}-${i}`}
                                href={`/players/${encodeURIComponent(player.name.trim())}`}
                                className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-zinc-900/50 p-4 transition-all hover:bg-zinc-900 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <PlayerHead
                                    playerName={player.name}
                                    playerHead={player.PlayerHead}
                                    size={64}
                                    className="rounded-xl group-hover:scale-110 transition-transform"
                                />
                                <div className="flex-1">
                                    <h3 className="font-bold text-white group-hover:text-orange-500 transition-colors uppercase tracking-tight">{player.name}</h3>
                                    <p className="text-sm font-mono text-zinc-500">#{player.number}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Games</p>
                                    <p className="font-black text-white">{player.GamesPlayed}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Team Stats Section */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-white shrink-0 italic uppercase tracking-tighter">Season Statistics</h2>
                        <div className="h-px w-full bg-white/10" />
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/5">
                                    <tr>
                                        {[
                                            "GP", "W", "L", "PTS", "FGM", "FGA", "FG%", "2PM", "2PA", "2P%",
                                            "3PM", "3PA", "3P%", "FTM", "FTA", "FT%", "REB", "OREB", "DREB",
                                            "AST", "BLK", "STL", "TOV", "PF"
                                        ].map(header => (
                                            <th key={header} className="px-4 py-4 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {(() => {
                                        const stats = team.roster.reduce((acc, p) => {
                                            const playerTotal = (p.stats || []).reduce((pAcc, s) => {
                                                pAcc.Points += s.Points || 0;
                                                pAcc.FieldGoalsMade += s.FieldGoalsMade || 0;
                                                pAcc.FieldGoalAttempts += s.FieldGoalAttempts || 0;
                                                pAcc.ThreesMade += s.ThreesMade || 0;
                                                pAcc.ThreesAttempts += s.ThreesAttempts || 0;
                                                pAcc.FreeThrowsMade += s.FreeThrowsMade || 0;
                                                pAcc.FreeThrowsAttempts += s.FreeThrowsAttempts || 0;
                                                pAcc.Rebounds += s.Rebounds || 0;
                                                pAcc.Offrebounds += s.Offrebounds || 0;
                                                pAcc.Defrebounds += s.Defrebounds || 0;
                                                pAcc.Assists += s.Assists || 0;
                                                pAcc.Blocks += s.Blocks || 0;
                                                pAcc.Steals += s.Steals || 0;
                                                pAcc.Turnovers += s.Turnovers || 0;
                                                pAcc.PersonalFouls += s.PersonalFouls || 0;
                                                return pAcc;
                                            }, {
                                                Points: 0, FieldGoalsMade: 0, FieldGoalAttempts: 0, ThreesMade: 0, ThreesAttempts: 0,
                                                FreeThrowsMade: 0, FreeThrowsAttempts: 0, Rebounds: 0, Offrebounds: 0, Defrebounds: 0,
                                                Assists: 0, Blocks: 0, Steals: 0, Turnovers: 0, PersonalFouls: 0
                                            });

                                            // Detect inclusive vs separate format per player
                                            const pointsFromInclusive = ((playerTotal.FieldGoalsMade - playerTotal.ThreesMade) * 2) + (playerTotal.ThreesMade * 3);
                                            const pointsFromSeparate = (playerTotal.FieldGoalsMade * 2) + (playerTotal.ThreesMade * 3);
                                            const isInclusive = Math.abs(pointsFromInclusive - playerTotal.Points) <= Math.abs(pointsFromSeparate - playerTotal.Points);

                                            const totalFGM = isInclusive ? playerTotal.FieldGoalsMade : (playerTotal.FieldGoalsMade + playerTotal.ThreesMade);
                                            const totalFGA = isInclusive ? playerTotal.FieldGoalAttempts : (playerTotal.FieldGoalAttempts + playerTotal.ThreesAttempts);

                                            acc.pts += playerTotal.Points;
                                            acc.fgm += totalFGM;
                                            acc.fga += totalFGA;
                                            acc.threeM += playerTotal.ThreesMade;
                                            acc.threeA += playerTotal.ThreesAttempts;
                                            acc.ftm += playerTotal.FreeThrowsMade;
                                            acc.fta += playerTotal.FreeThrowsAttempts;
                                            acc.reb += playerTotal.Rebounds;
                                            acc.oreb += playerTotal.Offrebounds;
                                            acc.dreb += playerTotal.Defrebounds;
                                            acc.ast += playerTotal.Assists;
                                            acc.blk += playerTotal.Blocks;
                                            acc.stl += playerTotal.Steals;
                                            acc.tov += playerTotal.Turnovers;
                                            acc.pf += playerTotal.PersonalFouls;
                                            return acc;
                                        }, {
                                            pts: 0, fgm: 0, fga: 0, threeM: 0, threeA: 0,
                                            ftm: 0, fta: 0, reb: 0, oreb: 0, dreb: 0,
                                            ast: 0, blk: 0, stl: 0, tov: 0, pf: 0
                                        });

                                        const totalFGM = stats.fgm;
                                        const totalFGA = stats.fga;

                                        // Robust safety guards for team totals
                                        const twoPM = Math.max(0, totalFGM - stats.threeM);
                                        const twoPA = Math.max(twoPM, totalFGA - stats.threeA);

                                        const fgPct = ((totalFGM / (totalFGA || 1)) * 100).toFixed(1);
                                        const twoPct = ((twoPM / (twoPA || 1)) * 100).toFixed(1);
                                        const threePct = ((stats.threeM / (stats.threeA || 1)) * 100).toFixed(1);
                                        const ftPct = ((stats.ftm / (stats.fta || 1)) * 100).toFixed(1);

                                        return (
                                            <tr className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-6 text-center text-white font-bold">{team.gamesPlayed}</td>
                                                <td className="px-4 py-6 text-center text-green-500 font-bold">{team.wins}</td>
                                                <td className="px-4 py-6 text-center text-red-500 font-bold">{team.loss}</td>
                                                <td className="px-4 py-6 text-center text-white font-black italic">{stats.pts}</td>
                                                <td className="px-4 py-6 text-center text-zinc-400">{totalFGM}</td>
                                                <td className="px-4 py-6 text-center text-zinc-400">{totalFGA}</td>
                                                <td className="px-4 py-6 text-center text-zinc-300 font-mono font-bold">{fgPct}%</td>
                                                <td className="px-4 py-6 text-center text-zinc-400">{twoPM}</td>
                                                <td className="px-4 py-6 text-center text-zinc-400">{twoPA}</td>
                                                <td className="px-4 py-6 text-center text-zinc-300 font-mono font-bold">{twoPct}%</td>
                                                <td className="px-4 py-6 text-center text-zinc-400">{stats.threeM}</td>
                                                <td className="px-4 py-6 text-center text-zinc-400">{stats.threeA}</td>
                                                <td className="px-4 py-6 text-center text-zinc-300 font-mono font-bold">{threePct}%</td>
                                                <td className="px-4 py-6 text-center text-zinc-400">{stats.ftm}</td>
                                                <td className="px-4 py-6 text-center text-zinc-400">{stats.fta}</td>
                                                <td className="px-4 py-6 text-center text-zinc-300 font-mono font-bold">{ftPct}%</td>
                                                <td className="px-4 py-6 text-center text-zinc-200 font-bold">{stats.reb}</td>
                                                <td className="px-4 py-6 text-center text-zinc-400">{stats.oreb}</td>
                                                <td className="px-4 py-6 text-center text-zinc-400">{stats.dreb}</td>
                                                <td className="px-4 py-6 text-center text-zinc-300">{stats.ast}</td>
                                                <td className="px-4 py-6 text-center text-zinc-300">{stats.blk}</td>
                                                <td className="px-4 py-6 text-center text-zinc-300">{stats.stl}</td>
                                                <td className="px-4 py-6 text-center text-zinc-300">{stats.tov}</td>
                                                <td className="px-4 py-6 text-center text-zinc-300">{stats.pf}</td>
                                            </tr>
                                        );
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
