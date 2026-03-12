import type { NextApiRequest, NextApiResponse } from "next";
import type {
  AdminPlayerGameUpdate,
  AdminStatsUpdatePayload,
  AdminStatsUpdateResponse,
} from "../../src/types/admin-api";
import type { BaseStats, LeagueData, PlayerStat } from "../../src/types/league";
import { buildLeagueSummary } from "../../src/lib/league-summary-builder";

const COMMIT_MESSAGE = "Update stats via admin panel";
const GITHUB_API_VERSION = "2022-11-28";
const DEFAULT_BRANCH = "main";
const DEFAULT_STATS_PATH = "data/stats.json";
const FALLBACK_STATS_PATH = "src/data/data.json";
const SUMMARY_PATH = "src/data/league-summary.json";
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

interface GitHubRefResponse {
  object: {
    sha: string;
  };
}

interface GitHubCommitResponse {
  tree: {
    sha: string;
  };
}

type PlayerUpdateResult =
  | { ok: true }
  | { ok: false; status: number; message: string; details?: string };

type LegacyAdminStatsUpdatePayload = {
  seasonId: string;
  teamName: string;
  playerName: string;
  opponent: string;
  gameNumber: string;
  gameLog: BaseStats;
};

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
    isNonEmptyString(value.gameNumber) &&
    Array.isArray(value.updates) &&
    value.updates.length > 0 &&
    value.updates.every(isAdminPlayerGameUpdate)
  );
}

function isAdminPlayerGameUpdate(value: unknown): value is AdminPlayerGameUpdate {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.teamName) &&
    isNonEmptyString(value.playerName) &&
    isNonEmptyString(value.opponent) &&
    isBaseStats(value.gameLog)
  );
}

function isLegacyAdminStatsUpdatePayload(value: unknown): value is LegacyAdminStatsUpdatePayload {
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

function isGitHubRefResponse(value: unknown): value is GitHubRefResponse {
  return isRecord(value) && isRecord(value.object) && typeof value.object.sha === "string";
}

function isGitHubCommitResponse(value: unknown): value is GitHubCommitResponse {
  return isRecord(value) && isRecord(value.tree) && typeof value.tree.sha === "string";
}

function isShaResponse(value: unknown): value is { sha: string } {
  return isRecord(value) && typeof value.sha === "string";
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
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

function hasRecordedOpponent(stat: PlayerStat): boolean {
  return typeof stat.opponent === "string" && stat.opponent.trim().length > 0;
}

function hasRecordedStats(stat: PlayerStat): boolean {
  return STAT_KEYS.some((key) => stat[key] > 0);
}

function getCompletedGamesPlayed(stats: PlayerStat[]): number {
  return stats.filter((stat) => hasRecordedOpponent(stat) || hasRecordedStats(stat)).length;
}

function applyPlayerUpdate(
  leagueData: LeagueData,
  seasonId: string,
  gameNumber: string,
  update: AdminPlayerGameUpdate
): PlayerUpdateResult {
  const season = leagueData.seasons[seasonId];
  if (!season) {
    return { ok: false, status: 404, message: "Season not found" };
  }

  const team = season.teams.find((candidate) => candidate.Team === update.teamName);
  if (!team) {
    return { ok: false, status: 404, message: "Team not found" };
  }

  const player = team.roster.find((candidate) => candidate.name === update.playerName);
  if (!player) {
    return { ok: false, status: 404, message: "Player not found" };
  }

  const nextStat: PlayerStat = {
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

  player.stats = existingStats.toSorted((a, b) => Number(a.game_number) - Number(b.game_number));
  player.GamesPlayed = getCompletedGamesPlayed(player.stats);

  return { ok: true };
}

function normalizeAdminStatsPayload(payload: unknown): AdminStatsUpdatePayload | null {
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
    };
  }

  return null;
}

function getAdminBearerToken(req: NextApiRequest): string | null {
  const header = req.headers.authorization;
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

async function createGitHubBlob(
  headers: Record<string, string>,
  repository: RepositoryConfig,
  content: string
): Promise<string> {
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
        encoding: "utf-8",
      }),
    }
  );

  const payload = await readJsonResponse(response);
  if (!response.ok || !isShaResponse(payload)) {
    throw new Error(`Failed to create GitHub blob: ${getGitHubErrorMessage(payload)}`);
  }

  return payload.sha;
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

  let payload: unknown;
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

  const encodedContent = Buffer.from(`${JSON.stringify(leagueData, null, 2)}\n`, "utf8").toString("base64");
  const summary = buildLeagueSummary(leagueData);
  const summaryContent = `${JSON.stringify(summary)}\n`;
  const dataContent = Buffer.from(encodedContent, "base64").toString("utf8");

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
        tree: [
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
          },
        ],
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
        message: `${COMMIT_MESSAGE} (${normalizedPayload.seasonId} / Game ${normalizedPayload.gameNumber})`,
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
    path: selectedStatsPath,
    updatedPlayers: normalizedPayload.updates.length,
  });
}
