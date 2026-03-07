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

export function getSeasonTeams(seasonId: string): Team[] {
  return getSeasonData(seasonId)?.teams ?? [];
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

function normalizeShotTotals(base: BaseStats): {
  totalFGM: number;
  totalFGA: number;
  twoPM: number;
  twoPA: number;
} {
  const pointsFromInclusive = (base.FieldGoalsMade - base.ThreesMade) * 2 + base.ThreesMade * 3;
  const pointsFromSeparate = base.FieldGoalsMade * 2 + base.ThreesMade * 3;
  const isInclusive = Math.abs(pointsFromInclusive - base.Points) <= Math.abs(pointsFromSeparate - base.Points);

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

export function groupGamesByWeek(schedule: GameEntry[]): Array<{ week: string; games: GameEntry[] }> {
  const grouped = new Map<string, GameEntry[]>();

  for (const game of schedule) {
    const week = game.week;
    const existing = grouped.get(week);
    if (existing) {
      existing.push(game);
    } else {
      grouped.set(week, [game]);
    }
  }

  return Array.from(grouped.entries()).map(([week, games]) => ({ week, games }));
}

export function getLeagueData(): LeagueData {
  return leagueData;
}
