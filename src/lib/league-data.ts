import allData from "@/data/data.json";
import type {
  AggregatedBaseStats,
  AggregatedPlayerMetrics,
  BaseStats,
  GameEntry,
  LeagueData,
  Player,
  Team,
} from "@/types/league";

const leagueData = allData as LeagueData;

export const SEASON_OPTIONS = [
  { id: "3", label: "Season 3 - 2026" },
  { id: "2", label: "Season 2 - 2025" },
  { id: "1", label: "Season 1 - 2023" },
] as const;

const DEFAULT_SEASON_ID = "3";

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

function createBaseStats(): BaseStats {
  return { ...BASE_STATS_TEMPLATE };
}

function toSafeNumber(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function getSeasonId(input: string | null | undefined): string {
  if (!input) return DEFAULT_SEASON_ID;
  return leagueData.seasons[input] ? input : DEFAULT_SEASON_ID;
}

export function getSeasonData(seasonId: string) {
  const selectedSeasonId = getSeasonId(seasonId);
  return leagueData.seasons[selectedSeasonId];
}

function addInferredByeEntries(schedule: GameEntry[], teamNames: string[]): GameEntry[] {
  if (schedule.some((game) => game.isBye || game.byeTeam) || teamNames.length === 0) {
    return schedule;
  }

  const grouped = groupGamesByWeekInternal(schedule.map((game) => ({ week: game.week, game })));

  return grouped.flatMap(({ games, week }) => {
    if (games.some((game) => isSpecialEventGame(game) || isExplicitPlayoffGame(game))) {
      return games;
    }

    const activeTeams = new Set(
      games.flatMap((game) => [game.homeTeam, game.awayTeam].filter((team): team is string => Boolean(team)))
    );
    const missingTeams = teamNames.filter((team) => !activeTeams.has(team));

    if (missingTeams.length !== 1) {
      return games;
    }

    const anchorGame = games[games.length - 1];

    return [
      ...games,
      {
        week,
        date: anchorGame?.date ?? "",
        time: anchorGame?.time,
        isBye: true,
        byeTeam: missingTeams[0],
      },
    ];
  });
}

export function getSeasonTeams(seasonId: string): Team[] {
  return getSeasonData(seasonId)?.teams ?? [];
}

export function getSeasonSchedule(seasonId: string): GameEntry[] {
  const season = getSeasonData(seasonId);
  return addInferredByeEntries(
    season?.schedule ?? [],
    (season?.teams ?? []).map((team) => team.Team).filter(Boolean)
  );
}

export function getSeasonLabel(seasonId: string): string {
  const selectedSeasonId = getSeasonId(seasonId);
  return (
    SEASON_OPTIONS.find((season) => season.id === selectedSeasonId)?.label ??
    getSeasonData(selectedSeasonId)?.name ??
    "Season"
  );
}

function normalizeShotTotals(base: BaseStats): {
  totalFGM: number;
  totalFGA: number;
  twoPM: number;
  twoPA: number;
} {
  const pointsFromInclusive = (base.FieldGoalsMade - base.ThreesMade) * 2 + base.ThreesMade * 3;
  const pointsFromSeparate = base.FieldGoalsMade * 2 + base.ThreesMade * 3;
  const isInclusive = Math.abs(pointsFromInclusive - base.Points) < Math.abs(pointsFromSeparate - base.Points);

  const totalFGM = isInclusive ? base.FieldGoalsMade : base.FieldGoalsMade + base.ThreesMade;
  const totalFGA = isInclusive ? base.FieldGoalAttempts : base.FieldGoalAttempts + base.ThreesAttempts;

  const twoPM = Math.max(0, totalFGM - base.ThreesMade);
  const twoPA = Math.max(twoPM, totalFGA - base.ThreesAttempts);

  return { totalFGM, totalFGA, twoPM, twoPA };
}

function sumPlayerStats(player: Player): BaseStats {
  const totals = createBaseStats();

  for (const game of player.stats ?? []) {
    for (const key of BASE_STAT_KEYS) {
      totals[key] += toSafeNumber(game[key]);
    }
  }

  return totals;
}

export function aggregatePlayerStats(player: Player): AggregatedPlayerMetrics {
  const totals = sumPlayerStats(player);
  const gamesPlayedRaw = Math.max(player.GamesPlayed ?? 0, 0);
  const gamesPlayedForRate = Math.max(gamesPlayedRaw, 1);

  const { totalFGM, totalFGA, twoPM, twoPA } = normalizeShotTotals(totals);

  const missedFG = Math.max(0, totalFGA - totalFGM);
  const missedFT = Math.max(0, totals.FreeThrowsAttempts - totals.FreeThrowsMade);

  const efficiency =
    (totals.Points +
      totals.Rebounds +
      totals.Assists +
      totals.Steals +
      totals.Blocks -
      missedFG -
      missedFT -
      totals.Turnovers) /
    gamesPlayedForRate;

  return {
    ...totals,
    FieldGoalsMade: totalFGM,
    FieldGoalAttempts: totalFGA,
    twoPM,
    twoPA,
    "FG%": Number(((totalFGM / Math.max(totalFGA, 1)) * 100).toFixed(1)),
    "2P%": Number(((twoPM / Math.max(twoPA, 1)) * 100).toFixed(1)),
    "3P%": Number(((totals.ThreesMade / Math.max(totals.ThreesAttempts, 1)) * 100).toFixed(1)),
    "FT%": Number(((totals.FreeThrowsMade / Math.max(totals.FreeThrowsAttempts, 1)) * 100).toFixed(1)),
    PPG: Number((totals.Points / gamesPlayedForRate).toFixed(1)),
    RPG: Number((totals.Rebounds / gamesPlayedForRate).toFixed(1)),
    APG: Number((totals.Assists / gamesPlayedForRate).toFixed(1)),
    SPG: Number((totals.Steals / gamesPlayedForRate).toFixed(1)),
    BPG: Number((totals.Blocks / gamesPlayedForRate).toFixed(1)),
    TOVPG: Number((totals.Turnovers / gamesPlayedForRate).toFixed(1)),
    EFF: Number(efficiency.toFixed(1)),
    GAMES: gamesPlayedRaw,
  };
}

export interface PlayerWithTeamStats {
  player: Player;
  teamName: string;
  aggregated: AggregatedPlayerMetrics;
}

export function getSeasonPlayersWithAggregates(seasonId: string): PlayerWithTeamStats[] {
  const teams = getSeasonTeams(seasonId);

  return teams.flatMap((team) =>
    team.roster.map((player) => ({
      player,
      teamName: team.Team,
      aggregated: aggregatePlayerStats(player),
    }))
  );
}

function aggregateTeamStats(team: Team): AggregatedBaseStats {
  const totals = createBaseStats();

  for (const player of team.roster) {
    const aggregatedPlayer = aggregatePlayerStats(player);
    for (const key of BASE_STAT_KEYS) {
      totals[key] += aggregatedPlayer[key];
    }
  }

  const { totalFGM, totalFGA, twoPM, twoPA } = normalizeShotTotals(totals);

  return {
    ...totals,
    FieldGoalsMade: totalFGM,
    FieldGoalAttempts: totalFGA,
    twoPM,
    twoPA,
    "FG%": Number(((totalFGM / Math.max(totalFGA, 1)) * 100).toFixed(1)),
    "2P%": Number(((twoPM / Math.max(twoPA, 1)) * 100).toFixed(1)),
    "3P%": Number(((totals.ThreesMade / Math.max(totals.ThreesAttempts, 1)) * 100).toFixed(1)),
    "FT%": Number(((totals.FreeThrowsMade / Math.max(totals.FreeThrowsAttempts, 1)) * 100).toFixed(1)),
  };
}

export function getSeasonTeamsWithAggregates(seasonId: string): Array<Team & { aggregated: AggregatedBaseStats }> {
  return getSeasonTeams(seasonId).map((team) => ({
    ...team,
    aggregated: aggregateTeamStats(team),
  }));
}

export function getPlayersForSearch(seasonId: string): Array<{
  name: string;
  team: string;
  playerHead: string;
}> {
  return getSeasonTeams(seasonId).flatMap((team) =>
    team.roster.map((player) => ({
      name: player.name,
      team: team.Team,
      playerHead: player.PlayerHead,
    }))
  );
}

export type LeaderStatKey =
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
  | "PersonalFouls";

export function getTopPlayersByStat(
  players: PlayerWithTeamStats[],
  statKey: LeaderStatKey,
  limit = 5
): PlayerWithTeamStats[] {
  return players
    .toSorted((a, b) => b.aggregated[statKey] - a.aggregated[statKey])
    .slice(0, limit);
}

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

export function getLeagueData(): LeagueData {
  return leagueData;
}
