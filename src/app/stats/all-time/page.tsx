import { Metadata } from "next";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Trophy, Star, ArrowRight } from "lucide-react";
import PlayerHead from "@/components/league/player-head";
import { aggregatePlayerStats, getLeagueData } from "@/lib/league-data";
import { buildPlayerProfileHref } from "@/lib/player-links";
import { shouldHideSeasonPlayerFromDisplay } from "@/lib/player-visibility";
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

type CareerMetricKey =
  | "PPG"
  | "Points"
  | "ThreesMade"
  | "EFF"
  | "FG%"
  | "2P%"
  | "3P%"
  | "FT%"
  | "RPG"
  | "Rebounds"
  | "Offrebounds"
  | "Defrebounds"
  | "APG"
  | "Assists"
  | "TOVPG"
  | "Turnovers"
  | "SPG"
  | "Steals"
  | "BPG"
  | "Blocks";

type CareerMetrics = Record<CareerMetricKey, number>;

type CareerAccumulator = {
  stats: BaseStats;
  gp: number;
  teams: Set<string>;
  playerHead?: string;
};

type CareerRecord = {
  name: string;
  playerHead?: string;
  data: CareerAccumulator;
  metrics: CareerMetrics;
};

type LeaderCategory = {
  key: CareerMetricKey;
  label: string;
  icon: typeof Trophy | typeof Star;
  minimumGames?: number;
  valueType: "total" | "rate";
};

function createBaseStats(): BaseStats {
  return { ...BASE_STATS_TEMPLATE };
}

function getAllTimeStats(): Record<string, CareerAccumulator> {
  const leagueData = getLeagueData();
  const playerCareer = new Map<string, CareerAccumulator>();

  for (const [seasonId, seasonData] of Object.entries(leagueData.seasons)) {
    for (const team of seasonData.teams) {
      for (const player of team.roster) {
        if (shouldHideSeasonPlayerFromDisplay(player.name, seasonId)) {
          continue;
        }

        const existing = playerCareer.get(player.name) ?? {
          stats: createBaseStats(),
          gp: 0,
          teams: new Set<string>(),
          playerHead: "",
        };

        const aggregated = aggregatePlayerStats(player);
        for (const key of BASE_STAT_KEYS) {
          existing.stats[key] += aggregated[key];
        }

        existing.gp += aggregated.GAMES;
        existing.teams.add(team.Team);
        if (!existing.playerHead && player.PlayerHead) {
          existing.playerHead = player.PlayerHead;
        }

        playerCareer.set(player.name, existing);
      }
    }
  }

  return Object.fromEntries(playerCareer.entries());
}

function buildCareerRecords(records: Record<string, CareerAccumulator>): CareerRecord[] {
  return Object.entries(records).map(([name, data]) => {
    const stats = data.stats;
    const gamesPlayed = Math.max(data.gp, 1);
    const missedFG = Math.max(0, stats.FieldGoalAttempts - stats.FieldGoalsMade);
    const missedFT = Math.max(0, stats.FreeThrowsAttempts - stats.FreeThrowsMade);
    const twoPM = Math.max(0, stats.FieldGoalsMade - stats.ThreesMade);
    const twoPA = Math.max(0, stats.FieldGoalAttempts - stats.ThreesAttempts);
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
      playerHead: data.playerHead,
      data,
      metrics: {
        PPG: stats.Points / gamesPlayed,
        Points: stats.Points,
        ThreesMade: stats.ThreesMade,
        EFF: totalEff / gamesPlayed,
        "FG%": (stats.FieldGoalsMade / Math.max(stats.FieldGoalAttempts, 1)) * 100,
        "2P%": (twoPM / Math.max(twoPA, 1)) * 100,
        "3P%": (stats.ThreesMade / Math.max(stats.ThreesAttempts, 1)) * 100,
        "FT%": (stats.FreeThrowsMade / Math.max(stats.FreeThrowsAttempts, 1)) * 100,
        RPG: stats.Rebounds / gamesPlayed,
        Rebounds: stats.Rebounds,
        Offrebounds: stats.Offrebounds,
        Defrebounds: stats.Defrebounds,
        APG: stats.Assists / gamesPlayed,
        Assists: stats.Assists,
        TOVPG: stats.Turnovers / gamesPlayed,
        Turnovers: stats.Turnovers,
        SPG: stats.Steals / gamesPlayed,
        Steals: stats.Steals,
        BPG: stats.Blocks / gamesPlayed,
        Blocks: stats.Blocks,
      },
    };
  });
}

function getTop5(records: CareerRecord[], category: LeaderCategory): CareerRecord[] {
  const minimumGames = category.minimumGames;
  const filtered = minimumGames
    ? records.filter((record) => record.data.gp >= minimumGames)
    : records;

  return filtered
    .toSorted((a, b) => b.metrics[category.key] - a.metrics[category.key])
    .slice(0, 5);
}

export default function AllTimePage() {
  const records = getAllTimeStats();
  const validRecords = buildCareerRecords(records);

  const categories: LeaderCategory[] = [
    { key: "Points", label: "Total Points", icon: Trophy, valueType: "total" },
    { key: "ThreesMade", label: "3PM", icon: Trophy, valueType: "total" },
    { key: "Rebounds", label: "Total Rebounds", icon: Trophy, valueType: "total" },
    { key: "Offrebounds", label: "Offensive Rebounds", icon: Trophy, valueType: "total" },
    { key: "Defrebounds", label: "Defensive Rebounds", icon: Trophy, valueType: "total" },
    { key: "Assists", label: "Total Assists", icon: Trophy, valueType: "total" },
    { key: "Turnovers", label: "Total Turnovers", icon: Trophy, valueType: "total" },
    { key: "Steals", label: "Total Steals", icon: Trophy, valueType: "total" },
    { key: "Blocks", label: "Total Blocks", icon: Trophy, valueType: "total" },
    { key: "PPG", label: "Career PPG (Min. 5 GP)", icon: Star, minimumGames: 5, valueType: "rate" },
    { key: "EFF", label: "Career Efficiency (Min. 5 GP)", icon: Star, minimumGames: 5, valueType: "rate" },
    { key: "FG%", label: "Career FG% (Min. 5 GP)", icon: Star, minimumGames: 5, valueType: "rate" },
    { key: "2P%", label: "Career 2P% (Min. 5 GP)", icon: Star, minimumGames: 5, valueType: "rate" },
    { key: "3P%", label: "Career 3P% (Min. 5 GP)", icon: Star, minimumGames: 5, valueType: "rate" },
    { key: "FT%", label: "Career FT% (Min. 5 GP)", icon: Star, minimumGames: 5, valueType: "rate" },
    { key: "RPG", label: "Career RPG (Min. 5 GP)", icon: Star, minimumGames: 5, valueType: "rate" },
    { key: "APG", label: "Career APG (Min. 5 GP)", icon: Star, minimumGames: 5, valueType: "rate" },
    { key: "TOVPG", label: "Career TOVPG (Min. 5 GP)", icon: Star, minimumGames: 5, valueType: "rate" },
    { key: "SPG", label: "Career SPG (Min. 5 GP)", icon: Star, minimumGames: 5, valueType: "rate" },
    { key: "BPG", label: "Career BPG (Min. 5 GP)", icon: Star, minimumGames: 5, valueType: "rate" },
  ];

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-6xl uppercase italic">
          All-Time <span className="text-copper-500">Records</span>
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
                <Icon className="h-6 w-6 text-zinc-400" />
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">{category.label}</h2>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="space-y-4">
                {top5.map((player, i) => (
                  <Link
                    key={player.name}
                    href={buildPlayerProfileHref(player.name, { returnTo: "/stats/all-time/" })}
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
                    <PlayerHead
                      playerName={player.name}
                      playerHead={player.playerHead}
                      size={40}
                      className="rounded-lg shrink-0"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-white group-hover:text-copper-500 transition-colors uppercase tracking-tight">
                        {player.name}
                      </h3>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                        {Array.from(player.data.teams).join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black italic text-white">
                        {category.valueType === "rate"
                          ? player.metrics[category.key].toFixed(1)
                          : player.metrics[category.key]}
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
        <Trophy className="mx-auto h-12 w-12 text-copper-500 mb-6" />
        <h2 className="text-3xl font-bold text-white mb-4">Want to see more records?</h2>
        <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
          Explore the detailed season-by-season breakdown in our expanded league leaders section.
        </p>
        <Link
          href="/stats/leaders/"
          prefetch={false}
          className="inline-flex items-center gap-2 rounded-xl bg-copper-600 px-8 py-4 font-bold text-white hover:bg-copper-700 transition-all"
        >
          LEAGUE LEADERS <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
