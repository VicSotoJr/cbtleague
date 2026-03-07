"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { Team } from "@/types/league";
import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import TeamLogo from "@/components/league/team-logo";
import allData from "@/data/data.json";

function getTeams(seasonId: string): Team[] {
    return (allData as any).seasons[seasonId]?.teams || [];
}

export default function TeamsClient() {
    const searchParams = useSearchParams();
    const seasonId = searchParams.get("season") || "3";
    const teams = getTeams(seasonId);

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
                        League <span className="text-orange-500">Teams</span>
                    </h1>
                    <p className="mt-2 text-zinc-400">
                        Explore the rosters and achievements of every team in the league.
                    </p>
                </div>

                <div className="flex gap-2">
                    {seasons.map(s => (
                        <Link
                            key={s.id}
                            href={`/teams?season=${s.id}`}
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

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {teams.map((team) => (
                    <Link
                        key={team.Team}
                        href={`/teams/${encodeURIComponent(team.Team.trim())}?season=${seasonId}`}
                        className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50 p-6 text-center transition-all hover:border-orange-500/30 hover:bg-zinc-900 hover:-translate-y-1"
                    >
                        <TeamLogo
                            teamName={team.Team}
                            size={128}
                            className="mb-6 rounded-2xl transition-transform group-hover:scale-110"
                        />

                        <h3 className="text-xl font-bold text-white group-hover:text-orange-500">{team.Team}</h3>
                        <div className="mt-2 flex items-center gap-4 text-sm text-zinc-500">
                            <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{team.roster.length} Players</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-zinc-400">{team.wins}W - {team.loss}L</span>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-500 opacity-0 transition-opacity group-hover:opacity-100">
                            View Roster <ArrowRight className="h-3 w-3" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
