"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import TeamLogo from "./team-logo";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import type { SummaryTeam } from "@/lib/league-summary";
import type { TeamRecordAudit } from "@/lib/season-record-audit";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowUpDown, Flag } from "lucide-react";

interface StandingsTableProps {
    teams: SummaryTeam[];
    seasonId: string;
    recordAudit: Record<string, TeamRecordAudit>;
}

type SortConfig = {
    key: "Team" | "wins" | "loss" | "gamesPlayed" | "winPct";
    direction: "asc" | "desc";
};

type SortableValue = string | number;

function getSortValue(team: SummaryTeam, key: SortConfig["key"]): SortableValue {
    if (key === "winPct") {
        return team.wins / (team.wins + team.loss) || 0;
    }
    return team[key];
}

export default function StandingsTable({ teams, seasonId, recordAudit }: StandingsTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: "winPct",
        direction: "desc"
    });

    const handleSort = (key: SortConfig["key"]) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc"
        }));
    };

    const getWinPct = (t: SummaryTeam) => t.wins / (t.wins + t.loss) || 0;

    const sortedTeams = useMemo(
        () =>
            [...teams].sort((a, b) => {
                const rawA = getSortValue(a, sortConfig.key);
                const rawB = getSortValue(b, sortConfig.key);
                const valA = typeof rawA === "string" ? rawA.toLowerCase() : rawA;
                const valB = typeof rawB === "string" ? rawB.toLowerCase() : rawB;

                if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
                if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            }),
        [sortConfig.direction, sortConfig.key, teams]
    );

    const renderSortButton = (key: SortConfig["key"], label: string, align: "left" | "center" | "right" = "left") => {
        const isActive = sortConfig.key === key;
        const justificationClass =
            align === "center"
                ? "justify-center"
                : align === "right"
                    ? "justify-end"
                    : "justify-start";

        return (
            <button
                type="button"
                onClick={() => handleSort(key)}
                className={cn(
                    "flex w-full items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors hover:text-white",
                    justificationClass,
                    isActive ? "text-white" : "text-zinc-500"
                )}
                aria-label={`Sort standings by ${label}`}
                aria-pressed={isActive}
            >
                <span>{label}</span>
                <ArrowUpDown className="h-3 w-3" />
            </button>
        );
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50 backdrop-blur-sm">
            <Table>
                <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="w-16 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">Rank</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider">
                            {renderSortButton("Team", "Team")}
                        </TableHead>
                        <TableHead className="text-center text-xs font-bold uppercase tracking-wider">
                            {renderSortButton("wins", "W", "center")}
                        </TableHead>
                        <TableHead className="text-center text-xs font-bold uppercase tracking-wider">
                            {renderSortButton("loss", "L", "center")}
                        </TableHead>
                        <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-zinc-500">GP</TableHead>
                        <TableHead className="text-right text-xs font-bold uppercase tracking-wider">
                            {renderSortButton("winPct", "Win %", "right")}
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedTeams.map((team, index) => {
                        const winPct = getWinPct(team).toFixed(3);
                        const rank = index + 1;
                        const audit = recordAudit[team.Team];

                        return (
                            <TableRow key={team.Team} className="border-white/5 hover:bg-white/5 transition-colors group">
                                <TableCell className="text-center">
                                    <span className={cn(
                                        "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                                        rank === 1 ? "bg-orange-500/20 text-orange-500" :
                                            rank === 2 ? "bg-zinc-500/20 text-zinc-400" :
                                                rank === 3 ? "bg-amber-700/20 text-amber-700" :
                                                    "text-zinc-600"
                                    )}>
                                        {rank}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <Link href={`/teams/${encodeURIComponent(team.Team)}/?season=${seasonId}`} prefetch={false} className="flex items-center gap-3">
                                        <TeamLogo
                                            teamName={team.Team}
                                            size={40}
                                            className="rounded-lg"
                                        />
                                        <div className="min-w-0">
                                            <span className="font-bold text-white group-hover:text-orange-500 transition-colors">
                                                {team.Team}
                                            </span>

                                            {audit && (audit.includesPlayoffsInStoredRecord || audit.hasMismatch) && (
                                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                                    {audit.includesPlayoffsInStoredRecord && (
                                                        <span
                                                            className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300"
                                                            title={audit.notes.join(" ")}
                                                        >
                                                            <Flag className="h-3 w-3" />
                                                            Includes Playoffs
                                                        </span>
                                                    )}

                                                    {audit.hasMismatch && (
                                                        <span
                                                            className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-300"
                                                            title={audit.notes.join(" ")}
                                                        >
                                                            <AlertTriangle className="h-3 w-3" />
                                                            Archive Mismatch
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {audit?.includesPlayoffsInStoredRecord && (
                                                <p className="mt-1 text-xs text-zinc-500">
                                                    Schedule split: {audit.regularSeason.wins}-{audit.regularSeason.loss} regular, {audit.playoffs.wins}-{audit.playoffs.loss} playoffs.
                                                </p>
                                            )}

                                            {audit?.hasMismatch && (
                                                <p className="mt-1 text-xs text-zinc-500">
                                                    Archived schedule totals {audit.totalFromSchedule.wins}-{audit.totalFromSchedule.loss}, which does not match the stored record.
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                </TableCell>
                                <TableCell className="text-center font-medium text-white">{team.wins}</TableCell>
                                <TableCell className="text-center font-medium text-white">{team.loss}</TableCell>
                                <TableCell className="text-center text-zinc-500">{team.gamesPlayed}</TableCell>
                                <TableCell className="text-right font-mono font-bold text-orange-500">
                                    {winPct}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
