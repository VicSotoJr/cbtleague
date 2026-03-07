import type { NextApiRequest, NextApiResponse } from "next";
import type { AdminStatsUpdatePayload, AdminStatsUpdateResponse } from "../../src/types/admin-api";
import type { BaseStats, LeagueData, PlayerStat } from "../../src/types/league";

const COMMIT_MESSAGE = "Update stats via admin panel";
const GITHUB_API_VERSION = "2022-11-28";
const DEFAULT_BRANCH = "main";
const DEFAULT_STATS_PATH = "data/stats.json";
const FALLBACK_STATS_PATH = "src/data/data.json";
const STAT_KEYS: Array<keyof BaseStats> = [
  "Points",
  "FieldGoalsMade",
  "FieldGoalAttempts",
  "ThreesMade",
  "ThreesAttempts",
  "FreeThrowsMade",
  "FreeThrowsAttempts",
  "Rebounds",
  "Offrebounds",
  "Defrebounds",
  "Assists",
  "Blocks",
  "Steals",
  "Turnovers",
  "PersonalFouls",
];

interface GitHubContentResponse {
  sha: string;
  content: string;
  encoding: string;
  path: string;
}

interface RepositoryConfig {
  owner: string;
  repo: string;
  branch: string;
  statsPathCandidates: string[];
}

type PlayerUpdateResult =
  | { ok: true }
  | { ok: false; status: number; message: string; details?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isBaseStats(value: unknown): value is BaseStats {
  if (!isRecord(value)) return false;
  return STAT_KEYS.every((key) => isFiniteNumber(value[key]));
}

function isAdminStatsUpdatePayload(value: unknown): value is AdminStatsUpdatePayload {
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

function isGitHubContentResponse(value: unknown): value is GitHubContentResponse {
  if (!isRecord(value)) return false;
  return (
    typeof value.sha === "string" &&
    typeof value.content === "string" &&
    typeof value.encoding === "string" &&
    typeof value.path === "string"
  );
}

function setCorsHeaders(res: NextApiResponse): void {
  const allowedOrigin = process.env.ADMIN_ALLOWED_ORIGIN ?? "*";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function readBody(req: NextApiRequest): unknown {
  if (typeof req.body === "string") {
    return JSON.parse(req.body) as unknown;
  }
  return req.body;
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const raw = await response.text();
  if (!raw) return {};

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return { message: raw };
  }
}

function getGitHubErrorMessage(value: unknown): string {
  if (isRecord(value) && typeof value.message === "string") {
    return value.message;
  }
  return "Unknown GitHub API error";
}

function getRepositoryConfig(): RepositoryConfig | null {
  const owner = process.env.GITHUB_REPO_OWNER ?? process.env.VERCEL_GIT_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME ?? process.env.VERCEL_GIT_REPO_SLUG;
  if (!owner || !repo) return null;

  const configuredStatsPath = process.env.GITHUB_STATS_PATH;
  const statsPathCandidates = configuredStatsPath
    ? [configuredStatsPath]
    : [DEFAULT_STATS_PATH, FALLBACK_STATS_PATH];

  return {
    owner,
    repo,
    branch: process.env.GITHUB_BRANCH ?? DEFAULT_BRANCH,
    statsPathCandidates,
  };
}

function encodeGitHubPath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function toGameNumber(value: string): string | number {
  const trimmed = value.trim();
  const parsed = Number.parseInt(trimmed, 10);
  if (Number.isInteger(parsed) && `${parsed}` === trimmed) {
    return parsed;
  }
  return trimmed;
}

function applyPlayerUpdate(leagueData: LeagueData, payload: AdminStatsUpdatePayload): PlayerUpdateResult {
  const season = leagueData.seasons[payload.seasonId];
  if (!season) {
    return { ok: false, status: 404, message: "Season not found" };
  }

  const team = season.teams.find((candidate) => candidate.Team === payload.teamName);
  if (!team) {
    return { ok: false, status: 404, message: "Team not found" };
  }

  const player = team.roster.find((candidate) => candidate.name === payload.playerName);
  if (!player) {
    return { ok: false, status: 404, message: "Player not found" };
  }

  const nextStat: PlayerStat = {
    game_number: toGameNumber(payload.gameNumber),
    opponent: payload.opponent.trim(),
    ...payload.gameLog,
  };

  const existingStats = Array.isArray(player.stats) ? player.stats : [];
  const existingIndex = existingStats.findIndex(
    (entry) => String(entry.game_number) === String(nextStat.game_number) && entry.opponent === nextStat.opponent
  );

  if (existingIndex >= 0) {
    existingStats[existingIndex] = nextStat;
  } else {
    existingStats.push(nextStat);
  }

  player.stats = existingStats;
  player.GamesPlayed = existingStats.length;

  return { ok: true };
}

function getCommitSha(payload: unknown): string {
  if (!isRecord(payload)) return "";
  const commit = payload.commit;
  if (!isRecord(commit)) return "";
  return typeof commit.sha === "string" ? commit.sha : "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminStatsUpdateResponse>
): Promise<void> {
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

  const repository = getRepositoryConfig();
  if (!repository) {
    res.status(500).json({
      ok: false,
      message:
        "Missing repository configuration. Set GITHUB_REPO_OWNER and GITHUB_REPO_NAME (or use Vercel Git integration variables).",
    });
    return;
  }

  let payload: unknown;
  try {
    payload = readBody(req);
  } catch {
    res.status(400).json({ ok: false, message: "Invalid JSON payload." });
    return;
  }

  if (!isAdminStatsUpdatePayload(payload)) {
    res.status(400).json({ ok: false, message: "Invalid payload shape." });
    return;
  }

  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    "User-Agent": "cbtleague-admin",
  };

  let selectedStatsPath = "";
  let filePayload: GitHubContentResponse | null = null;
  let fileErrorStatus = 500;
  const fileErrorMessage = "Failed to fetch stats file from GitHub.";
  let fileErrorDetails = "Unknown GitHub API error";

  for (const candidatePath of repository.statsPathCandidates) {
    const encodedPath = encodeGitHubPath(candidatePath);
    const contentUrl = `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(
      repository.repo
    )}/contents/${encodedPath}?ref=${encodeURIComponent(repository.branch)}`;

    const response = await fetch(contentUrl, { method: "GET", headers });
    const payloadFromGitHub = await readJsonResponse(response);

    if (response.ok && isGitHubContentResponse(payloadFromGitHub) && payloadFromGitHub.encoding.toLowerCase() === "base64") {
      selectedStatsPath = candidatePath;
      filePayload = payloadFromGitHub;
      break;
    }

    fileErrorStatus = response.status;
    fileErrorDetails = getGitHubErrorMessage(payloadFromGitHub);
    if (response.status !== 404) {
      break;
    }
  }

  if (!filePayload) {
    res.status(fileErrorStatus).json({
      ok: false,
      message: fileErrorMessage,
      details: fileErrorDetails,
    });
    return;
  }

  let leagueData: LeagueData;
  try {
    const decoded = Buffer.from(filePayload.content.replace(/\n/g, ""), "base64").toString("utf8");
    leagueData = JSON.parse(decoded) as LeagueData;
  } catch {
    res.status(500).json({ ok: false, message: "Failed to decode or parse stats JSON content." });
    return;
  }

  const updateResult = applyPlayerUpdate(leagueData, payload);
  if (!updateResult.ok) {
    res.status(updateResult.status).json({
      ok: false,
      message: updateResult.message,
      details: updateResult.details,
    });
    return;
  }

  const encodedContent = Buffer.from(`${JSON.stringify(leagueData, null, 2)}\n`, "utf8").toString("base64");
  const updatePath = encodeGitHubPath(selectedStatsPath);
  const updateUrl = `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(
    repository.repo
  )}/contents/${updatePath}`;

  const commitResponse = await fetch(updateUrl, {
    method: "PUT",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: COMMIT_MESSAGE,
      content: encodedContent,
      sha: filePayload.sha,
      branch: repository.branch,
    }),
  });

  const commitPayload = await readJsonResponse(commitResponse);
  if (!commitResponse.ok) {
    res.status(commitResponse.status).json({
      ok: false,
      message: "Failed to commit updated stats to GitHub.",
      details: getGitHubErrorMessage(commitPayload),
    });
    return;
  }

  res.status(200).json({
    ok: true,
    message: "Stats updated and committed to GitHub.",
    commitSha: getCommitSha(commitPayload),
    path: selectedStatsPath,
  });
}
