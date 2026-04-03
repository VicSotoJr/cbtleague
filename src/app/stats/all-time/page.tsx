import { Metadata } from "next";
import { aggregatePlayerStats, getLeagueData } from "@/lib/league-data";
import AllTimeRecordsClient from "@/app/stats/all-time/all-time-records-client";
import { buildPlayerProfileHref } from "@/lib/player-links";
import { shouldHideSeasonPlayerFromDisplay } from "@/lib/player-visibility";
import type { BaseStats, PlayerStat } from "@/types/league";

export const metadata: Metadata = {
  title: "All-Time Records | CBT League",
  description: "Historical career records, all-time leaders, and single-game highs in the CBT basketball league.",
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
  | "DoubleDoubles"
  | "TripleDoubles"
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
  doubleDoubles: number;
  tripleDoubles: number;
  teams: Set<string>;
  playerHead?: string;
};

type CareerRecord = {
  name: string;
  playerHead?: string;
  data: CareerAccumulator;
  metrics: CareerMetrics;
};

type MinimumAttempts =
  | { stat: keyof BaseStats; value: number }
  | { computed: "totalFGA"; value: number };

type LeaderCategory = {
  key: CareerMetricKey;
  label: string;
  icon: "trophy" | "star";
  minimumGames?: number;
  minimumAttempts?: { stat: keyof BaseStats; value: number };
  valueType: "total" | "rate";
};

type GameHighMetricKey =
  | "Points"
  | "Rebounds"
  | "Assists"
  | "Steals"
  | "Blocks"
  | "ThreesMade"
  | "Turnovers"
  | "FieldGoalsMade"
  | "FieldGoalAttempts"
  | "ThreesAttempts"
  | "FreeThrowsMade"
  | "FreeThrowsAttempts"
  | "EFF";

type GameHighMetrics = Record<GameHighMetricKey, number>;

type GameHighRecord = {
  name: string;
  playerHead?: string;
  teamName: string;
  seasonLabel: string;
  opponent: string;
  gameLabel: string;
  metrics: GameHighMetrics;
};

type GameHighCategory = {
  key: GameHighMetricKey;
  label: string;
};

type RecordListItem = {
  name: string;
  playerHead?: string;
  href: string;
  meta: string;
  detail?: string;
  value: string;
  badge: string;
};

type RecordSection = {
  key: string;
  label: string;
  icon: "trophy" | "star" | "flame";
  items: RecordListItem[];
};

function createBaseStats(): BaseStats {
  return { ...BASE_STATS_TEMPLATE };
}

function normalizeShotTotals(base: BaseStats): {
  totalFGM: number;
  totalFGA: number;
  twoPM: number;
  twoPA: number;
} {
  const twoPM = base.FieldGoalsMade;
  const twoPA = base.FieldGoalAttempts;
  const totalFGM = twoPM + base.ThreesMade;
  const totalFGA = twoPA + base.ThreesAttempts;
  return { totalFGM, totalFGA, twoPM, twoPA };
}

function formatGameLabel(value: PlayerStat["game_number"]): string {
  const raw = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  if (!raw) return "Game";
  return raw.startsWith("#") ? raw : `Game #${raw}`;
}

function formatTeams(teams: Set<string>): string {
  return Array.from(teams).join(", ");
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
          doubleDoubles: 0,
          tripleDoubles: 0,
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

        for (const game of player.stats ?? []) {
          const doubleDigitCategories = [
            game.Points ?? 0,
            game.Rebounds ?? 0,
            game.Assists ?? 0,
            game.Steals ?? 0,
            game.Blocks ?? 0,
          ].filter((value) => value >= 10).length;

          if (doubleDigitCategories >= 2) {
            existing.doubleDoubles += 1;
          }

          if (doubleDigitCategories >= 3) {
            existing.tripleDoubles += 1;
          }
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

    const totalFGM = stats.FieldGoalsMade + stats.ThreesMade;
    const totalFGA = stats.FieldGoalAttempts + stats.ThreesAttempts;
    const twoPM = stats.FieldGoalsMade;
    const twoPA = stats.FieldGoalAttempts;

    const missedFG = Math.max(0, totalFGA - totalFGM);
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
      playerHead: data.playerHead,
      data,
      metrics: {
        PPG: stats.Points / gamesPlayed,
        Points: stats.Points,
        ThreesMade: stats.ThreesMade,
        DoubleDoubles: data.doubleDoubles,
        TripleDoubles: data.tripleDoubles,
        EFF: totalEff / gamesPlayed,
        "FG%": (totalFGM / Math.max(totalFGA, 1)) * 100,
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
  let filtered = category.minimumGames
    ? records.filter((record) => record.data.gp >= category.minimumGames!)
    : records;

  if (category.minimumAttempts) {
    const min = category.minimumAttempts;
    filtered = filtered.filter((record) => {
      if ("computed" in min && min.computed === "totalFGA") {
        const totalFGA = record.data.stats.FieldGoalAttempts + record.data.stats.ThreesAttempts;
        return totalFGA >= min.value;
      }
      return record.data.stats[min.stat] >= min.value;
    });
  }

  return filtered
    .toSorted((a, b) => b.metrics[category.key] - a.metrics[category.key])
    .slice(0, 5);
}

function getAllTimeGameHighs(): GameHighRecord[] {
  const leagueData = getLeagueData();
  const records: GameHighRecord[] = [];

  for (const [seasonId, seasonData] of Object.entries(leagueData.seasons)) {
    for (const team of seasonData.teams) {
      for (const player of team.roster) {
        if (shouldHideSeasonPlayerFromDisplay(player.name, seasonId)) {
          continue;
        }

        for (const game of player.stats ?? []) {
          const normalizedGame: BaseStats = {
            Points: game.Points ?? 0,
            FieldGoalsMade: game.FieldGoalsMade ?? 0,
            FieldGoalAttempts: game.FieldGoalAttempts ?? 0,
            ThreesMade: game.ThreesMade ?? 0,
            ThreesAttempts: game.ThreesAttempts ?? 0,
            FreeThrowsMade: game.FreeThrowsMade ?? 0,
            FreeThrowsAttempts: game.FreeThrowsAttempts ?? 0,
            Rebounds: game.Rebounds ?? 0,
            Offrebounds: game.Offrebounds ?? 0,
            Defrebounds: game.Defrebounds ?? 0,
            Assists: game.Assists ?? 0,
            Blocks: game.Blocks ?? 0,
            Steals: game.Steals ?? 0,
            Turnovers: game.Turnovers ?? 0,
            PersonalFouls: game.PersonalFouls ?? 0,
          };

          const { totalFGM, totalFGA } = normalizeShotTotals(normalizedGame);
          const missedFG = Math.max(0, totalFGA - totalFGM);
          const missedFT = Math.max(0, normalizedGame.FreeThrowsAttempts - normalizedGame.FreeThrowsMade);

          records.push({
            name: player.name,
            playerHead: player.PlayerHead,
            teamName: team.Team,
            seasonLabel: seasonData.name,
            opponent: game.opponent || "Unknown opponent",
            gameLabel: formatGameLabel(game.game_number),
            metrics: {
              Points: normalizedGame.Points,
              Rebounds: normalizedGame.Rebounds,
              Assists: normalizedGame.Assists,
              Steals: normalizedGame.Steals,
              Blocks: normalizedGame.Blocks,
              ThreesMade: normalizedGame.ThreesMade,
              Turnovers: normalizedGame.Turnovers,
              FieldGoalsMade: totalFGM,
              FieldGoalAttempts: totalFGA,
              ThreesAttempts: normalizedGame.ThreesAttempts,
              FreeThrowsMade: normalizedGame.FreeThrowsMade,
              FreeThrowsAttempts: normalizedGame.FreeThrowsAttempts,
              EFF:
                normalizedGame.Points +
                normalizedGame.Rebounds +
                normalizedGame.Assists +
                normalizedGame.Steals +
                normalizedGame.Blocks -
                missedFG -
                missedFT -
                normalizedGame.Turnovers,
            },
          });
        }
      }
    }
  }

  return records;
}

function getTop5GameHighs(records: GameHighRecord[], category: GameHighCategory): GameHighRecord[] {
  return records
    .filter((record) => record.metrics[category.key] > 0)
    .toSorted((a, b) => {
      const difference = b.metrics[category.key] - a.metrics[category.key];
      if (difference !== 0) return difference;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 5);
}

function buildCareerSections(records: CareerRecord[], categories: LeaderCategory[]): RecordSection[] {
  return categories.map((category) => ({
    key: category.key,
    label: category.label,
    icon: category.icon,
    items: getTop5(records, category).map((player) => ({
      name: player.name,
      playerHead: player.playerHead,
      href: buildPlayerProfileHref(player.name, { returnTo: "/stats/all-time/" }),
      meta: formatTeams(player.data.teams),
      value:
        category.valueType === "rate" ? player.metrics[category.key].toFixed(1) : String(player.metrics[category.key]),
      badge: `${player.data.gp} Games`,
    })),
  }));
}

function buildGameHighSections(records: GameHighRecord[], categories: GameHighCategory[]): RecordSection[] {
  return categories.map((category) => ({
    key: category.key,
    label: category.label,
    icon: "flame" as const,
    items: getTop5GameHighs(records, category).map((player) => ({
      name: player.name,
      playerHead: player.playerHead,
      href: buildPlayerProfileHref(player.name, { returnTo: "/stats/all-time/" }),
      meta: `${player.teamName} · ${player.seasonLabel}`,
      detail: `vs ${player.opponent} · ${player.gameLabel}`,
      value: String(player.metrics[category.key]),
      badge: "Single game",
    })),
  }));
}

export default function AllTimePage() {
  const records = getAllTimeStats();
  const validRecords = buildCareerRecords(records);
  const gameHighRecords = getAllTimeGameHighs();

  const categories: LeaderCategory[] = [
    { key: "Points", label: "Total Points", icon: "trophy", valueType: "total" },
    { key: "ThreesMade", label: "3PM", icon: "trophy", valueType: "total" },
    { key: "DoubleDoubles", label: "Double-Doubles", icon: "trophy", valueType: "total" },
    { key: "TripleDoubles", label: "Triple-Doubles", icon: "trophy", valueType: "total" },
    { key: "Rebounds", label: "Total Rebounds", icon: "trophy", valueType: "total" },
    { key: "Offrebounds", label: "Offensive Rebounds", icon: "trophy", valueType: "total" },
    { key: "Defrebounds", label: "Defensive Rebounds", icon: "trophy", valueType: "total" },
    { key: "Assists", label: "Total Assists", icon: "trophy", valueType: "total" },
    { key: "Turnovers", label: "Total Turnovers", icon: "trophy", valueType: "total" },
    { key: "Steals", label: "Total Steals", icon: "trophy", valueType: "total" },
    { key: "Blocks", label: "Total Blocks", icon: "trophy", valueType: "total" },
    { key: "PPG", label: "Career PPG (Min. 5 GP)", icon: "star", minimumGames: 5, valueType: "rate" },
    { key: "EFF", label: "Career Efficiency (Min. 5 GP)", icon: "star", minimumGames: 5, valueType: "rate" },
    { key: "FG%", label: "Career FG% (Min. 50 FGA)", icon: "star", minimumGames: 5, minimumAttempts: { computed: "totalFGA", value: 50 }, valueType: "rate" },    { key: "2P%", label: "Career 2P% (Min. 5 GP/20 Attempts)", icon: "star", minimumGames: 5, minimumAttempts: { stat: "FieldGoalAttempts", value: 20 }, valueType: "rate" },
    { key: "3P%", label: "Career 3P% (Min. 5 GP/20 Attempts)", icon: "star", minimumGames: 5, minimumAttempts: { stat: "ThreesAttempts", value: 20 }, valueType: "rate" },
    { key: "FT%", label: "Career FT% (Min. 5 GP/15 Attempts)", icon: "star", minimumGames: 5, minimumAttempts: { stat: "FreeThrowsAttempts", value: 15 }, valueType: "rate" },    { key: "RPG", label: "Career RPG (Min. 5 GP)", icon: "star", minimumGames: 5, valueType: "rate" },
    { key: "APG", label: "Career APG (Min. 5 GP)", icon: "star", minimumGames: 5, valueType: "rate" },
    { key: "TOVPG", label: "Career TOVPG (Min. 5 GP)", icon: "star", minimumGames: 5, valueType: "rate" },
    { key: "SPG", label: "Career SPG (Min. 5 GP)", icon: "star", minimumGames: 5, valueType: "rate" },
    { key: "BPG", label: "Career BPG (Min. 5 GP)", icon: "star", minimumGames: 5, valueType: "rate" },
  ];

  const gameHighCategories: GameHighCategory[] = [
    { key: "Points", label: "Most Points In A Game" },
    { key: "Rebounds", label: "Most Rebounds In A Game" },
    { key: "Assists", label: "Most Assists In A Game" },
    { key: "Steals", label: "Most Steals In A Game" },
    { key: "Blocks", label: "Most Blocks In A Game" },
    { key: "ThreesMade", label: "Most Threes In A Game" },
    { key: "FieldGoalsMade", label: "Most FGM In A Game" },
    { key: "FieldGoalAttempts", label: "Most FGA In A Game" },
    { key: "ThreesAttempts", label: "Most 3PA In A Game" },
    { key: "FreeThrowsMade", label: "Most FTM In A Game" },
    { key: "FreeThrowsAttempts", label: "Most FTA In A Game" },
    { key: "Turnovers", label: "Most Turnovers In A Game" },
    { key: "EFF", label: "Best Efficiency Game" },
  ];

  const careerSections = buildCareerSections(validRecords, categories);
  const gameHighSections = buildGameHighSections(gameHighRecords, gameHighCategories);

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-6xl uppercase italic">
          All-Time <span className="text-copper-500">Records</span>
        </h1>
        <p className="mt-4 text-zinc-400 text-lg max-w-2xl">
          Celebrating the legends, career milestones, and biggest single-game explosions since CBT began in 2023.
        </p>
      </div>

      <AllTimeRecordsClient careerSections={careerSections} gameHighSections={gameHighSections} />
    </div>
  );
}
