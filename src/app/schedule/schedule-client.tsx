"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { GameEntry } from "@/types/league";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import allData from "@/data/data.json";

function getSchedules(seasonId: string): GameEntry[] {
    return (allData as any).seasons[seasonId]?.schedule || [];
}

export default function ScheduleClient() {
    const searchParams = useSearchParams();
    const seasonId = searchParams.get("season") || "3";
    const schedule = getSchedules(seasonId);

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
                        Game <span className="text-orange-500">Schedule</span>
                    </h1>
                    <p className="mt-2 text-zinc-400">
                        Chronological list of all matchups, scores, and tournament brackets.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold uppercase tracking-widest text-zinc-500">Season</span>
                    <div className="flex gap-2">
                        {seasons.map(s => (
                            <Link
                                key={s.id}
                                href={`/schedule?season=${s.id}`}
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

            <div className="mb-8 flex items-center justify-between rounded-xl bg-orange-600/10 p-4 border border-orange-500/20">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-orange-400 uppercase tracking-tighter">Current View:</span>
                    <span className="text-lg font-bold text-white">{seasons.find(s => s.id === seasonId)?.label}</span>
                </div>
            </div>

            <div className="space-y-12">
                {/* We'll group by Week/Playoffs */}
                {Array.from(new Set(schedule.map(g => g.week))).map(week => (
                    <div
                        key={week}
                        id={week.toLowerCase().replace(/\s+/g, '-')}
                        className="space-y-4"
                    >
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold text-white shrink-0">{week}</h2>
                            <div className="h-px w-full bg-white/10" />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {schedule.filter(g => g.week === week).map((game, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "relative overflow-hidden rounded-2xl border p-6 transition-all",
                                        game.isPlayoff
                                            ? "border-orange-500/30 bg-orange-500/5"
                                            : "border-white/5 bg-zinc-900/50"
                                    )}
                                >
                                    {game.isBye ? (
                                        <div className="flex flex-col items-center justify-center py-4 text-center">
                                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Bye Week</span>
                                            <p className="text-xl font-bold text-white">{game.byeTeam}</p>
                                            <p className="text-sm text-zinc-500 mt-2">{game.date}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                                                <div className="flex items-center gap-1">
                                                    <CalendarIcon className="h-3 w-3" />
                                                    {game.date}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {game.time}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1 space-y-1">
                                                    <p className="text-sm font-medium text-zinc-500">Home</p>
                                                    <Link
                                                        href={`/teams/${encodeURIComponent(game.homeTeam || "")}?season=${seasonId}`}
                                                        className="text-lg font-bold text-white line-clamp-1 hover:text-orange-500 transition-colors"
                                                    >
                                                        {game.homeTeam}
                                                    </Link>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-2xl font-black text-orange-500">{game.homeScore || "—"}</span>
                                                </div>
                                            </div>

                                            <div className="my-4 flex items-center gap-3">
                                                <div className="h-px flex-1 bg-white/5" />
                                                <span className="text-[10px] font-black text-zinc-700">VS</span>
                                                <div className="h-px flex-1 bg-white/5" />
                                            </div>

                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1 space-y-1">
                                                    <p className="text-sm font-medium text-zinc-500">Away</p>
                                                    <Link
                                                        href={`/teams/${encodeURIComponent(game.awayTeam || "")}?season=${seasonId}`}
                                                        className="text-lg font-bold text-white line-clamp-1 hover:text-orange-500 transition-colors"
                                                    >
                                                        {game.awayTeam}
                                                    </Link>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-2xl font-black text-zinc-400">{game.awayScore || "—"}</span>
                                                </div>
                                            </div>

                                            {game.isPlayoff && (
                                                <div className="absolute top-0 right-0 rounded-bl-lg bg-orange-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                                    PLAYOFFS
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
