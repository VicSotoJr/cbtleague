"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import StandingsTable from "@/components/league/standings-table";
import { Team } from "@/types/league";
import allData from "@/data/data.json";
import Link from "next/link";

export default function StandingsClient() {
    const searchParams = useSearchParams();
    const seasonId = searchParams.get("season") || "3";

    // cast to any since we don't have perfect types for data.json structure
    const teams: Team[] = (allData as any).seasons[seasonId]?.teams || [];

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
                        League <span className="text-orange-500">Standings</span>
                    </h1>
                    <p className="mt-2 text-zinc-400">
                        Real-time rankings and historical records for all CBT seasons.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold uppercase tracking-widest text-zinc-500">Season</span>
                    <div className="w-[200px]">
                        <div className="flex gap-2">
                            {seasons.map(s => (
                                <Link
                                    key={s.id}
                                    href={`/standings?season=${s.id}`}
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
                </div>
            </div>

            <div className="mb-8 flex items-center justify-between rounded-xl bg-orange-600/10 p-4 border border-orange-500/20">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-orange-400 uppercase tracking-tighter">Current View:</span>
                    <span className="text-lg font-bold text-white">{seasons.find(s => s.id === seasonId)?.label}</span>
                </div>
            </div>

            <StandingsTable teams={teams} seasonId={seasonId} />

            <div className="mt-12 rounded-2xl bg-zinc-900/30 p-8 border border-white/5">
                <h2 className="text-xl font-bold mb-4">Qualification Rules</h2>
                <ul className="grid gap-4 text-sm text-zinc-400 md:grid-cols-2">
                    <li className="flex gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-[10px] font-bold text-orange-500">1</span>
                        Teams must complete all scheduled games to qualify for the playoffs.
                    </li>
                    <li className="flex gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-[10px] font-bold text-orange-500">2</span>
                        Tie-breakers are determined by head-to-head record, then point differential.
                    </li>
                </ul>
            </div>
        </div>
    );
}
