import summaryData from "@/data/league-summary.json";
import type { AggregatedBaseStats, AggregatedPlayerMetrics, GameEntry } from "@/types/league";

export type LeaderStatKey = keyof Pick<
  AggregatedPlayerMetrics,
  | "PPG"
  | "Points"
  | "EFF"
  | "FG%"
  | "2P%"
  | "3P%"
  | "FT%"
  | "RPG"
  | "Offrebounds"
  | "Defrebounds"
  | "APG"
  | "Assists"
  | "TOVPG"
  | "SPG"
  | "BPG"
  | "PersonalFouls"
>;

type SummaryPlayer = {
  name: string;
  PlayerHead: string;
};

export type SummaryPlayerWithTeamStats = {
  player: SummaryPlayer;
  teamName: string;
  aggregated: AggregatedPlayerMetrics;
};

export type SummaryTeam = {
  Team: string;
  wins: number;
  loss: number;
  gamesPlayed: number;
  color: string | null;
  playerCount: number;
};

export type SummaryTeamWithAggregates = SummaryTeam & {
  aggregated: AggregatedBaseStats;
};

type SummarySeason = {
  id: string;
  name: string;
  teams: SummaryTeam[];
  teamStats: SummaryTeamWithAggregates[];
  players: SummaryPlayerWithTeamStats[];
  schedule: GameEntry[];
};

type LeagueSummaryData = {
  seasons: Record<string, SummarySeason>;
};

const leagueSummary = summaryData as LeagueSummaryData;

export const SEASON_OPTIONS = [
  { id: "3", label: "Season 3 - 2026" },
  { id: "2", label: "Season 2 - 2025" },
  { id: "1", label: "Season 1 - 2023" },
] as const;

const DEFAULT_SEASON_ID = "3";
const topPlayersCache = new WeakMap<
  SummaryPlayerWithTeamStats[],
  Map<string, SummaryPlayerWithTeamStats[]>
>();

export function getSeasonId(input: string | null | undefined): string {
  if (!input) {
    return DEFAULT_SEASON_ID;
  }

  return leagueSummary.seasons[input] ? input : DEFAULT_SEASON_ID;
}

function getSeasonData(seasonId: string): SummarySeason | undefined {
  const selectedSeasonId = getSeasonId(seasonId);
  return leagueSummary.seasons[selectedSeasonId];
}

export function getSeasonTeams(seasonId: string): SummaryTeam[] {
  return getSeasonData(seasonId)?.teams ?? [];
}

export function getSeasonTeamsWithAggregates(seasonId: string): SummaryTeamWithAggregates[] {
  return getSeasonData(seasonId)?.teamStats ?? [];
}

export function getSeasonPlayersWithAggregates(seasonId: string): SummaryPlayerWithTeamStats[] {
  return getSeasonData(seasonId)?.players ?? [];
}

export function getSeasonSchedule(seasonId: string): GameEntry[] {
  return getSeasonData(seasonId)?.schedule ?? [];
}

export function getSeasonLabel(seasonId: string): string {
  const selectedSeasonId = getSeasonId(seasonId);
  return (
    SEASON_OPTIONS.find((season) => season.id === selectedSeasonId)?.label ??
    getSeasonData(selectedSeasonId)?.name ??
    "Season"
  );
}

export function getTopPlayersByStat(
  players: SummaryPlayerWithTeamStats[],
  statKey: LeaderStatKey,
  limit = 5
): SummaryPlayerWithTeamStats[] {
  let cacheByStat = topPlayersCache.get(players);
  if (!cacheByStat) {
    cacheByStat = new Map<string, SummaryPlayerWithTeamStats[]>();
    topPlayersCache.set(players, cacheByStat);
  }

  const cacheKey = `${statKey}:${limit}`;
  const cached = cacheByStat.get(cacheKey);
  if (cached) {
    return cached;
  }

  const ranked = players.toSorted((a, b) => b.aggregated[statKey] - a.aggregated[statKey]).slice(0, limit);
  cacheByStat.set(cacheKey, ranked);
  return ranked;
}

export function groupGamesByWeek(schedule: GameEntry[]): Array<{ week: string; games: GameEntry[] }> {
  const grouped = new Map<string, GameEntry[]>();

  for (const game of schedule) {
    const existing = grouped.get(game.week);
    if (existing) {
      existing.push(game);
    } else {
      grouped.set(game.week, [game]);
    }
  }

  return Array.from(grouped.entries()).map(([week, games]) => ({ week, games }));
}
