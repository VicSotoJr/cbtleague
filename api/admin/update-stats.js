const COMMIT_MESSAGE = "Update stats via admin panel";
const GITHUB_API_VERSION = "2022-11-28";
const DEFAULT_BRANCH = "main";
const DEFAULT_STATS_PATH = "data/stats.json";
const FALLBACK_STATS_PATH = "src/data/data.json";
const SUMMARY_PATH = "src/data/league-summary.json";
const MANUAL_OVERALLS_PATH = "src/lib/manual-player-overalls.ts";
const HEADSHOTS_DIR = "public/images/player-heads";
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
const STAT_KEYS = Object.keys(BASE_STATS_TEMPLATE);

function isRecord(value) {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isBaseStats(value) {
  if (!isRecord(value)) return false;
  return STAT_KEYS.every((key) => isFiniteNumber(value[key]));
}

function isAdminPlayerGameUpdate(value) {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.teamName) &&
    isNonEmptyString(value.playerName) &&
    isNonEmptyString(value.opponent) &&
    isBaseStats(value.gameLog)
  );
}

function isAdminStatsUpdatePayload(value) {
  if (!isRecord(value)) return false;

  const hasValidUpdates =
    Array.isArray(value.updates) &&
    value.updates.every(isAdminPlayerGameUpdate);
  const hasScheduleUpdate =
    value.scheduleUpdate === undefined || isAdminScheduleScoreUpdate(value.scheduleUpdate);
  const hasManualOverallUpdates =
    value.manualOverallUpdates === undefined ||
    (Array.isArray(value.manualOverallUpdates) && value.manualOverallUpdates.every(isAdminManualOverallUpdate));
  const hasPlayerProfileUpdates =
    value.playerProfileUpdates === undefined ||
    (Array.isArray(value.playerProfileUpdates) &&
      value.playerProfileUpdates.every(isAdminPlayerProfileUpdate));
  const hasHeadshotUploads =
    value.headshotUploads === undefined ||
    (Array.isArray(value.headshotUploads) &&
      value.headshotUploads.every(isAdminHeadshotUpload));

  return (
    isNonEmptyString(value.seasonId) &&
    hasValidUpdates &&
    hasScheduleUpdate &&
    hasManualOverallUpdates &&
    hasPlayerProfileUpdates &&
    hasHeadshotUploads &&
    ((value.updates.length === 0 && value.gameNumber === undefined) || isNonEmptyString(value.gameNumber)) &&
    (value.updates.length > 0 ||
      value.scheduleUpdate !== undefined ||
      (value.manualOverallUpdates?.length ?? 0) > 0 ||
      (value.playerProfileUpdates?.length ?? 0) > 0 ||
      (value.headshotUploads?.length ?? 0) > 0)
  );
}

function isLegacyAdminStatsUpdatePayload(value) {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.seasonId) &&
    isNonEmptyString(value.teamName) &&
    isNonEmptyString(value.playerName) &&
    isNonEmptyString(value.opponent) &&
    isNonEmptyString(value.gameNumber) &&
    isBaseStats(value.gameLog)
  );
}

function isAdminScheduleScoreUpdate(value) {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.week) &&
    isNonEmptyString(value.homeTeam) &&
    isNonEmptyString(value.awayTeam) &&
    isFiniteNumber(value.homeScore) &&
    isFiniteNumber(value.awayScore)
  );
}

function isAdminManualOverallUpdate(value) {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.playerName) &&
    isFiniteNumber(value.overall) &&
    value.overall >= 60 &&
    value.overall <= 99
  );
}

function isAdminPlayerProfileUpdate(value) {
  if (!isRecord(value)) return false;
  const hasValidNumber =
    typeof value.number === "string" || typeof value.number === "number";

  return (
    isNonEmptyString(value.teamName) &&
    isNonEmptyString(value.playerName) &&
    hasValidNumber &&
    typeof value.playerHead === "string"
  );
}

function isAdminHeadshotUpload(value) {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.playerName) &&
    isNonEmptyString(value.fileName) &&
    isNonEmptyString(value.contentBase64)
  );
}

function isGitHubContentResponse(value) {
  if (!isRecord(value)) return false;
  return (
    typeof value.sha === "string" &&
    typeof value.content === "string" &&
    typeof value.encoding === "string" &&
    typeof value.path === "string"
  );
}

function isGitHubRefResponse(value) {
  return isRecord(value) && isRecord(value.object) && typeof value.object.sha === "string";
}

function isGitHubCommitResponse(value) {
  return isRecord(value) && isRecord(value.tree) && typeof value.tree.sha === "string";
}

function isShaResponse(value) {
  return isRecord(value) && typeof value.sha === "string";
}

function setCorsHeaders(res) {
  const allowedOrigin = process.env.ADMIN_ALLOWED_ORIGIN ?? "*";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function readBody(req) {
  if (typeof req.body === "string") {
    return JSON.parse(req.body);
  }
  return req.body;
}

async function readJsonResponse(response) {
  const raw = await response.text();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
}

function getGitHubErrorMessage(value) {
  if (isRecord(value) && typeof value.message === "string") {
    return value.message;
  }
  return "Unknown GitHub API error";
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

function normalizePlayerKey(value) {
  return value.trim().toLowerCase();
}

function sanitizeHeadshotFileName(value, fallbackPlayerName) {
  const trimmed = String(value ?? "")
    .trim()
    .replace(/^.*[\\/]/, "")
    .replace(/[?#].*$/, "");
  const extMatch = trimmed.match(/\.([a-z0-9]+)$/i);
  const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : ".jpg";
  const baseValue = (extMatch ? trimmed.slice(0, -ext.length) : trimmed) || fallbackPlayerName;
  const base = String(baseValue)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base || "player-headshot"}${ext}`;
}

function normalizePlayerHeadValue(value, playerName) {
  return String(value ?? "").trim()
    ? sanitizeHeadshotFileName(value, playerName)
    : "";
}

function normalizeRosterNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const stringValue = String(value ?? "").trim();
  if (!stringValue) return "";
  return stringValue;
}

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
    for (const key of STAT_KEYS) {
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
    for (const key of STAT_KEYS) {
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

function buildLeagueSummary(data) {
  const summary = {
    metadata: {
      generatedAt: new Date().toISOString(),
      source: "src/data/data.json",
    },
    seasons: {},
  };

  for (const [seasonId, season] of Object.entries(data.seasons ?? {})) {
    const teams = (season.teams ?? []).map((team) => ({
      Team: team.Team,
      wins: team.wins,
      loss: team.loss,
      gamesPlayed: team.gamesPlayed,
      color: "color" in team && typeof team.color === "string" ? team.color ?? null : null,
      playerCount: Array.isArray(team.roster) ? team.roster.length : 0,
    }));

    const teamStats = (season.teams ?? []).map((team) => ({
      Team: team.Team,
      wins: team.wins,
      loss: team.loss,
      gamesPlayed: team.gamesPlayed,
      color: "color" in team && typeof team.color === "string" ? team.color ?? null : null,
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

function getRepositoryConfig() {
  const owner = process.env.GITHUB_REPO_OWNER ?? process.env.VERCEL_GIT_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME ?? process.env.VERCEL_GIT_REPO_SLUG;
  if (!owner || !repo) return null;

  const configuredStatsPath = process.env.GITHUB_STATS_PATH;
  const statsPathCandidates = configuredStatsPath ? [configuredStatsPath] : [DEFAULT_STATS_PATH, FALLBACK_STATS_PATH];

  return {
    owner,
    repo,
    branch: process.env.GITHUB_BRANCH ?? DEFAULT_BRANCH,
    statsPathCandidates,
  };
}

function encodeGitHubPath(path) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function toGameNumber(value) {
  const trimmed = value.trim();
  const parsed = Number.parseInt(trimmed, 10);
  if (Number.isInteger(parsed) && `${parsed}` === trimmed) {
    return parsed;
  }
  return trimmed;
}

function hasRecordedOpponent(stat) {
  return typeof stat.opponent === "string" && stat.opponent.trim().length > 0;
}

function hasRecordedStats(stat) {
  return STAT_KEYS.some((key) => stat[key] > 0);
}

function getCompletedGamesPlayed(stats) {
  return stats.filter((stat) => hasRecordedOpponent(stat) || hasRecordedStats(stat)).length;
}

function sortRosterByName(roster) {
  return [...roster].toSorted((left, right) => left.name.localeCompare(right.name));
}

function applyPlayerProfileUpdate(leagueData, seasonId, update) {
  const season = leagueData.seasons[seasonId];
  if (!season) {
    return { ok: false, status: 404, message: "Season not found" };
  }

  const team = season.teams.find((candidate) => candidate.Team === update.teamName);
  if (!team) {
    return { ok: false, status: 404, message: "Team not found" };
  }

  const normalizedPlayerName = update.playerName.trim();
  const normalizedKey = normalizePlayerKey(normalizedPlayerName);
  const playerHead = normalizePlayerHeadValue(update.playerHead, normalizedPlayerName);
  const rosterNumber = normalizeRosterNumber(update.number);
  let player = team.roster.find(
    (candidate) => normalizePlayerKey(candidate.name) === normalizedKey
  );

  if (!player) {
    player = {
      name: normalizedPlayerName,
      number: rosterNumber,
      GamesPlayed: 0,
      PlayerHead: playerHead,
      stats: [],
    };
    team.roster = sortRosterByName([...(team.roster ?? []), player]);
    return { ok: true };
  }

  player.number = rosterNumber;
  player.PlayerHead = playerHead;
  if (!Array.isArray(player.stats)) {
    player.stats = [];
  }
  player.GamesPlayed = getCompletedGamesPlayed(player.stats);

  return { ok: true };
}

function applyPlayerUpdate(leagueData, seasonId, gameNumber, update) {
  const season = leagueData.seasons[seasonId];
  if (!season) {
    return { ok: false, status: 404, message: "Season not found" };
  }

  const team = season.teams.find((candidate) => candidate.Team === update.teamName);
  if (!team) {
    return { ok: false, status: 404, message: "Team not found" };
  }

  const player = team.roster.find(
    (candidate) => normalizePlayerKey(candidate.name) === normalizePlayerKey(update.playerName)
  );
  if (!player) {
    return { ok: false, status: 404, message: "Player not found" };
  }

  const nextStat = {
    game_number: toGameNumber(gameNumber),
    opponent: update.opponent.trim(),
    ...update.gameLog,
  };

  const existingStats = Array.isArray(player.stats) ? player.stats : [];
  const existingIndex = existingStats.findIndex(
    (entry) =>
      String(entry.game_number) === String(nextStat.game_number) &&
      (entry.opponent === nextStat.opponent || !hasRecordedOpponent(entry))
  );

  if (existingIndex >= 0) {
    existingStats[existingIndex] = nextStat;
  } else {
    existingStats.push(nextStat);
  }

  player.stats = [...existingStats].sort((a, b) => Number(a.game_number) - Number(b.game_number));
  player.GamesPlayed = getCompletedGamesPlayed(player.stats);

  return { ok: true };
}

function applyScheduleScoreUpdate(leagueData, seasonId, scheduleUpdate) {
  const season = leagueData.seasons[seasonId];
  if (!season) {
    return { ok: false, status: 404, message: "Season not found" };
  }

  const scheduleEntry = season.schedule.find(
    (game) =>
      game.week === scheduleUpdate.week &&
      game.homeTeam === scheduleUpdate.homeTeam &&
      game.awayTeam === scheduleUpdate.awayTeam
  );

  if (!scheduleEntry) {
    return { ok: false, status: 404, message: "Schedule game not found" };
  }

  scheduleEntry.homeScore = String(scheduleUpdate.homeScore);
  scheduleEntry.awayScore = String(scheduleUpdate.awayScore);

  return { ok: true };
}

function parseCompletedScore(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const trimmed = String(value ?? "").trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function recalculateSeasonTeamRecords(leagueData, seasonId) {
  const season = leagueData.seasons[seasonId];
  if (!season) {
    return { ok: false, status: 404, message: "Season not found" };
  }

  const teams = Array.isArray(season.teams) ? season.teams : [];
  const teamNameSet = new Set(
    teams
      .map((team) => team?.Team)
      .filter((name) => typeof name === "string" && name.trim().length > 0)
  );
  const recordMap = new Map(
    teams.map((team) => [
      team.Team,
      { wins: 0, loss: 0, gamesPlayed: 0 },
    ])
  );

  for (const game of season.schedule ?? []) {
    const homeTeam = typeof game.homeTeam === "string" ? game.homeTeam.trim() : "";
    const awayTeam = typeof game.awayTeam === "string" ? game.awayTeam.trim() : "";
    if (!homeTeam || !awayTeam) continue;
    if (!teamNameSet.has(homeTeam) || !teamNameSet.has(awayTeam)) continue;
    if (game.isPlayoff) continue;

    const homeScore = parseCompletedScore(game.homeScore);
    const awayScore = parseCompletedScore(game.awayScore);
    if (homeScore === null || awayScore === null) continue;

    const homeRecord = recordMap.get(homeTeam);
    const awayRecord = recordMap.get(awayTeam);
    if (!homeRecord || !awayRecord) continue;

    homeRecord.gamesPlayed += 1;
    awayRecord.gamesPlayed += 1;

    if (homeScore > awayScore) {
      homeRecord.wins += 1;
      awayRecord.loss += 1;
    } else if (awayScore > homeScore) {
      awayRecord.wins += 1;
      homeRecord.loss += 1;
    }
  }

  for (const team of teams) {
    const nextRecord = recordMap.get(team.Team);
    if (!nextRecord) continue;
    team.wins = nextRecord.wins;
    team.loss = nextRecord.loss;
    team.gamesPlayed = nextRecord.gamesPlayed;
  }

  return { ok: true };
}

function normalizeAdminStatsPayload(payload) {
  if (isAdminStatsUpdatePayload(payload)) {
    return payload;
  }

  if (isLegacyAdminStatsUpdatePayload(payload)) {
    return {
      seasonId: payload.seasonId,
      gameNumber: payload.gameNumber,
      updates: [
        {
          teamName: payload.teamName,
          playerName: payload.playerName,
          opponent: payload.opponent,
          gameLog: payload.gameLog,
        },
      ],
      scheduleUpdate: undefined,
      manualOverallUpdates: undefined,
      playerProfileUpdates: undefined,
      headshotUploads: undefined,
    };
  }

  return null;
}

function getAdminBearerToken(req) {
  const rawHeader = req.headers.authorization;
  const header = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

async function createGitHubBlob(headers, repository, content, encoding = "utf-8") {
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}/git/blobs`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        encoding,
      }),
    }
  );

  const payload = await readJsonResponse(response);
  if (!response.ok || !isShaResponse(payload)) {
    throw new Error(`Failed to create GitHub blob: ${getGitHubErrorMessage(payload)}`);
  }

  return payload.sha;
}

async function fetchGitHubContent(headers, repository, path) {
  const encodedPath = encodeGitHubPath(path);
  const contentUrl = `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(
    repository.repo
  )}/contents/${encodedPath}?ref=${encodeURIComponent(repository.branch)}`;

  const response = await fetch(contentUrl, { method: "GET", headers });
  const payload = await readJsonResponse(response);

  if (!response.ok || !isGitHubContentResponse(payload) || payload.encoding.toLowerCase() !== "base64") {
    return {
      ok: false,
      status: response.status,
      message: getGitHubErrorMessage(payload),
    };
  }

  return {
    ok: true,
    payload,
    decoded: Buffer.from(payload.content.replace(/\n/g, ""), "base64").toString("utf8"),
  };
}

function parseManualSeasonOverallsSource(source, seasonId) {
  if (seasonId !== "3") {
    throw new Error(`Manual overalls are only supported for Season ${seasonId}.`);
  }

  const match = source.match(
    /const SEASON_3_MANUAL_OVERALLS = \{([\s\S]*?)\} as const satisfies Record<string, number>;/m
  );

  if (!match) {
    throw new Error("Failed to locate Season 3 manual overalls map.");
  }

  const entries = {};
  const entryPattern = /^\s*"([^"]+)":\s*(\d+),?\s*$/gm;

  for (const entry of match[1].matchAll(entryPattern)) {
    entries[entry[1]] = Number.parseInt(entry[2], 10);
  }

  return { entries, match: match[0] };
}

function updateManualSeasonOverallsSource(source, seasonId, manualOverallUpdates) {
  const { entries, match } = parseManualSeasonOverallsSource(source, seasonId);

  for (const update of manualOverallUpdates) {
    entries[normalizePlayerKey(update.playerName)] = update.overall;
  }

  const formattedEntries = Object.entries(entries)
    .toSorted(([leftName], [rightName]) => leftName.localeCompare(rightName))
    .map(([playerName, overall]) => `  ${JSON.stringify(playerName)}: ${overall},`)
    .join("\n");

  const replacement = `const SEASON_3_MANUAL_OVERALLS = {\n${formattedEntries}\n} as const satisfies Record<string, number>;`;

  return source.replace(match, replacement);
}

function buildCommitMessage(payload) {
  const hasStatsUpdates = payload.updates.length > 0 || payload.scheduleUpdate !== undefined;
  const hasManualOveralls = (payload.manualOverallUpdates?.length ?? 0) > 0;
  const hasProfiles = (payload.playerProfileUpdates?.length ?? 0) > 0;
  const hasHeadshots = (payload.headshotUploads?.length ?? 0) > 0;

  if (hasStatsUpdates && hasManualOveralls && (hasProfiles || hasHeadshots)) {
    return `${COMMIT_MESSAGE} (${payload.seasonId} / Game ${payload.gameNumber ?? "manual"}) + roster/media`;
  }

  if (hasStatsUpdates && (hasProfiles || hasHeadshots)) {
    return `${COMMIT_MESSAGE} (${payload.seasonId} / Game ${payload.gameNumber ?? "manual"}) + roster updates`;
  }

  if (hasManualOveralls && (hasProfiles || hasHeadshots)) {
    return `Update roster and manual overalls via admin panel (${payload.seasonId})`;
  }

  if (hasManualOveralls) {
    return `Update manual overalls via admin panel (${payload.seasonId})`;
  }

  if (hasProfiles || hasHeadshots) {
    return `Update roster assets via admin panel (${payload.seasonId})`;
  }

  return `${COMMIT_MESSAGE} (${payload.seasonId} / Game ${payload.gameNumber})`;
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, message: "Method not allowed. Use POST." });
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    res.status(500).json({ ok: false, message: "Missing GITHUB_TOKEN environment variable." });
    return;
  }

  const requiredAdminKey = process.env.ADMIN_API_KEY;
  if (requiredAdminKey) {
    const providedAdminKey = getAdminBearerToken(req);
    if (providedAdminKey !== requiredAdminKey) {
      res.status(401).json({ ok: false, message: "Unauthorized admin request." });
      return;
    }
  }

  const repository = getRepositoryConfig();
  if (!repository) {
    res.status(500).json({
      ok: false,
      message:
        "Missing repository configuration. Set GITHUB_REPO_OWNER and GITHUB_REPO_NAME (or use Vercel Git integration variables).",
    });
    return;
  }

  let payload;
  try {
    payload = readBody(req);
  } catch {
    res.status(400).json({ ok: false, message: "Invalid JSON payload." });
    return;
  }

  const normalizedPayload = normalizeAdminStatsPayload(payload);
  if (!normalizedPayload) {
    res.status(400).json({ ok: false, message: "Invalid payload shape." });
    return;
  }

  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    "User-Agent": "cbtleague-admin",
  };
  const hasLeagueDataChanges =
    normalizedPayload.updates.length > 0 ||
    normalizedPayload.scheduleUpdate !== undefined ||
    (normalizedPayload.playerProfileUpdates?.length ?? 0) > 0;
  const hasManualOverallUpdates = (normalizedPayload.manualOverallUpdates?.length ?? 0) > 0;
  const hasHeadshotUploads = (normalizedPayload.headshotUploads?.length ?? 0) > 0;
  const treeEntries = [];
  const updatedPaths = [];
  let selectedStatsPath = "";

  if (hasLeagueDataChanges) {
    let statsFilePayload = null;
    let fileErrorStatus = 500;
    const fileErrorMessage = "Failed to fetch stats file from GitHub.";
    let fileErrorDetails = "Unknown GitHub API error";

    for (const candidatePath of repository.statsPathCandidates) {
      const contentResult = await fetchGitHubContent(headers, repository, candidatePath);

      if (contentResult.ok) {
        selectedStatsPath = candidatePath;
        statsFilePayload = contentResult;
        break;
      }

      fileErrorStatus = contentResult.status;
      fileErrorDetails = contentResult.message;
      if (contentResult.status !== 404) {
        break;
      }
    }

    if (!statsFilePayload) {
      res.status(fileErrorStatus).json({
        ok: false,
        message: fileErrorMessage,
        details: fileErrorDetails,
      });
      return;
    }

    let leagueData;
    try {
      leagueData = JSON.parse(statsFilePayload.decoded);
    } catch {
      res.status(500).json({ ok: false, message: "Failed to decode or parse stats JSON content." });
      return;
    }

    for (const profileUpdate of normalizedPayload.playerProfileUpdates ?? []) {
      const profileResult = applyPlayerProfileUpdate(
        leagueData,
        normalizedPayload.seasonId,
        profileUpdate
      );

      if (!profileResult.ok) {
        res.status(profileResult.status).json({
          ok: false,
          message: profileResult.message,
          details: profileResult.details,
        });
        return;
      }
    }

    for (const update of normalizedPayload.updates) {
      const updateResult = applyPlayerUpdate(
        leagueData,
        normalizedPayload.seasonId,
        normalizedPayload.gameNumber,
        update
      );

      if (!updateResult.ok) {
        res.status(updateResult.status).json({
          ok: false,
          message: updateResult.message,
          details: updateResult.details,
        });
        return;
      }
    }

    if (normalizedPayload.scheduleUpdate) {
      const scheduleUpdateResult = applyScheduleScoreUpdate(
        leagueData,
        normalizedPayload.seasonId,
        normalizedPayload.scheduleUpdate
      );

      if (!scheduleUpdateResult.ok) {
        res.status(scheduleUpdateResult.status).json({
          ok: false,
          message: scheduleUpdateResult.message,
          details: scheduleUpdateResult.details,
        });
        return;
      }
    }

    const recordUpdateResult = recalculateSeasonTeamRecords(
      leagueData,
      normalizedPayload.seasonId
    );

    if (!recordUpdateResult.ok) {
      res.status(recordUpdateResult.status).json({
        ok: false,
        message: recordUpdateResult.message,
        details: recordUpdateResult.details,
      });
      return;
    }

    const dataContent = `${JSON.stringify(leagueData, null, 2)}\n`;
    const summary = buildLeagueSummary(leagueData);
    const summaryContent = `${JSON.stringify(summary)}\n`;

    let dataBlobSha = "";
    let summaryBlobSha = "";
    try {
      dataBlobSha = await createGitHubBlob(headers, repository, dataContent);
      summaryBlobSha = await createGitHubBlob(headers, repository, summaryContent);
    } catch (error) {
      res.status(500).json({
        ok: false,
        message: "Failed to create GitHub blobs for updated data.",
        details: getErrorMessage(error),
      });
      return;
    }

    treeEntries.push(
      {
        path: selectedStatsPath,
        mode: "100644",
        type: "blob",
        sha: dataBlobSha,
      },
      {
        path: SUMMARY_PATH,
        mode: "100644",
        type: "blob",
        sha: summaryBlobSha,
      }
    );
    updatedPaths.push(selectedStatsPath, SUMMARY_PATH);
  }

  if (hasHeadshotUploads) {
    for (const upload of normalizedPayload.headshotUploads ?? []) {
      const fileName = sanitizeHeadshotFileName(upload.fileName, upload.playerName);
      let headshotBlobSha = "";

      try {
        headshotBlobSha = await createGitHubBlob(
          headers,
          repository,
          upload.contentBase64,
          "base64"
        );
      } catch (error) {
        res.status(500).json({
          ok: false,
          message: "Failed to create GitHub blob for uploaded headshot.",
          details: getErrorMessage(error),
        });
        return;
      }

      const headshotPath = `${HEADSHOTS_DIR}/${fileName}`;
      treeEntries.push({
        path: headshotPath,
        mode: "100644",
        type: "blob",
        sha: headshotBlobSha,
      });
      updatedPaths.push(headshotPath);
    }
  }

  if (hasManualOverallUpdates) {
    const manualContentResult = await fetchGitHubContent(headers, repository, MANUAL_OVERALLS_PATH);

    if (!manualContentResult.ok) {
      res.status(manualContentResult.status).json({
        ok: false,
        message: "Failed to fetch manual overalls file from GitHub.",
        details: manualContentResult.message,
      });
      return;
    }

    let manualSource;
    try {
      manualSource = updateManualSeasonOverallsSource(
        manualContentResult.decoded,
        normalizedPayload.seasonId,
        normalizedPayload.manualOverallUpdates ?? []
      );
    } catch (error) {
      res.status(400).json({
        ok: false,
        message: "Failed to update manual overalls source.",
        details: getErrorMessage(error),
      });
      return;
    }

    let manualBlobSha = "";
    try {
      manualBlobSha = await createGitHubBlob(headers, repository, manualSource.endsWith("\n") ? manualSource : `${manualSource}\n`);
    } catch (error) {
      res.status(500).json({
        ok: false,
        message: "Failed to create GitHub blob for manual overalls.",
        details: getErrorMessage(error),
      });
      return;
    }

    treeEntries.push({
      path: MANUAL_OVERALLS_PATH,
      mode: "100644",
      type: "blob",
      sha: manualBlobSha,
    });
    updatedPaths.push(MANUAL_OVERALLS_PATH);
  }

  if (treeEntries.length === 0) {
    res.status(400).json({ ok: false, message: "No admin changes to publish." });
    return;
  }

  const refResponse = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(
      repository.repo
    )}/git/ref/heads/${encodeURIComponent(repository.branch)}`,
    { headers }
  );
  const refPayload = await readJsonResponse(refResponse);
  if (!refResponse.ok || !isGitHubRefResponse(refPayload)) {
    res.status(refResponse.status).json({
      ok: false,
      message: "Failed to read repository ref from GitHub.",
      details: getGitHubErrorMessage(refPayload),
    });
    return;
  }

  const latestCommitSha = refPayload.object.sha;

  const commitLookupResponse = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(
      repository.repo
    )}/git/commits/${encodeURIComponent(latestCommitSha)}`,
    { headers }
  );
  const commitLookupPayload = await readJsonResponse(commitLookupResponse);
  if (!commitLookupResponse.ok || !isGitHubCommitResponse(commitLookupPayload)) {
    res.status(commitLookupResponse.status).json({
      ok: false,
      message: "Failed to read base commit tree from GitHub.",
      details: getGitHubErrorMessage(commitLookupPayload),
    });
    return;
  }

  const baseTreeSha = commitLookupPayload.tree.sha;

  const treeResponse = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}/git/trees`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeEntries,
      }),
    }
  );
  const treePayload = await readJsonResponse(treeResponse);
  if (!treeResponse.ok || !isShaResponse(treePayload)) {
    res.status(treeResponse.status).json({
      ok: false,
      message: "Failed to create GitHub tree for updated stats.",
      details: getGitHubErrorMessage(treePayload),
    });
    return;
  }

  const createCommitResponse = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}/git/commits`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: buildCommitMessage(normalizedPayload),
        tree: treePayload.sha,
        parents: [latestCommitSha],
      }),
    }
  );
  const createCommitPayload = await readJsonResponse(createCommitResponse);
  if (!createCommitResponse.ok || !isShaResponse(createCommitPayload)) {
    res.status(createCommitResponse.status).json({
      ok: false,
      message: "Failed to create GitHub commit for updated stats.",
      details: getGitHubErrorMessage(createCommitPayload),
    });
    return;
  }

  const updateRefResponse = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(
      repository.repo
    )}/git/refs/heads/${encodeURIComponent(repository.branch)}`,
    {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sha: createCommitPayload.sha,
      }),
    }
  );
  const updateRefPayload = await readJsonResponse(updateRefResponse);
  if (!updateRefResponse.ok) {
    res.status(updateRefResponse.status).json({
      ok: false,
      message: "Failed to update repository branch ref.",
      details: getGitHubErrorMessage(updateRefPayload),
    });
    return;
  }

  res.status(200).json({
    ok: true,
    message: "Stats updated and committed to GitHub.",
    commitSha: createCommitPayload.sha,
    path: [...new Set(updatedPaths)].join(", "),
    updatedPlayers: normalizedPayload.updates.length,
    updatedManualOveralls: normalizedPayload.manualOverallUpdates?.length ?? 0,
    updatedProfiles: normalizedPayload.playerProfileUpdates?.length ?? 0,
    uploadedHeadshots: normalizedPayload.headshotUploads?.length ?? 0,
  });
}
