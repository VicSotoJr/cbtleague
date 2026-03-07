"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import TeamLogo from "@/components/league/team-logo";
import { cn } from "@/lib/utils";
import { getSeasonId, getSeasonTeams, SEASON_OPTIONS } from "@/lib/league-data";

import { motion } from "framer-motion";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: "spring" as const, stiffness: 100, damping: 20 }
    }
};

export default function TeamsClient() {
    const searchParams = useSearchParams();
    const seasonId = getSeasonId(searchParams.get("season"));
    const teams = React.useMemo(() => getSeasonTeams(seasonId), [seasonId]);

    return (
        <div className="container mx-auto px-4 py-24 md:px-6">
            <div className="mb-12 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-white md:text-6xl uppercase italic leading-none">
                        League <span className="text-orange-500">Teams</span>
                    </h1>
                    <p className="mt-4 text-zinc-500 font-medium max-w-lg">
                        Explore the rosters and achievements of every team across the CBT history.
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                    <span className="pl-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Season</span>
                    <div className="flex gap-1">
                        {SEASON_OPTIONS.map(s => (
                            <Link
                                key={s.id}
                                href={`/teams?season=${s.id}`}
                                className={cn(
                                    "rounded-xl px-5 py-2 text-xs font-black transition-all uppercase tracking-widest",
                                    seasonId === s.id
                                        ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                                        : "text-zinc-500 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {s.id}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
                {teams.map((team) => (
                    <motion.div key={team.Team} variants={itemVariants}>
                        <Link
                            href={`/teams/${encodeURIComponent(team.Team.trim())}?season=${seasonId}`}
                            className="group relative flex flex-col items-center overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-950 p-8 text-center transition-all hover:border-orange-500/30 hover:bg-zinc-900 active:scale-95"
                        >
                            <div className="mb-8 relative">
                                <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />
                                <TeamLogo
                                    teamName={team.Team}
                                    size={140}
                                    className="relative z-10 rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3"
                                />
                            </div>

                            <h3 className="text-2xl font-black text-white group-hover:text-orange-500 transition-colors uppercase italic tracking-tighter">{team.Team}</h3>

                            <div className="mt-4 grid grid-cols-2 w-full gap-4 pt-6 border-t border-white/5">
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Players</p>
                                    <p className="text-lg font-bold text-white leading-none">{team.roster.length}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Record</p>
                                    <p className="text-lg font-bold text-orange-500 leading-none">{team.wins}-{team.loss}</p>
                                </div>
                            </div>

                            <div className="mt-8 flex h-10 w-full items-center justify-center rounded-xl bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:bg-orange-600 group-hover:text-white transition-all">
                                VIEW ROSTER
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
