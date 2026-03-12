import type { AggregatedPlayerMetrics } from "@/types/league";
import type { SummaryPlayerWithTeamStats } from "@/lib/league-summary";

export type PlayerOverallBreakdown = {
  scoring: number;
  shooting: number;
  playmaking: number;
  rebounding: number;
  defense: number;
  efficiency: number;
  availability: number;
  samplePenalty: number;
};

export type SummaryPlayerWithOverall = SummaryPlayerWithTeamStats & {
  overall: number;
  overallBreakdown: PlayerOverallBreakdown;
};

const overallsCache = new WeakMap<SummaryPlayerWithTeamStats[], SummaryPlayerWithOverall[]>();
const CURRENT_SEASON_ID = "3";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function percentileRank(values: number[], value: number): number {
  if (values.length <= 1) {
    return 50;
  }

  let lessThanCount = 0;
  let equalCount = 0;

  for (const candidate of values) {
    if (candidate < value) {
      lessThanCount += 1;
    } else if (candidate === value) {
      equalCount += 1;
    }
  }

  return ((lessThanCount + (equalCount - 1) * 0.5) / (values.length - 1)) * 100;
}

function positiveVolumeFactor(value: number, target: number): number {
  if (value <= 0) {
    return 0;
  }

  return clamp(value / target, 0.2, 1);
}

function regressToNeutral(score: number, factor: number, neutral = 45): number {
  return neutral + (score - neutral) * factor;
}

function getSamplePenalty(games: number, seasonId?: string): number {
  if (seasonId === CURRENT_SEASON_ID) {
    if (games >= 8) return 1;
    if (games >= 6) return 0.995;
    if (games === 5) return 0.99;
    if (games === 4) return 0.985;
    if (games === 3) return 0.98;
    if (games === 2) return 0.93;
    if (games === 1) return 0.86;
    return 0.6;
  }

  if (games >= 8) return 1;
  if (games >= 6) return 0.99;
  if (games === 5) return 0.985;
  if (games === 4) return 0.975;
  if (games === 3) return 0.96;
  if (games === 2) return 0.84;
  if (games === 1) return 0.74;
  return 0.5;
}

function getMetricArrays(players: SummaryPlayerWithTeamStats[]) {
  const metrics = {
    ppg: [] as number[],
    points: [] as number[],
    fgPct: [] as number[],
    threePct: [] as number[],
    ftPct: [] as number[],
    apg: [] as number[],
    tovpg: [] as number[],
    rpg: [] as number[],
    rebounds: [] as number[],
    spg: [] as number[],
    bpg: [] as number[],
    eff: [] as number[],
    games: [] as number[],
  };

  for (const entry of players) {
    const { aggregated } = entry;

    metrics.ppg.push(aggregated.PPG);
    metrics.points.push(aggregated.Points);
    metrics.fgPct.push(aggregated["FG%"]);
    metrics.threePct.push(aggregated["3P%"]);
    metrics.ftPct.push(aggregated["FT%"]);
    metrics.apg.push(aggregated.APG);
    metrics.tovpg.push(aggregated.TOVPG);
    metrics.rpg.push(aggregated.RPG);
    metrics.rebounds.push(aggregated.Rebounds);
    metrics.spg.push(aggregated.SPG);
    metrics.bpg.push(aggregated.BPG);
    metrics.eff.push(aggregated.EFF);
    metrics.games.push(aggregated.GAMES);
  }

  return metrics;
}

function getShootingScore(aggregated: AggregatedPlayerMetrics, metricArrays: ReturnType<typeof getMetricArrays>): number {
  const fgScore = percentileRank(metricArrays.fgPct, aggregated["FG%"]);
  const threeScore = percentileRank(metricArrays.threePct, aggregated["3P%"]);
  const ftScore = percentileRank(metricArrays.ftPct, aggregated["FT%"]);

  const adjustedFg = regressToNeutral(fgScore, positiveVolumeFactor(aggregated.FieldGoalAttempts, 35));
  const adjustedThree = regressToNeutral(threeScore, positiveVolumeFactor(aggregated.ThreesAttempts, 18));
  const adjustedFt = regressToNeutral(ftScore, positiveVolumeFactor(aggregated.FreeThrowsAttempts, 14));

  return adjustedFg * 0.45 + adjustedThree * 0.3 + adjustedFt * 0.25;
}

function getPlaymakingScore(aggregated: AggregatedPlayerMetrics, metricArrays: ReturnType<typeof getMetricArrays>): number {
  const assistsScore = percentileRank(metricArrays.apg, aggregated.APG);
  const turnoverControl = percentileRank(metricArrays.tovpg, -aggregated.TOVPG);
  const usageFactor = positiveVolumeFactor(aggregated.Assists + aggregated.Turnovers, 20);
  const adjustedTurnoverControl = regressToNeutral(turnoverControl, usageFactor, 50);

  return assistsScore * 0.7 + adjustedTurnoverControl * 0.3;
}

export function getSeasonPlayerOveralls(
  players: SummaryPlayerWithTeamStats[],
  seasonId?: string
): SummaryPlayerWithOverall[] {
  const cached = overallsCache.get(players);
  if (cached) {
    return cached;
  }

  const metricArrays = getMetricArrays(players);

  const enriched = players.map((entry) => {
    const { aggregated } = entry;

    const scoring =
      percentileRank(metricArrays.ppg, aggregated.PPG) * 0.7 +
      percentileRank(metricArrays.points, aggregated.Points) * 0.3;
    const shooting = getShootingScore(aggregated, metricArrays);
    const playmaking = getPlaymakingScore(aggregated, metricArrays);
    const rebounding =
      percentileRank(metricArrays.rpg, aggregated.RPG) * 0.7 +
      percentileRank(metricArrays.rebounds, aggregated.Rebounds) * 0.3;
    const defense =
      percentileRank(metricArrays.spg, aggregated.SPG) * 0.55 +
      percentileRank(metricArrays.bpg, aggregated.BPG) * 0.45;
    const efficiency = percentileRank(metricArrays.eff, aggregated.EFF);
    const availability = percentileRank(metricArrays.games, aggregated.GAMES);
    const samplePenalty = getSamplePenalty(aggregated.GAMES, seasonId);
    const eliteTraitCount = [scoring, shooting, playmaking, rebounding, defense, efficiency].filter(
      (score) => score >= 80
    ).length;

    const composite =
      scoring * 0.26 +
      shooting * 0.16 +
      playmaking * 0.18 +
      rebounding * 0.13 +
      defense * 0.12 +
      efficiency * 0.11 +
      availability * 0.05;

    const eliteLift = Math.max(0, composite - 72) * 0.24 + eliteTraitCount * 0.9;
    const rawOverall = clamp(60 + composite * 0.31 + eliteLift, 60, 99);
    const overall = Math.round(clamp(60 + (rawOverall - 60) * samplePenalty, 60, 99));

    return {
      ...entry,
      overall,
      overallBreakdown: {
        scoring: Number(scoring.toFixed(1)),
        shooting: Number(shooting.toFixed(1)),
        playmaking: Number(playmaking.toFixed(1)),
        rebounding: Number(rebounding.toFixed(1)),
        defense: Number(defense.toFixed(1)),
        efficiency: Number(efficiency.toFixed(1)),
        availability: Number(availability.toFixed(1)),
        samplePenalty,
      },
    };
  });

  const ranked = enriched.toSorted((a, b) => {
    if (b.overall !== a.overall) {
      return b.overall - a.overall;
    }

    if (b.aggregated.EFF !== a.aggregated.EFF) {
      return b.aggregated.EFF - a.aggregated.EFF;
    }

    return b.aggregated.Points - a.aggregated.Points;
  });

  overallsCache.set(players, ranked);
  return ranked;
}
