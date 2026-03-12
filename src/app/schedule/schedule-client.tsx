"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import SeasonToggle from "@/components/league/season-toggle";
import {
    getScheduleSections,
    getSeasonId,
    getSeasonLabel,
    getSeasonSchedule,
    getSeasonTeams,
    type ScheduleSection,
    SEASON_OPTIONS,
} from "@/lib/league-summary";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const ALL_TEAMS_VALUE = "__all_teams__";

function getScoreTone(score: string | number | undefined, opponentScore: string | number | undefined) {
    const current = Number(score);
    const opponent = Number(opponentScore);

    if (!Number.isFinite(current) || !Number.isFinite(opponent)) {
        return "text-zinc-400";
    }

    if (current > opponent) {
        return "text-copper-500";
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
            className="line-clamp-1 text-lg font-bold text-white transition-colors hover:text-copper-500"
        >
            {label}
        </Link>
    );
}

function getSelectedTeam(teamName: string | null, availableTeams: string[]) {
    if (!teamName) {
        return null;
    }

    return availableTeams.includes(teamName) ? teamName : null;
}

function filterScheduleSectionsByTeam(scheduleSections: ScheduleSection[], selectedTeam: string | null): ScheduleSection[] {
    if (!selectedTeam) {
        return scheduleSections;
    }

    return scheduleSections.flatMap((section) => {
        const filteredWeeks = section.weeks.flatMap(({ week, games }) => {
            const filteredGames = games.filter(
                (game) =>
                    game.byeTeam === selectedTeam ||
                    game.homeTeam === selectedTeam ||
                    game.awayTeam === selectedTeam
            );

            return filteredGames.length > 0 ? [{ week, games: filteredGames }] : [];
        });

        return filteredWeeks.length > 0 ? [{ ...section, weeks: filteredWeeks }] : [];
    });
}

export default function ScheduleClient() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = React.useTransition();
    const seasonId = getSeasonId(searchParams.get("season"));
    const rawSelectedTeam = searchParams.get("team");

    const teams = React.useMemo(() => getSeasonTeams(seasonId), [seasonId]);
    const teamNames = React.useMemo(() => teams.map((team) => team.Team).filter(Boolean), [teams]);
    const schedule = React.useMemo(() => getSeasonSchedule(seasonId), [seasonId]);
    const scheduleSections = React.useMemo(() => getScheduleSections(schedule), [schedule]);
    const selectedTeam = React.useMemo(
        () => getSelectedTeam(rawSelectedTeam, teamNames),
        [rawSelectedTeam, teamNames]
    );
    const filteredScheduleSections = React.useMemo(
        () => filterScheduleSectionsByTeam(scheduleSections, selectedTeam),
        [scheduleSections, selectedTeam]
    );
    const seasonLabel = getSeasonLabel(seasonId);

    function buildScheduleHref(nextSeasonId: string) {
        const params = new URLSearchParams({ season: nextSeasonId });

        if (selectedTeam && getSeasonTeams(nextSeasonId).some((team) => team.Team === selectedTeam)) {
            params.set("team", selectedTeam);
        }

        return `/schedule/?${params.toString()}`;
    }

    function handleTeamChange(value: string) {
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());

            if (value === ALL_TEAMS_VALUE) {
                params.delete("team");
            } else {
                params.set("team", value);
            }

            params.set("season", seasonId);
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        });
    }

    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                        Game <span className="text-copper-500">Schedule</span>
                    </h1>
                    <p className="mt-2 text-zinc-400">
                        Chronological list of all matchups, scores, and tournament brackets.
                    </p>
                </div>

                <SeasonToggle
                    seasonId={seasonId}
                    options={SEASON_OPTIONS}
                    hrefForSeason={buildScheduleHref}
                />
            </div>

            <div className="mb-8 flex items-center justify-between rounded-xl border border-copper-500/20 bg-copper-600/10 p-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold uppercase tracking-tighter text-copper-400">Current View:</span>
                    <span className="text-lg font-bold text-white">{seasonLabel}</span>
                </div>
            </div>

            <div className="space-y-16">
                {filteredScheduleSections.length > 0 ? (
                    filteredScheduleSections.map((section) => (
                        <section key={section.id} className="space-y-8">
                            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.25em] text-zinc-500">
                                            Schedule Section
                                        </p>
                                        <h2 className="text-3xl font-black text-white">{section.title}</h2>
                                    </div>

                                    <div className="flex flex-col gap-3 lg:items-end">
                                        <Select value={selectedTeam ?? ALL_TEAMS_VALUE} onValueChange={handleTeamChange}>
                                            <SelectTrigger
                                                className={cn(
                                                    "h-11 w-full min-w-[220px] rounded-xl border-white/10 bg-white/5 px-4 text-left text-white shadow-none hover:bg-white/10 lg:w-[240px]",
                                                    isPending && "opacity-70"
                                                )}
                                            >
                                                <SelectValue placeholder="All teams" />
                                            </SelectTrigger>
                                            <SelectContent className="border-white/10 bg-zinc-950 text-white">
                                                <SelectItem value={ALL_TEAMS_VALUE}>All teams</SelectItem>
                                                {teamNames.map((teamName) => (
                                                    <SelectItem key={teamName} value={teamName}>
                                                        {teamName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <p className="max-w-2xl text-sm text-zinc-400 lg:text-right">{section.description}</p>
                                    </div>
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
                                                                ? "border-copper-500/30 bg-copper-500/5"
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
                                                                    <div className="absolute top-0 right-0 rounded-bl-lg bg-copper-600 px-2 py-0.5 text-[10px] font-bold text-white">
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
                    ))
                ) : (
                    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-10 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                            No Schedule Entries
                        </p>
                        <h2 className="mt-3 text-3xl font-black text-white">No games found for this team</h2>
                        <p className="mt-3 text-zinc-400">
                            Try switching seasons or choose a different team from the dropdown to view another schedule.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
