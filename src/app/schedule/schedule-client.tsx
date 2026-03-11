"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import SeasonToggle from "@/components/league/season-toggle";
import { getScheduleSections, getSeasonId, getSeasonLabel, getSeasonSchedule, SEASON_OPTIONS } from "@/lib/league-summary";

function getScoreTone(score: string | number | undefined, opponentScore: string | number | undefined) {
    const current = Number(score);
    const opponent = Number(opponentScore);

    if (!Number.isFinite(current) || !Number.isFinite(opponent)) {
        return "text-zinc-400";
    }

    if (current > opponent) {
        return "text-orange-500";
    }

    if (current < opponent) {
        return "text-zinc-400";
    }

    return "text-white";
}

function TeamNameDisplay({
    href,
    label,
    isLink,
}: {
    href: string;
    label: string | undefined;
    isLink: boolean;
}) {
    if (!isLink) {
        return <span className="line-clamp-1 text-lg font-bold text-white">{label}</span>;
    }

    return (
        <Link
            href={href}
            prefetch={false}
            className="line-clamp-1 text-lg font-bold text-white transition-colors hover:text-orange-500"
        >
            {label}
        </Link>
    );
}

export default function ScheduleClient() {
    const searchParams = useSearchParams();
    const seasonId = getSeasonId(searchParams.get("season"));

    const schedule = React.useMemo(() => getSeasonSchedule(seasonId), [seasonId]);
    const scheduleSections = React.useMemo(() => getScheduleSections(schedule), [schedule]);
    const seasonLabel = getSeasonLabel(seasonId);

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

                <SeasonToggle
                    seasonId={seasonId}
                    options={SEASON_OPTIONS}
                    hrefForSeason={(id) => `/schedule/?season=${id}`}
                />
            </div>

            <div className="mb-8 flex items-center justify-between rounded-xl bg-orange-600/10 p-4 border border-orange-500/20">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-orange-400 uppercase tracking-tighter">Current View:</span>
                    <span className="text-lg font-bold text-white">{seasonLabel}</span>
                </div>
            </div>

            <div className="space-y-16">
                {scheduleSections.map((section) => (
                    <section key={section.id} className="space-y-8">
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.25em] text-zinc-500">
                                        Schedule Section
                                    </p>
                                    <h2 className="text-3xl font-black text-white">{section.title}</h2>
                                </div>
                                <p className="max-w-2xl text-sm text-zinc-400">{section.description}</p>
                            </div>
                        </div>

                        <div className="space-y-12">
                            {section.weeks.map(({ week, games }) => (
                                <div
                                    key={`${section.id}-${week}`}
                                    id={week.toLowerCase().replace(/\s+/g, '-')}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <h3 className="shrink-0 text-2xl font-bold text-white">{week}</h3>
                                        <div className="h-px w-full bg-white/10" />
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {games.map((game, i) => {
                                            const shouldLinkTeams = section.id !== "special";

                                            return (
                                            <div
                                                key={`${section.id}-${week}-${game.homeTeam ?? game.byeTeam ?? "bye"}-${i}`}
                                                className={cn(
                                                    "relative overflow-hidden rounded-2xl border p-6 transition-all",
                                                    section.id === "playoffs"
                                                        ? "border-orange-500/30 bg-orange-500/5"
                                                        : section.id === "special"
                                                          ? "border-sky-500/25 bg-sky-500/5"
                                                          : "border-white/5 bg-zinc-900/50"
                                                )}
                                            >
                                                {game.isBye ? (
                                                    <div className="flex flex-col items-center justify-center py-4 text-center">
                                                        <span className="mb-1 text-xs font-bold uppercase tracking-widest text-zinc-500">Bye Week</span>
                                                        <p className="text-xl font-bold text-white">{game.byeTeam}</p>
                                                        <p className="mt-2 text-sm text-zinc-500">{game.date}</p>
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
                                                                <TeamNameDisplay
                                                                    href={`/teams/${encodeURIComponent(game.homeTeam || "")}/?season=${seasonId}`}
                                                                    label={game.homeTeam}
                                                                    isLink={shouldLinkTeams}
                                                                />
                                                            </div>
                                                            <div className="flex flex-col items-center">
                                                                <span className={cn("text-2xl font-black", getScoreTone(game.homeScore, game.awayScore))}>
                                                                    {game.homeScore || "—"}
                                                                </span>
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
                                                                <TeamNameDisplay
                                                                    href={`/teams/${encodeURIComponent(game.awayTeam || "")}/?season=${seasonId}`}
                                                                    label={game.awayTeam}
                                                                    isLink={shouldLinkTeams}
                                                                />
                                                            </div>
                                                            <div className="flex flex-col items-center">
                                                                <span className={cn("text-2xl font-black", getScoreTone(game.awayScore, game.homeScore))}>
                                                                    {game.awayScore || "—"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {section.id === "playoffs" && (
                                                            <div className="absolute top-0 right-0 rounded-bl-lg bg-orange-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                                                PLAYOFFS
                                                            </div>
                                                        )}

                                                        {section.id === "special" && (
                                                            <div className="absolute top-0 right-0 rounded-bl-lg bg-sky-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                                                EVENT
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
