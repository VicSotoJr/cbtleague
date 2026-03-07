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
    return teams.find(t => t.Team.trim() === teamName) || null;
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

            <div className="grid gap-12 lg:grid-cols-3">
                {/* Roster Section */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-white shrink-0">Team Roster</h2>
                        <div className="h-px w-full bg-white/10" />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {team.roster.map((player) => (
                            <Link
                                key={player.name}
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

                {/* Quick Stats Summary */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-white shrink-0">Summary</h2>
                        <div className="h-px w-full bg-white/10" />
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                    <Trophy className="h-4 w-4 text-orange-500" />
                                </div>
                                <span className="font-bold text-zinc-300">Total Games</span>
                            </div>
                            <span className="text-xl font-bold text-white">{team.gamesPlayed}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <BarChart2 className="h-4 w-4 text-blue-500" />
                                </div>
                                <span className="font-bold text-zinc-300">Average PPG</span>
                            </div>
                            <span className="text-xl font-bold text-white">72.4</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
