"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import SeasonToggle from "@/components/league/season-toggle";
import PlayerHead from "@/components/league/player-head";
import {
  getSeasonId,
  getSeasonPlayersWithAggregates,
  getTopPlayersByStat,
  type LeaderStatKey,
  SEASON_OPTIONS,
} from "@/lib/league-summary";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
};

const leaderCategories: Array<{
  group: string;
  items: Array<{ key: LeaderStatKey; label: string; color: string }>;
}> = [
  {
    group: "Scoring & Performance",
    items: [
      { key: "PPG", label: "Points Per Game", color: "from-copper-500 to-copper-700" },
      { key: "Points", label: "Total Points", color: "from-copper-600 to-copper-800" },
      { key: "EFF", label: "Efficiency Rating", color: "from-pink-500 to-pink-700" },
    ],
  },
  {
    group: "Shooting Efficiency",
    items: [
      { key: "FG%", label: "Field Goal %", color: "from-red-500 to-red-700" },
      { key: "2P%", label: "2-Point %", color: "from-red-600 to-red-800" },
      { key: "3P%", label: "3-Point %", color: "from-copper-500 to-copper-700" },
      { key: "FT%", label: "Free Throw %", color: "from-copper-600 to-copper-800" },
    ],
  },
  {
    group: "Glass & Rebounding",
    items: [
      { key: "RPG", label: "Rebounds Per Game", color: "from-blue-500 to-blue-700" },
      { key: "Offrebounds", label: "Offensive", color: "from-cyan-500 to-cyan-700" },
      { key: "Defrebounds", label: "Defensive", color: "from-indigo-500 to-indigo-700" },
    ],
  },
  {
    group: "Playmaking & Control",
    items: [
      { key: "APG", label: "Assists Per Game", color: "from-green-500 to-green-700" },
      { key: "Assists", label: "Total Assists", color: "from-green-600 to-green-800" },
      { key: "TOVPG", label: "Turnovers / G", color: "from-zinc-500 to-zinc-700" },
    ],
  },
  {
    group: "Defense & Hustle",
    items: [
      { key: "SPG", label: "Steals Per Game", color: "from-purple-500 to-purple-700" },
      { key: "BPG", label: "Blocks Per Game", color: "from-amber-500 to-amber-700" },
      { key: "PersonalFouls", label: "Total Fouls", color: "from-red-500 to-red-700" },
    ],
  },
];

export default function LeadersClient() {
  const searchParams = useSearchParams();
  const seasonId = getSeasonId(searchParams.get("season"));

  const players = React.useMemo(() => getSeasonPlayersWithAggregates(seasonId), [seasonId]);
  const topPlayersByCategory = React.useMemo(() => {
    const categoryMap = new Map<LeaderStatKey, ReturnType<typeof getTopPlayersByStat>>();

    for (const group of leaderCategories) {
      for (const item of group.items) {
        if (!categoryMap.has(item.key)) {
          categoryMap.set(item.key, getTopPlayersByStat(players, item.key));
        }
      }
    }

    return categoryMap;
  }, [players]);

  return (
    <div className="container mx-auto px-4 py-24 md:px-6">
      <div className="mb-16 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
        <div className="space-y-4">
          <h1 className="text-5xl font-black tracking-tighter text-white md:text-7xl uppercase italic leading-none">
            League <span className="text-copper-500">Leaders</span>
          </h1>
          <p className="max-w-[500px] text-zinc-500 font-medium">
            Real-time statistical dominance. The elite performers defining the current CBT generation.
          </p>
        </div>

        <SeasonToggle
          seasonId={seasonId}
          options={SEASON_OPTIONS}
          hrefForSeason={(id) => `/stats/leaders/?season=${id}`}
        />
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-32">
        {leaderCategories.map((group) => (
          <motion.div key={group.group} variants={itemVariants} className="space-y-12">
            <div className="flex items-center gap-6">
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{group.group}</h2>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            </div>

            <div className="grid gap-12 lg:grid-cols-2 xl:grid-cols-3">
              {group.items.map((category) => {
                const topPlayers = topPlayersByCategory.get(category.key) ?? [];

                return (
                  <div key={category.key} className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <h3 className="text-sm font-black text-zinc-600 uppercase tracking-[0.2em]">{category.label}</h3>
                      <div className="h-1.5 w-1.5 rounded-full bg-copper-500" />
                    </div>

                    <div className="space-y-2">
                      {topPlayers.map((entry, i) => (
                        <Link
                          key={`${entry.player.name}-${category.key}-${i}`}
                          href={`/players/${encodeURIComponent(entry.player.name.trim())}/`}
                          prefetch={false}
                          className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/5 bg-zinc-950 p-4 transition-all hover:bg-zinc-900 active:scale-[0.98] shadow-sm hover:shadow-xl hover:border-white/10"
                        >
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-black italic transition-all",
                              i === 0
                                ? "bg-copper-600 text-white shadow-lg shadow-copper-600/20"
                                : "bg-white/5 text-zinc-700 group-hover:text-zinc-500"
                            )}
                          >
                            {i + 1}
                          </div>

                          <PlayerHead
                            playerName={entry.player.name}
                            playerHead={entry.player.PlayerHead}
                            size={40}
                            className="rounded-lg shrink-0"
                          />

                          <div className="flex-1 overflow-hidden">
                            <h3 className="font-bold text-white group-hover:text-copper-500 transition-colors uppercase tracking-tight text-sm truncate">
                              {entry.player.name}
                            </h3>
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest truncate">{entry.teamName}</p>
                          </div>

                          <div className="text-right">
                            <span
                              className={cn(
                                "text-2xl font-black italic tracking-tighter font-mono",
                                i === 0 ? "text-copper-500" : "text-white"
                              )}
                            >
                              {entry.aggregated[category.key]}
                              <span className="text-[10px] ml-0.5 not-italic font-sans opacity-50 uppercase">
                                {category.key.includes("%") ? "%" : ""}
                              </span>
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
