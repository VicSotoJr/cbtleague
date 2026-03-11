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

export type ScheduleSectionId = "regular" | "playoffs" | "special";

export type GroupedScheduleWeek = {
  week: string;
  games: GameEntry[];
};

export type ScheduleSection = {
  id: ScheduleSectionId;
  title: string;
  description: string;
  inferred: boolean;
  weeks: GroupedScheduleWeek[];
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

function groupGamesByWeekInternal(entries: Array<{ week: string; game: GameEntry }>): GroupedScheduleWeek[] {
  const grouped = new Map<string, GameEntry[]>();

  for (const entry of entries) {
    const existing = grouped.get(entry.week);
    if (existing) {
      existing.push(entry.game);
    } else {
      grouped.set(entry.week, [entry.game]);
    }
  }

  return Array.from(grouped.entries()).map(([week, games]) => ({ week, games }));
}

function parseDisplayDate(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function getWeekNumber(label: string | undefined): number | null {
  if (!label) {
    return null;
  }

  const match = label.match(/^Week\s+(\d+)/i);
  if (!match) {
    return null;
  }

  return Number(match[1]);
}

function getWeekLabelDate(label: string | undefined): number | null {
  if (!label) {
    return null;
  }

  const parts = label.split(" - ");
  if (parts.length < 2) {
    return null;
  }

  return parseDisplayDate(parts.slice(1).join(" - "));
}

function isSpecialEventGame(game: GameEntry): boolean {
  return /allstar|all-star|skills challenge|3 point|1 on 1|dunk contest/i.test(game.week);
}

function isExplicitPlayoffGame(game: GameEntry): boolean {
  return Boolean(game.isPlayoff) || /playoff|championship/i.test(game.week);
}

function getPlayoffInferenceBoundary(schedule: GameEntry[]) {
  let lastRegularWeekNumber = 0;
  let lastRegularWeekLabel: string | null = null;
  let lastRegularWeekDate: number | null = null;

  for (const game of schedule) {
    if (isSpecialEventGame(game) || isExplicitPlayoffGame(game)) {
      continue;
    }

    const weekNumber = getWeekNumber(game.week);
    if (weekNumber === null || weekNumber < lastRegularWeekNumber) {
      continue;
    }

    const weekDate = getWeekLabelDate(game.week);
    if (weekNumber > lastRegularWeekNumber) {
      lastRegularWeekNumber = weekNumber;
      lastRegularWeekLabel = game.week;
      lastRegularWeekDate = weekDate;
      continue;
    }

    if ((weekDate ?? -Infinity) > (lastRegularWeekDate ?? -Infinity)) {
      lastRegularWeekLabel = game.week;
      lastRegularWeekDate = weekDate;
    }
  }

  return {
    lastRegularWeekNumber,
    lastRegularWeekLabel,
    lastRegularWeekDate,
  };
}

function isInferredPlayoffGame(
  game: GameEntry,
  boundary: ReturnType<typeof getPlayoffInferenceBoundary>
): boolean {
  if (isSpecialEventGame(game) || isExplicitPlayoffGame(game)) {
    return false;
  }

  if (!boundary.lastRegularWeekLabel || boundary.lastRegularWeekDate === null) {
    return false;
  }

  if (getWeekNumber(game.week) !== boundary.lastRegularWeekNumber) {
    return false;
  }

  const gameDate = parseDisplayDate(game.date);
  return gameDate !== null && gameDate > boundary.lastRegularWeekDate;
}

function getScheduleBucketLabel(
  game: GameEntry,
  sectionId: ScheduleSectionId,
  inferredPlayoff: boolean
): string {
  if (sectionId === "playoffs" && inferredPlayoff) {
    return `Playoffs - ${game.date}`;
  }

  return game.week;
}

export function getScheduleSections(schedule: GameEntry[]): ScheduleSection[] {
  const boundary = getPlayoffInferenceBoundary(schedule);
  const regularEntries: Array<{ week: string; game: GameEntry }> = [];
  const playoffEntries: Array<{ week: string; game: GameEntry }> = [];
  const specialEntries: Array<{ week: string; game: GameEntry }> = [];
  let hasInferredPlayoffs = false;

  for (const game of schedule) {
    if (isSpecialEventGame(game)) {
      specialEntries.push({ week: game.week, game });
      continue;
    }

    const inferredPlayoff = isInferredPlayoffGame(game, boundary);
    if (isExplicitPlayoffGame(game) || inferredPlayoff) {
      hasInferredPlayoffs = hasInferredPlayoffs || inferredPlayoff;
      playoffEntries.push({
        week: getScheduleBucketLabel(game, "playoffs", inferredPlayoff),
        game,
      });
      continue;
    }

    regularEntries.push({ week: game.week, game });
  }

  const sections: ScheduleSection[] = [];

  if (regularEntries.length > 0) {
    sections.push({
      id: "regular",
      title: "Regular Season",
      description: "Weekly regular-season matchups and byes.",
      inferred: false,
      weeks: groupGamesByWeekInternal(regularEntries),
    });
  }

  if (playoffEntries.length > 0) {
    sections.push({
      id: "playoffs",
      title: "Playoffs",
      description: hasInferredPlayoffs
        ? "Postseason games, including historical playoff dates inferred from the archived schedule."
        : "Postseason bracket matchups and championship games.",
      inferred: hasInferredPlayoffs,
      weeks: groupGamesByWeekInternal(playoffEntries),
    });
  }

  if (specialEntries.length > 0) {
    sections.push({
      id: "special",
      title: "Special Events",
      description: "All-Star Weekend and other league event entries.",
      inferred: false,
      weeks: groupGamesByWeekInternal(specialEntries),
    });
  }

  return sections;
}

export function groupGamesByWeek(schedule: GameEntry[]): GroupedScheduleWeek[] {
  return groupGamesByWeekInternal(schedule.map((game) => ({ week: game.week, game })));
}
