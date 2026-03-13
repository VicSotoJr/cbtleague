const BASE_STATS_TEMPLATE = {
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

const BASE_STAT_KEYS = Object.keys(BASE_STATS_TEMPLATE);

function createBaseStats() {
  return { ...BASE_STATS_TEMPLATE };
}

function toSafeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeShotTotals(base) {
  const pointsFromInclusive = (base.FieldGoalsMade - base.ThreesMade) * 2 + base.ThreesMade * 3;
  const pointsFromSeparate = base.FieldGoalsMade * 2 + base.ThreesMade * 3;
  const isInclusive = Math.abs(pointsFromInclusive - base.Points) < Math.abs(pointsFromSeparate - base.Points);

  const totalFGM = isInclusive ? base.FieldGoalsMade : base.FieldGoalsMade + base.ThreesMade;
  const totalFGA = isInclusive ? base.FieldGoalAttempts : base.FieldGoalAttempts + base.ThreesAttempts;

  const twoPM = Math.max(0, totalFGM - base.ThreesMade);
  const twoPA = Math.max(twoPM, totalFGA - base.ThreesAttempts);

  return { totalFGM, totalFGA, twoPM, twoPA };
}

function sumPlayerStats(player) {
  const totals = createBaseStats();

  for (const game of player.stats ?? []) {
    for (const key of BASE_STAT_KEYS) {
      totals[key] += toSafeNumber(game[key]);
    }
  }

  return totals;
}

function aggregatePlayerStats(player) {
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

function aggregateTeamStats(team) {
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

export function buildLeagueSummary(data) {
  const summary = {
    metadata: {
      generatedAt: new Date().toISOString(),
      source: "src/data/data.json",
    },
    seasons: {},
  };

  for (const [seasonId, season] of Object.entries(data.seasons ?? {})) {
    const getTeamColor = (team) =>
      "color" in team && typeof team.color === "string" ? team.color ?? null : null;

    const teams = (season.teams ?? []).map((team) => ({
      Team: team.Team,
      wins: team.wins,
      loss: team.loss,
      gamesPlayed: team.gamesPlayed,
      color: getTeamColor(team),
      playerCount: Array.isArray(team.roster) ? team.roster.length : 0,
    }));

    const teamStats = (season.teams ?? []).map((team) => ({
      Team: team.Team,
      wins: team.wins,
      loss: team.loss,
      gamesPlayed: team.gamesPlayed,
      color: getTeamColor(team),
      playerCount: Array.isArray(team.roster) ? team.roster.length : 0,
      aggregated: aggregateTeamStats(team),
    }));

    const players = (season.teams ?? [])
      .flatMap((team) =>
        (team.roster ?? []).map((player) => ({
          player: {
            name: player.name,
            PlayerHead: player.PlayerHead,
          },
          teamName: team.Team,
          aggregated: aggregatePlayerStats(player),
        }))
      )
      .sort((a, b) => b.aggregated.PPG - a.aggregated.PPG);

    summary.seasons[seasonId] = {
      id: seasonId,
      name: season.name,
      teams,
      teamStats,
      players,
      schedule: season.schedule ?? [],
    };
  }

  return summary;
}
