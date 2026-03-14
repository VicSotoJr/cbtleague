import { getSeasonPlayersWithAggregates, type SummaryPlayerWithTeamStats } from "@/lib/league-summary";
import { getManualSeasonOverall } from "@/lib/manual-player-overalls";
import type { AggregatedPlayerMetrics } from "@/types/league";

export type PlayerArchetype =
  | "shooting_creator_guard"
  | "lead_guard"
  | "role_guard"
  | "scoring_wing"
  | "two_way_wing"
  | "low_usage_wing"
  | "point_forward"
  | "playmaking_big"
  | "scoring_big"
  | "rim_runner_defensive_big";

export type PlayerOverallBreakdown = {
  outsideScoring: number;
  insideScoring: number;
  playmaking: number;
  athleticism: number;
  defense: number;
  rebounding: number;
  shotIQ: number;
  offensiveConsistency: number;
  intangibles: number;
};

export type SummaryPlayerWithOverall = SummaryPlayerWithTeamStats & {
  archetype: PlayerArchetype;
  overall: number | null;
  rawOverall: number;
  overallBreakdown: PlayerOverallBreakdown;
};

type CoreCategoryScores = Pick<
  PlayerOverallBreakdown,
  "outsideScoring" | "insideScoring" | "playmaking" | "athleticism" | "defense" | "rebounding"
>;

type ArchetypeWeightSet = CoreCategoryScores & {
  modifiers: number;
};

type CurvePoint = readonly [value: number, rating: number];
type RatedSeasonPlayer = Omit<SummaryPlayerWithOverall, "overall"> & {
  overall: number;
};

const MIN_GAMES_FOR_CURRENT_OVERALL = 1;
const ACTIVE_PLAYER_MIN_OVERALL = 67;
const UNPROVEN_PLAYER_OVERALL = 60;
const seasonOverallsCache = new Map<string, SummaryPlayerWithOverall[]>();

const ARCHETYPE_WEIGHTS: Record<PlayerArchetype, ArchetypeWeightSet> = {
  shooting_creator_guard: {
    outsideScoring: 0.34,
    insideScoring: 0.1,
    playmaking: 0.24,
    athleticism: 0.1,
    defense: 0.08,
    rebounding: 0.03,
    modifiers: 0.11,
  },
  lead_guard: {
    outsideScoring: 0.22,
    insideScoring: 0.16,
    playmaking: 0.31,
    athleticism: 0.09,
    defense: 0.08,
    rebounding: 0.02,
    modifiers: 0.12,
  },
  role_guard: {
    outsideScoring: 0.2,
    insideScoring: 0.1,
    playmaking: 0.22,
    athleticism: 0.12,
    defense: 0.14,
    rebounding: 0.04,
    modifiers: 0.18,
  },
  scoring_wing: {
    outsideScoring: 0.25,
    insideScoring: 0.22,
    playmaking: 0.1,
    athleticism: 0.15,
    defense: 0.1,
    rebounding: 0.05,
    modifiers: 0.13,
  },
  two_way_wing: {
    outsideScoring: 0.18,
    insideScoring: 0.1,
    playmaking: 0.08,
    athleticism: 0.14,
    defense: 0.25,
    rebounding: 0.08,
    modifiers: 0.17,
  },
  low_usage_wing: {
    outsideScoring: 0.14,
    insideScoring: 0.1,
    playmaking: 0.08,
    athleticism: 0.14,
    defense: 0.22,
    rebounding: 0.1,
    modifiers: 0.22,
  },
  point_forward: {
    outsideScoring: 0.12,
    insideScoring: 0.19,
    playmaking: 0.24,
    athleticism: 0.14,
    defense: 0.08,
    rebounding: 0.08,
    modifiers: 0.15,
  },
  playmaking_big: {
    outsideScoring: 0.1,
    insideScoring: 0.2,
    playmaking: 0.2,
    athleticism: 0.05,
    defense: 0.12,
    rebounding: 0.16,
    modifiers: 0.17,
  },
  scoring_big: {
    outsideScoring: 0.08,
    insideScoring: 0.28,
    playmaking: 0.06,
    athleticism: 0.08,
    defense: 0.16,
    rebounding: 0.18,
    modifiers: 0.16,
  },
  rim_runner_defensive_big: {
    outsideScoring: 0.02,
    insideScoring: 0.2,
    playmaking: 0.03,
    athleticism: 0.13,
    defense: 0.24,
    rebounding: 0.22,
    modifiers: 0.16,
  },
};

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

function curve(value: number, points: readonly CurvePoint[]): number {
  if (points.length === 0) {
    return 60;
  }

  if (value <= points[0][0]) {
    return points[0][1];
  }

  for (let index = 1; index < points.length; index += 1) {
    const [rightValue, rightRating] = points[index];
    const [leftValue, leftRating] = points[index - 1];

    if (value <= rightValue) {
      const span = rightValue - leftValue;
      const progress = span === 0 ? 0 : (value - leftValue) / span;
      return leftRating + (rightRating - leftRating) * progress;
    }
  }

  return points[points.length - 1][1];
}

function descendingCurve(value: number, points: readonly CurvePoint[]): number {
  const reversed = points.map(([pointValue, pointRating]) => [-pointValue, pointRating] as const);
  return curve(-value, reversed);
}

function weightedAverage(pairs: Array<[number, number]>): number {
  let totalWeight = 0;
  let weightedTotal = 0;

  for (const [value, weight] of pairs) {
    totalWeight += weight;
    weightedTotal += value * weight;
  }

  if (totalWeight === 0) {
    return 60;
  }

  return weightedTotal / totalWeight;
}

function safeRatio(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return value / total;
}

function getPersonalFoulsPerGame(aggregated: AggregatedPlayerMetrics): number {
  if (aggregated.GAMES <= 0) {
    return 0;
  }

  return aggregated.PersonalFouls / aggregated.GAMES;
}

function getPerGameValue(total: number, aggregated: AggregatedPlayerMetrics): number {
  if (aggregated.GAMES <= 0) {
    return 0;
  }

  return total / aggregated.GAMES;
}

function getAssistTurnoverRatio(aggregated: AggregatedPlayerMetrics): number {
  return aggregated.Assists / Math.max(aggregated.Turnovers, 0.5);
}

function getUsageLoad(aggregated: AggregatedPlayerMetrics): number {
  return aggregated.FieldGoalAttempts + aggregated.FreeThrowsAttempts * 0.44;
}

function getOutsideScoringScore(aggregated: AggregatedPlayerMetrics): number {
  const ppgScore = curve(aggregated.PPG, [
    [0, 40],
    [6, 52],
    [10, 62],
    [15, 72],
    [20, 82],
    [25, 90],
    [30, 96],
    [35, 99],
  ]);
  const threePctScore = curve(aggregated["3P%"], [
    [18, 35],
    [25, 48],
    [30, 62],
    [34, 75],
    [37, 84],
    [40, 91],
    [43, 97],
  ]);
  const threeVolumeScore = curve(aggregated.ThreesAttempts, [
    [0, 35],
    [1, 44],
    [3, 58],
    [5, 72],
    [7, 84],
    [9, 93],
    [11, 98],
  ]);
  const ftScore = curve(aggregated["FT%"], [
    [45, 35],
    [60, 50],
    [70, 64],
    [78, 76],
    [84, 86],
    [90, 95],
    [95, 99],
  ]);
  const freeThrowRateScore = curve(safeRatio(aggregated.FreeThrowsAttempts, aggregated.FieldGoalAttempts), [
    [0.05, 40],
    [0.12, 52],
    [0.2, 64],
    [0.28, 76],
    [0.36, 86],
    [0.5, 95],
  ]);

  return weightedAverage([
    [ppgScore, 0.34],
    [threePctScore, 0.24],
    [threeVolumeScore, 0.2],
    [ftScore, 0.1],
    [freeThrowRateScore, 0.12],
  ]);
}

function getInsideScoringScore(aggregated: AggregatedPlayerMetrics): number {
  const twoPctScore = curve(aggregated["2P%"], [
    [35, 35],
    [45, 52],
    [50, 64],
    [55, 74],
    [60, 84],
    [66, 93],
    [72, 99],
  ]);
  const twoVolumeScore = curve(aggregated.twoPA, [
    [0, 35],
    [2, 44],
    [4, 54],
    [6, 66],
    [8, 78],
    [10, 88],
    [12, 95],
    [15, 99],
  ]);
  const ftaScore = curve(aggregated.FreeThrowsAttempts, [
    [0, 35],
    [1, 45],
    [2, 55],
    [4, 72],
    [6, 86],
    [8, 94],
    [10, 99],
  ]);
  const foulPressureScore = curve(safeRatio(aggregated.FreeThrowsAttempts, aggregated.FieldGoalAttempts), [
    [0.05, 40],
    [0.12, 52],
    [0.2, 64],
    [0.28, 76],
    [0.36, 86],
    [0.5, 95],
  ]);
  const offensiveGlassScore = curve(aggregated.Offrebounds, [
    [0, 35],
    [0.5, 48],
    [1, 60],
    [2, 78],
    [3, 90],
    [4.5, 98],
  ]);

  return weightedAverage([
    [twoPctScore, 0.32],
    [twoVolumeScore, 0.24],
    [ftaScore, 0.18],
    [foulPressureScore, 0.18],
    [offensiveGlassScore, 0.08],
  ]);
}

function getPlaymakingScore(aggregated: AggregatedPlayerMetrics): number {
  const apgScore = curve(aggregated.APG, [
    [0, 30],
    [1.5, 42],
    [3, 56],
    [5, 72],
    [7, 86],
    [9, 95],
    [11, 99],
  ]);
  const assistRatioScore = curve(getAssistTurnoverRatio(aggregated), [
    [0.5, 35],
    [1, 50],
    [1.5, 62],
    [2, 76],
    [3, 88],
    [4, 95],
    [5, 99],
  ]);
  const turnoverControlScore = descendingCurve(aggregated.TOVPG, [
    [0.5, 95],
    [1, 88],
    [1.5, 80],
    [2, 70],
    [2.5, 60],
    [3.5, 48],
    [5, 35],
  ]);
  const handlingLoadScore = curve(getUsageLoad(aggregated), [
    [2, 35],
    [5, 48],
    [8, 60],
    [12, 74],
    [16, 86],
    [20, 94],
    [24, 99],
  ]);

  return weightedAverage([
    [apgScore, 0.42],
    [assistRatioScore, 0.24],
    [turnoverControlScore, 0.2],
    [handlingLoadScore, 0.14],
  ]);
}

function getAthleticismScore(aggregated: AggregatedPlayerMetrics): number {
  const rimPressureScore = curve(safeRatio(aggregated.FreeThrowsAttempts, aggregated.FieldGoalAttempts), [
    [0.05, 42],
    [0.12, 54],
    [0.2, 64],
    [0.28, 74],
    [0.36, 84],
    [0.5, 94],
  ]);
  const offensiveGlassScore = curve(aggregated.Offrebounds, [
    [0, 35],
    [0.5, 48],
    [1, 60],
    [2, 78],
    [3, 90],
    [4.5, 98],
  ]);
  const stealScore = curve(aggregated.SPG, [
    [0, 35],
    [0.5, 50],
    [1, 66],
    [1.5, 80],
    [2, 90],
    [2.5, 97],
  ]);
  const blockScore = curve(aggregated.BPG, [
    [0, 35],
    [0.3, 48],
    [0.7, 62],
    [1.2, 78],
    [1.8, 90],
    [2.5, 98],
  ]);
  const scoringBurstScore = curve(aggregated.PPG, [
    [0, 40],
    [8, 52],
    [15, 68],
    [20, 80],
    [25, 90],
    [30, 97],
  ]);

  return weightedAverage([
    [rimPressureScore, 0.28],
    [offensiveGlassScore, 0.2],
    [stealScore, 0.18],
    [blockScore, 0.16],
    [scoringBurstScore, 0.18],
  ]);
}

function getDefenseScore(aggregated: AggregatedPlayerMetrics): number {
  const stealScore = curve(aggregated.SPG, [
    [0, 35],
    [0.5, 52],
    [1, 68],
    [1.5, 82],
    [2, 92],
    [2.5, 98],
  ]);
  const blockScore = curve(aggregated.BPG, [
    [0, 35],
    [0.3, 48],
    [0.7, 62],
    [1.2, 78],
    [1.8, 90],
    [2.5, 98],
  ]);
  const defensiveReboundingScore = curve(aggregated.Defrebounds, [
    [0, 35],
    [1, 45],
    [2, 56],
    [4, 72],
    [6, 84],
    [8, 93],
    [10, 98],
  ]);
  const foulDisciplineScore = descendingCurve(getPersonalFoulsPerGame(aggregated), [
    [0.5, 92],
    [1, 86],
    [1.5, 78],
    [2, 68],
    [2.5, 58],
    [3.2, 45],
    [4, 35],
  ]);

  return weightedAverage([
    [stealScore, 0.32],
    [blockScore, 0.24],
    [defensiveReboundingScore, 0.22],
    [foulDisciplineScore, 0.22],
  ]);
}

function getReboundingScore(aggregated: AggregatedPlayerMetrics): number {
  const rpgScore = curve(aggregated.RPG, [
    [0, 30],
    [2, 42],
    [4, 56],
    [6, 68],
    [8, 80],
    [10, 90],
    [13, 98],
  ]);
  const offReboundScore = curve(aggregated.Offrebounds, [
    [0, 35],
    [0.5, 48],
    [1, 60],
    [2, 78],
    [3, 90],
    [4.5, 98],
  ]);
  const defReboundScore = curve(aggregated.Defrebounds, [
    [0, 35],
    [1, 45],
    [2, 56],
    [4, 72],
    [6, 84],
    [8, 93],
    [10, 98],
  ]);

  return weightedAverage([
    [rpgScore, 0.4],
    [offReboundScore, 0.24],
    [defReboundScore, 0.36],
  ]);
}

function getShotIQScore(aggregated: AggregatedPlayerMetrics): number {
  const efficiencyScore = curve(aggregated.EFF, [
    [0, 35],
    [8, 48],
    [12, 58],
    [16, 70],
    [20, 82],
    [24, 90],
    [28, 96],
    [32, 99],
  ]);
  const fgScore = curve(aggregated["FG%"], [
    [30, 35],
    [38, 50],
    [44, 62],
    [48, 74],
    [52, 84],
    [56, 92],
    [60, 98],
  ]);
  const assistTurnoverScore = curve(getAssistTurnoverRatio(aggregated), [
    [0.5, 35],
    [1, 50],
    [1.5, 62],
    [2, 76],
    [3, 88],
    [4, 95],
    [5, 99],
  ]);
  const usageScore = curve(getUsageLoad(aggregated), [
    [2, 35],
    [5, 48],
    [8, 60],
    [12, 74],
    [16, 86],
    [20, 94],
    [24, 99],
  ]);

  return weightedAverage([
    [efficiencyScore, 0.42],
    [fgScore, 0.22],
    [assistTurnoverScore, 0.2],
    [usageScore, 0.16],
  ]);
}

function getOffensiveConsistencyScore(
  aggregated: AggregatedPlayerMetrics,
  outsideScoring: number,
  insideScoring: number
): number {
  const ppgScore = curve(aggregated.PPG, [
    [0, 35],
    [6, 48],
    [10, 58],
    [15, 70],
    [20, 82],
    [25, 90],
    [30, 96],
    [35, 99],
  ]);
  const efficiencyScore = curve(aggregated.EFF, [
    [0, 35],
    [8, 48],
    [12, 58],
    [16, 70],
    [20, 82],
    [24, 90],
    [28, 96],
    [32, 99],
  ]);
  const usageScore = curve(getUsageLoad(aggregated), [
    [2, 35],
    [5, 48],
    [8, 60],
    [12, 74],
    [16, 86],
    [20, 94],
    [24, 99],
  ]);

  return weightedAverage([
    [ppgScore, 0.28],
    [efficiencyScore, 0.32],
    [outsideScoring, 0.22],
    [insideScoring, 0.08],
    [usageScore, 0.1],
  ]);
}

function getIntangiblesScore(
  aggregated: AggregatedPlayerMetrics,
  shotIQ: number,
  offensiveConsistency: number,
  playmaking: number,
  defense: number
): number {
  const durabilityScore = curve(aggregated.GAMES, [
    [0, 35],
    [2, 45],
    [4, 56],
    [6, 68],
    [8, 80],
    [10, 90],
    [12, 96],
  ]);
  const efficiencyScore = curve(aggregated.EFF, [
    [0, 35],
    [8, 48],
    [12, 58],
    [16, 70],
    [20, 82],
    [24, 90],
    [28, 96],
    [32, 99],
  ]);

  return weightedAverage([
    [offensiveConsistency, 0.3],
    [shotIQ, 0.18],
    [defense, 0.18],
    [playmaking, 0.12],
    [durabilityScore, 0.1],
    [efficiencyScore, 0.12],
  ]);
}

function inferPlayerArchetype(
  aggregated: AggregatedPlayerMetrics,
  coreScores: CoreCategoryScores,
  shotIQ: number,
  offensiveConsistency: number
): PlayerArchetype {
  const threeShare = safeRatio(aggregated.ThreesAttempts, aggregated.FieldGoalAttempts);
  const freeThrowRate = safeRatio(aggregated.FreeThrowsAttempts, aggregated.FieldGoalAttempts);
  const offensiveReboundsPerGame = getPerGameValue(aggregated.Offrebounds, aggregated);
  const bigAnchor =
    aggregated.BPG >= 0.9 ||
    (offensiveReboundsPerGame >= 1.8 && threeShare <= 0.3) ||
    (aggregated.RPG >= 9 && aggregated.APG < 4.5);
  const guardSignal =
    coreScores.playmaking * 0.32 +
    coreScores.outsideScoring * 0.24 +
    curve(threeShare, [
      [0, 35],
      [0.15, 48],
      [0.25, 60],
      [0.35, 75],
      [0.45, 88],
      [0.6, 98],
    ]) *
      0.16 +
    descendingCurve(coreScores.rebounding, [
      [40, 92],
      [50, 84],
      [60, 70],
      [70, 56],
      [80, 42],
      [90, 35],
    ]) *
      0.14 +
    descendingCurve(coreScores.defense, [
      [40, 86],
      [50, 80],
      [60, 72],
      [70, 60],
      [80, 48],
      [90, 35],
    ]) *
      0.14;

  const bigSignal =
    coreScores.rebounding * 0.24 +
    coreScores.defense * 0.2 +
    coreScores.insideScoring * 0.2 +
    curve(offensiveReboundsPerGame, [
      [0, 35],
      [0.5, 48],
      [1, 60],
      [2, 78],
      [3, 90],
      [4.5, 98],
    ]) *
      0.18 +
    descendingCurve(threeShare, [
      [0, 98],
      [0.1, 88],
      [0.2, 72],
      [0.35, 54],
      [0.5, 38],
    ]) *
      0.18;

  if (bigAnchor && bigSignal >= guardSignal) {
    if (coreScores.playmaking >= 78 && (shotIQ >= 84 || aggregated.APG >= 4.5)) {
      return "playmaking_big";
    }

    if (coreScores.insideScoring >= 78 && (offensiveConsistency >= 78 || freeThrowRate >= 0.24)) {
      return "scoring_big";
    }

    return "rim_runner_defensive_big";
  }

  if (aggregated.APG >= 4.8 || coreScores.playmaking >= 76) {
    const qualifiesAsPointForward =
      aggregated.RPG >= 5 &&
      aggregated.APG >= 5.5 &&
      (aggregated.PPG >= 12 || offensiveConsistency >= 80 || coreScores.insideScoring >= 90);
    const qualifiesAsTwoWayWingInitiator =
      aggregated.APG >= 4.8 &&
      aggregated.RPG >= 4.5 &&
      threeShare <= 0.22 &&
      coreScores.defense >= 76;
    const qualifiesAsScoringWingCreator =
      aggregated.RPG >= 5.5 &&
      coreScores.playmaking >= 74 &&
      (coreScores.outsideScoring >= 80 || coreScores.insideScoring >= 78);

    if (qualifiesAsPointForward) {
      return "point_forward";
    }

    if (qualifiesAsTwoWayWingInitiator) {
      return "two_way_wing";
    }

    if (qualifiesAsScoringWingCreator) {
      return "scoring_wing";
    }

    if (coreScores.outsideScoring >= 82 && threeShare >= 0.32 && aggregated.APG < 6.5) {
      return "shooting_creator_guard";
    }

    return "lead_guard";
  }

  if (coreScores.defense >= 76) {
    return coreScores.outsideScoring >= 72 ? "two_way_wing" : "low_usage_wing";
  }

  if (coreScores.outsideScoring >= 78 || coreScores.insideScoring >= 74 || aggregated.PPG >= 14) {
    return "scoring_wing";
  }

  return aggregated.APG >= 3.5 ? "role_guard" : "low_usage_wing";
}

function getOverallFromArchetype(
  archetype: PlayerArchetype,
  aggregated: AggregatedPlayerMetrics,
  coreScores: CoreCategoryScores,
  modifiers: Pick<PlayerOverallBreakdown, "shotIQ" | "offensiveConsistency" | "intangibles">
): number {
  const weights = ARCHETYPE_WEIGHTS[archetype];
  const modifierBlend =
    modifiers.shotIQ * 0.28 + modifiers.offensiveConsistency * 0.4 + modifiers.intangibles * 0.32;
  const composite =
    coreScores.outsideScoring * weights.outsideScoring +
    coreScores.insideScoring * weights.insideScoring +
    coreScores.playmaking * weights.playmaking +
    coreScores.athleticism * weights.athleticism +
    coreScores.defense * weights.defense +
    coreScores.rebounding * weights.rebounding +
    modifierBlend * weights.modifiers;
  const eliteTraitCount = Object.values(coreScores).filter((score) => score >= 88).length;
  const scorerLift = Math.max(0, modifiers.offensiveConsistency - 80) * 0.08;
  const starLift =
    Math.max(0, composite - 84) * 0.45 +
    eliteTraitCount * 0.75 +
    Math.max(0, modifiers.offensiveConsistency - 92) * 0.1 +
    scorerLift;
  const scoringArchetypeBoost =
    archetype === "shooting_creator_guard" ||
    archetype === "scoring_wing" ||
    archetype === "scoring_big";
  const scorerBiasLift =
    Math.max(0, aggregated.PPG - 14) * (scoringArchetypeBoost ? 0.18 : 0.1) +
    Math.max(0, aggregated.PPG - 20) * 0.08;
  const connectorArchetypePenaltyWeight =
    archetype === "point_forward" ||
    archetype === "playmaking_big" ||
    archetype === "rim_runner_defensive_big" ||
    archetype === "two_way_wing"
      ? 0.34
      : archetype === "lead_guard"
        ? 0.16
        : 0;
  const connectorPenalty =
    connectorArchetypePenaltyWeight === 0
      ? 0
      : Math.min(
          2.6,
          Math.max(0, 10 - aggregated.PPG) * connectorArchetypePenaltyWeight -
            Math.max(0, aggregated.APG - 7.5) * 0.08 -
            Math.max(0, aggregated.RPG - 10) * 0.05
        );

  return clamp(composite + starLift + scorerBiasLift - connectorPenalty, 58, 99);
}

function translateLeagueOverall(rawOverall: number, rawOverallValues: number[]): number {
  const percentile = percentileRank(rawOverallValues, rawOverall);
  const leagueCurve = curve(percentile, [
    [0, 63],
    [10, 69],
    [25, 75],
    [40, 79],
    [55, 84],
    [70, 88],
    [82, 91],
    [90, 93],
    [96, 96],
    [100, 99],
  ]);
  const topEndBoost = Math.max(0, percentile - 92) * 0.18;
  const blendedOverall = rawOverall * 0.38 + leagueCurve * 0.62 + topEndBoost;

  if (rawOverall < 67) {
    const lowBandCurve = curve(rawOverall, [
      [58, 67],
      [59, 68],
      [60, 69],
      [61, 70],
      [62, 71],
      [63, 72],
      [64, 73],
      [65, 74],
      [66, 75],
      [67, 76],
    ]);

    return Math.round(clamp(lowBandCurve * 0.72 + blendedOverall * 0.28, ACTIVE_PLAYER_MIN_OVERALL, 99));
  }

  return Math.round(clamp(blendedOverall, ACTIVE_PLAYER_MIN_OVERALL, 99));
}

function getSingleGameLowEndOverall(aggregated: AggregatedPlayerMetrics): number {
  const debutImpactScore =
    aggregated.EFF +
    aggregated.Points * 0.1 +
    aggregated.Assists * 0.35 +
    aggregated.Rebounds * 0.15 +
    aggregated.Steals * 0.8 +
    aggregated.Blocks * 0.8 -
    aggregated.Turnovers * 0.3;

  return curve(debutImpactScore, [
    [-7, 67],
    [1.5, 67],
    [4, 68],
    [7, 69],
    [10, 70],
    [13, 71],
    [16, 72],
    [20, 73],
  ]);
}

function getMultiGameLowEndOverall(aggregated: AggregatedPlayerMetrics): number {
  const seasonImpactScore =
    aggregated.EFF +
    aggregated.Points * 0.03 +
    aggregated.Rebounds * 0.08 +
    aggregated.Assists * 0.12 +
    aggregated.Steals * 0.35 +
    aggregated.Blocks * 0.35 -
    aggregated.Turnovers * 0.08;

  return curve(seasonImpactScore, [
    [-2, 67],
    [2, 67],
    [5, 67.5],
    [8, 68],
    [11, 68.5],
    [14, 69],
    [18, 70],
  ]);
}

function normalizePlayerName(value: string): string {
  return value.trim().toLowerCase();
}

type HistoricalPlayerContext = {
  careerGamesBeforeSeason: number;
  latestOverall: number | null;
};

function buildHistoricalContextByPlayer(seasonId: string): Map<string, HistoricalPlayerContext> {
  const context = new Map<string, HistoricalPlayerContext>();

  for (let previousSeasonNumber = Number(seasonId) - 1; previousSeasonNumber >= 1; previousSeasonNumber -= 1) {
    const previousSeasonId = String(previousSeasonNumber);
    const previousSeasonOveralls = getSeasonPlayerOveralls(
      getSeasonPlayersWithAggregates(previousSeasonId),
      previousSeasonId
    );

    for (const entry of previousSeasonOveralls) {
      const key = normalizePlayerName(entry.player.name);
      const existing = context.get(key) ?? {
        careerGamesBeforeSeason: 0,
        latestOverall: null,
      };

      existing.careerGamesBeforeSeason += entry.aggregated.GAMES;
      if (existing.latestOverall === null && entry.aggregated.GAMES > 0 && entry.overall !== null) {
        existing.latestOverall = entry.overall;
      }

      context.set(key, existing);
    }
  }

  return context;
}

function applyOverallAvailabilityRules(
  seasonId: string,
  players: RatedSeasonPlayer[]
): SummaryPlayerWithOverall[] {
  const historicalContextByPlayer = buildHistoricalContextByPlayer(seasonId);

  return players.map((entry) => {
    const historicalContext = historicalContextByPlayer.get(normalizePlayerName(entry.player.name));
    const careerGames = entry.aggregated.GAMES + (historicalContext?.careerGamesBeforeSeason ?? 0);

    if (entry.aggregated.GAMES >= MIN_GAMES_FOR_CURRENT_OVERALL) {
      if (entry.aggregated.GAMES === 1 && entry.rawOverall < 67) {
        const singleGameOverall = getSingleGameLowEndOverall(entry.aggregated);

        return {
          ...entry,
          overall: Math.round(clamp(entry.overall * 0.35 + singleGameOverall * 0.65, ACTIVE_PLAYER_MIN_OVERALL, 99)),
        };
      }

      if (entry.aggregated.GAMES >= 2 && entry.rawOverall < 67) {
        const multiGameOverall = getMultiGameLowEndOverall(entry.aggregated);

        return {
          ...entry,
          overall: Math.round(clamp(entry.overall * 0.55 + multiGameOverall * 0.45, ACTIVE_PLAYER_MIN_OVERALL, 99)),
        };
      }

      return {
        ...entry,
        overall: Math.max(entry.overall, ACTIVE_PLAYER_MIN_OVERALL),
      };
    }

    if (historicalContext?.latestOverall != null) {
      return {
        ...entry,
        overall: historicalContext.latestOverall,
      };
    }

    return {
      ...entry,
      overall: careerGames === 0 ? UNPROVEN_PLAYER_OVERALL : ACTIVE_PLAYER_MIN_OVERALL,
    };
  });
}

export function getSeasonPlayerOveralls(
  players: SummaryPlayerWithTeamStats[],
  seasonId: string
): SummaryPlayerWithOverall[] {
  const cached = seasonOverallsCache.get(seasonId);
  if (cached) {
    return cached;
  }

  const scored = players.map((entry) => {
    const { aggregated } = entry;
    const outsideScoring = getOutsideScoringScore(aggregated);
    const insideScoring = getInsideScoringScore(aggregated);
    const playmaking = getPlaymakingScore(aggregated);
    const athleticism = getAthleticismScore(aggregated);
    const defense = getDefenseScore(aggregated);
    const rebounding = getReboundingScore(aggregated);
    const shotIQ = getShotIQScore(aggregated);
    const offensiveConsistency = getOffensiveConsistencyScore(aggregated, outsideScoring, insideScoring);
    const intangibles = getIntangiblesScore(aggregated, shotIQ, offensiveConsistency, playmaking, defense);
    const coreScores = {
      outsideScoring,
      insideScoring,
      playmaking,
      athleticism,
      defense,
      rebounding,
    };
    const archetype = inferPlayerArchetype(aggregated, coreScores, shotIQ, offensiveConsistency);
    const rawOverall = getOverallFromArchetype(archetype, aggregated, coreScores, {
      shotIQ,
      offensiveConsistency,
      intangibles,
    });

    return {
      ...entry,
      archetype,
      rawOverall,
      overallBreakdown: {
        outsideScoring: Number(outsideScoring.toFixed(1)),
        insideScoring: Number(insideScoring.toFixed(1)),
        playmaking: Number(playmaking.toFixed(1)),
        athleticism: Number(athleticism.toFixed(1)),
        defense: Number(defense.toFixed(1)),
        rebounding: Number(rebounding.toFixed(1)),
        shotIQ: Number(shotIQ.toFixed(1)),
        offensiveConsistency: Number(offensiveConsistency.toFixed(1)),
        intangibles: Number(intangibles.toFixed(1)),
      },
    };
  });

  const rawOverallValues = scored.map((entry) => entry.rawOverall);
  const enriched = scored.map((entry) => ({
    ...entry,
    overall: translateLeagueOverall(entry.rawOverall, rawOverallValues),
  }));
  const availabilityAdjusted = applyOverallAvailabilityRules(seasonId, enriched);
  const manualAdjusted = availabilityAdjusted.map((entry) => {
    const manualOverall = getManualSeasonOverall(seasonId, entry.player.name);
    if (manualOverall == null) {
      return entry;
    }

    return {
      ...entry,
      overall: manualOverall,
    };
  });

  const ranked = manualAdjusted.toSorted((a, b) => {
    const aOverall = a.overall ?? -1;
    const bOverall = b.overall ?? -1;

    if (bOverall !== aOverall) {
      return bOverall - aOverall;
    }

    if (b.rawOverall !== a.rawOverall) {
      return b.rawOverall - a.rawOverall;
    }

    if (b.overallBreakdown.offensiveConsistency !== a.overallBreakdown.offensiveConsistency) {
      return b.overallBreakdown.offensiveConsistency - a.overallBreakdown.offensiveConsistency;
    }

    return b.aggregated.Points - a.aggregated.Points;
  });

  seasonOverallsCache.set(seasonId, ranked);
  return ranked;
}
