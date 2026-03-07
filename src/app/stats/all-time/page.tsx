import { Metadata } from "next";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Trophy, Star, ArrowRight } from "lucide-react";
import { aggregatePlayerStats, getLeagueData } from "@/lib/league-data";
import type { BaseStats } from "@/types/league";

export const metadata: Metadata = {
  title: "All-Time Records | CBT League",
  description: "Historical career records and all-time leaders in the CBT basketball league.",
};

const BASE_STATS_TEMPLATE: BaseStats = {
  Points: 0,
  FieldGoalsMade: 0,
  FieldGoalAttempts: 0,
  ThreesMade: 0,
  ThreesAttempts: 0,
  FreeThrowsMade: 0,
  FreeThrowsAttempts: 0,
  Rebounds: 0,
  Offrebounds: 0,
  Defrebounds: 0,
  Assists: 0,
  Blocks: 0,
  Steals: 0,
  Turnovers: 0,
  PersonalFouls: 0,
};

const BASE_STAT_KEYS = Object.keys(BASE_STATS_TEMPLATE) as Array<keyof BaseStats>;

type TotalKey = "Points" | "Rebounds" | "Assists" | "Steals" | "Blocks";
type AverageKey = TotalKey | "EFF";

type Totals = Record<TotalKey, number>;
type Averages = Record<AverageKey, number>;

type CareerAccumulator = {
  stats: BaseStats;
  gp: number;
  teams: Set<string>;
};

type CareerRecord = {
  name: string;
  data: CareerAccumulator;
  totals: Totals;
  averages: Averages;
};

type LeaderCategory =
  | {
      key: TotalKey;
      label: string;
      icon: typeof Trophy;
      isAvg: false;
      color: string;
    }
  | {
      key: AverageKey;
      label: string;
      icon: typeof Star;
      isAvg: true;
      color: string;
    };

function createBaseStats(): BaseStats {
  return { ...BASE_STATS_TEMPLATE };
}

function getAllTimeStats(): Record<string, CareerAccumulator> {
  const leagueData = getLeagueData();
  const playerCareer = new Map<string, CareerAccumulator>();

  for (const seasonData of Object.values(leagueData.seasons)) {
    for (const team of seasonData.teams) {
      for (const player of team.roster) {
        const existing = playerCareer.get(player.name) ?? {
          stats: createBaseStats(),
          gp: 0,
          teams: new Set<string>(),
        };

        const aggregated = aggregatePlayerStats(player);
        for (const key of BASE_STAT_KEYS) {
          existing.stats[key] += aggregated[key];
        }

        existing.gp += aggregated.GAMES;
        existing.teams.add(team.Team);

        playerCareer.set(player.name, existing);
      }
    }
  }

  return Object.fromEntries(playerCareer.entries());
}

function buildCareerRecords(records: Record<string, CareerAccumulator>): CareerRecord[] {
  return Object.entries(records).map(([name, data]) => {
    const stats = data.stats;
    const gp = data.gp || 1;
    const missedFG = Math.max(0, stats.FieldGoalAttempts - stats.FieldGoalsMade);
    const missedFT = Math.max(0, stats.FreeThrowsAttempts - stats.FreeThrowsMade);
    const totalEff =
      stats.Points +
      stats.Rebounds +
      stats.Assists +
      stats.Steals +
      stats.Blocks -
      missedFG -
      missedFT -
      stats.Turnovers;

    return {
      name,
      data,
      totals: {
        Points: stats.Points,
        Rebounds: stats.Rebounds,
        Assists: stats.Assists,
        Steals: stats.Steals,
        Blocks: stats.Blocks,
      },
      averages: {
        Points: stats.Points / gp,
        Rebounds: stats.Rebounds / gp,
        Assists: stats.Assists / gp,
        Steals: stats.Steals / gp,
        Blocks: stats.Blocks / gp,
        EFF: totalEff / gp,
      },
    };
  });
}

function getTop5(records: CareerRecord[], category: LeaderCategory): CareerRecord[] {
  const filtered = category.isAvg ? records.filter((record) => record.data.gp >= 5) : records;

  return filtered
    .toSorted((a, b) => {
      const valA = category.isAvg ? a.averages[category.key] : a.totals[category.key];
      const valB = category.isAvg ? b.averages[category.key] : b.totals[category.key];
      return valB - valA;
    })
    .slice(0, 5);
}

export default function AllTimePage() {
  const records = getAllTimeStats();
  const validRecords = buildCareerRecords(records);

  const categories: LeaderCategory[] = [
    { key: "Points", label: "Total Points", icon: Trophy, isAvg: false, color: "text-orange-500" },
    { key: "Rebounds", label: "Total Rebounds", icon: Trophy, isAvg: false, color: "text-blue-500" },
    { key: "Assists", label: "Total Assists", icon: Trophy, isAvg: false, color: "text-green-500" },
    { key: "Steals", label: "Total Steals", icon: Trophy, isAvg: false, color: "text-purple-500" },
    { key: "Blocks", label: "Total Blocks", icon: Trophy, isAvg: false, color: "text-amber-500" },
    { key: "EFF", label: "Career Efficiency", icon: Star, isAvg: true, color: "text-pink-500" },
    { key: "Points", label: "Career PPG (Min. 5 GP)", icon: Star, isAvg: true, color: "text-orange-500" },
    { key: "Rebounds", label: "Career RPG (Min. 5 GP)", icon: Star, isAvg: true, color: "text-blue-500" },
    { key: "Assists", label: "Career APG (Min. 5 GP)", icon: Star, isAvg: true, color: "text-green-500" },
    { key: "Steals", label: "Career SPG (Min. 5 GP)", icon: Star, isAvg: true, color: "text-purple-500" },
    { key: "Blocks", label: "Career BPG (Min. 5 GP)", icon: Star, isAvg: true, color: "text-amber-500" },
  ];

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-6xl uppercase italic">
          All-Time <span className="text-orange-500">Records</span>
        </h1>
        <p className="mt-4 text-zinc-400 text-lg max-w-2xl">
          Celebrating the legends and historical milestones achieved since the league&apos;s inception in 2023.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        {categories.map((category, idx) => {
          const top5 = getTop5(validRecords, category);
          const Icon = category.icon;

          return (
            <div key={category.label + idx} className="space-y-8">
              <div className="flex items-center gap-4">
                <Icon className={cn("h-6 w-6", category.color)} />
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">{category.label}</h2>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="space-y-4">
                {top5.map((player, i) => (
                  <Link
                    key={player.name}
                    href={`/players/${encodeURIComponent(player.name)}/`}
                    prefetch={false}
                    className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-zinc-900/40 p-4 transition-all hover:bg-zinc-900"
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black italic shadow-inner",
                        i === 0
                          ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white"
                          : i === 1
                            ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white"
                            : i === 2
                              ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white"
                              : "bg-zinc-800 text-zinc-500"
                      )}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white group-hover:text-orange-500 transition-colors uppercase tracking-tight">
                        {player.name}
                      </h3>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                        {Array.from(player.data.teams).join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-2xl font-black italic", category.color)}>
                        {category.isAvg
                          ? player.averages[category.key].toFixed(1)
                          : player.totals[category.key]}
                      </p>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase">{player.data.gp} Games</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-24 rounded-3xl bg-gradient-to-r from-zinc-900 to-black border border-white/5 p-12 text-center">
        <Trophy className="mx-auto h-12 w-12 text-orange-500 mb-6" />
        <h2 className="text-3xl font-bold text-white mb-4">Want to see more records?</h2>
        <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
          Explore the detailed season-by-season breakdown in our expanded league leaders section.
        </p>
        <Link
          href="/stats/leaders/"
          prefetch={false}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-8 py-4 font-bold text-white hover:bg-orange-700 transition-all"
        >
          LEAGUE LEADERS <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
