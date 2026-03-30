"use client";

import type {
  AdminDeletedPlayer,
  AdminHeadshotUpload,
  AdminPlayerProfileUpdate,
  AdminStatsUpdatePayload,
} from "@/types/admin-api";
import type { BaseStats, GameEntry, Player, Season, Team } from "@/types/league";

export const LOCAL_ADMIN_SETTINGS_KEY = "cbtleague-admin-settings";
export const LOCAL_MATCHUP_DRAFTS_KEY = "cbtleague-admin-matchup-drafts";
export const LOCAL_QUEUED_PUBLISHES_KEY = "cbtleague-admin-queued-publishes";
export const ADMIN_API_ENDPOINT =
  process.env.NEXT_PUBLIC_ADMIN_API_URL ?? "/api/admin/update-stats";

export const EMPTY_STATS: BaseStats = {
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

export type AdminStatForm = {
  TwoPointMade: number;
  TwoPointAttempts: number;
  ThreesMade: number;
  ThreesAttempts: number;
  FreeThrowsMade: number;
  FreeThrowsAttempts: number;
  Offrebounds: number;
  Defrebounds: number;
  Assists: number;
  Blocks: number;
  Steals: number;
  Turnovers: number;
  PersonalFouls: number;
};

export const EMPTY_STAT_FORM: AdminStatForm = {
  TwoPointMade: 0,
  TwoPointAttempts: 0,
  ThreesMade: 0,
  ThreesAttempts: 0,
  FreeThrowsMade: 0,
  FreeThrowsAttempts: 0,
  Offrebounds: 0,
  Defrebounds: 0,
  Assists: 0,
  Blocks: 0,
  Steals: 0,
  Turnovers: 0,
  PersonalFouls: 0,
};

export const STAT_INPUT_COLUMNS: Array<{
  key: keyof AdminStatForm;
  label: string;
  tone?: string;
}> = [
  { key: "TwoPointMade", label: "2PM", tone: "text-copper-400" },
  { key: "TwoPointAttempts", label: "2PA" },
  { key: "ThreesMade", label: "3PM", tone: "text-sky-400" },
  { key: "ThreesAttempts", label: "3PA" },
  { key: "FreeThrowsMade", label: "FTM", tone: "text-emerald-400" },
  { key: "FreeThrowsAttempts", label: "FTA" },
  { key: "Offrebounds", label: "OREB" },
  { key: "Defrebounds", label: "DREB" },
  { key: "Assists", label: "AST" },
  { key: "Blocks", label: "BLK" },
  { key: "Steals", label: "STL" },
  { key: "Turnovers", label: "TOV" },
  { key: "PersonalFouls", label: "PF" },
];

export type AdminSettings = {
  apiUrl: string;
  adminKey: string;
};

export type HeadshotUploadDraft = {
  fileName: string;
  contentBase64: string;
  previewUrl: string;
};

export type MatchupPlayerDraft = {
  id: string;
  teamName: string;
  opponent: string;
  playerName: string;
  originalPlayerName: string;
  number: string;
  originalNumber: string;
  playerHead: string;
  originalPlayerHead: string;
  statsForm: AdminStatForm;
  originalStats: BaseStats;
  overall: string;
  originalOverall: number | null;
  isNewPlayer: boolean;
  upload: HeadshotUploadDraft | null;
};

export type MatchupDraft = {
  seasonId: string;
  gameNumber: string;
  gameLabel: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: string;
  awayScore: string;
  originalHomeScore: string;
  originalAwayScore: string;
  players: MatchupPlayerDraft[];
  deletedPlayers: AdminDeletedPlayer[];
};

export type AdminQueuedPublish = {
  savedAt: string;
  label: string;
  payload: AdminStatsUpdatePayload;
};

type BuildMatchupDraftArgs = {
  seasonId: string;
  gameNumber: string;
  game: GameEntry;
  season: Season | null | undefined;
  manualOverallLookup: Record<string, number>;
};

export function normalizePlayerKey(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeFileKey(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeShotBreakdown(base: BaseStats): { twoPM: number; twoPA: number } {
  const pointsFromInclusive =
    (base.FieldGoalsMade - base.ThreesMade) * 2 + base.ThreesMade * 3 + base.FreeThrowsMade;
  const pointsFromSeparate =
    base.FieldGoalsMade * 2 + base.ThreesMade * 3 + base.FreeThrowsMade;
  const isInclusive =
    Math.abs(pointsFromInclusive - base.Points) <
    Math.abs(pointsFromSeparate - base.Points);

  const totalFGM = isInclusive
    ? base.FieldGoalsMade
    : base.FieldGoalsMade + base.ThreesMade;
  const totalFGA = isInclusive
    ? base.FieldGoalAttempts
    : base.FieldGoalAttempts + base.ThreesAttempts;

  return {
    twoPM: Math.max(0, totalFGM - base.ThreesMade),
    twoPA: Math.max(0, totalFGA - base.ThreesAttempts),
  };
}

export function toStatsValue(log?: Partial<BaseStats>): BaseStats {
  return {
    Points: log?.Points ?? 0,
    FieldGoalsMade: log?.FieldGoalsMade ?? 0,
    FieldGoalAttempts: log?.FieldGoalAttempts ?? 0,
    ThreesMade: log?.ThreesMade ?? 0,
    ThreesAttempts: log?.ThreesAttempts ?? 0,
    FreeThrowsMade: log?.FreeThrowsMade ?? 0,
    FreeThrowsAttempts: log?.FreeThrowsAttempts ?? 0,
    Rebounds: log?.Rebounds ?? 0,
    Offrebounds: log?.Offrebounds ?? 0,
    Defrebounds: log?.Defrebounds ?? 0,
    Assists: log?.Assists ?? 0,
    Blocks: log?.Blocks ?? 0,
    Steals: log?.Steals ?? 0,
    Turnovers: log?.Turnovers ?? 0,
    PersonalFouls: log?.PersonalFouls ?? 0,
  };
}

export function toStatFormValue(log?: Partial<BaseStats>): AdminStatForm {
  const base = toStatsValue(log);
  const { twoPM, twoPA } = normalizeShotBreakdown(base);

  return {
    TwoPointMade: twoPM,
    TwoPointAttempts: twoPA,
    ThreesMade: base.ThreesMade,
    ThreesAttempts: base.ThreesAttempts,
    FreeThrowsMade: base.FreeThrowsMade,
    FreeThrowsAttempts: base.FreeThrowsAttempts,
    Offrebounds: base.Offrebounds,
    Defrebounds: base.Defrebounds,
    Assists: base.Assists,
    Blocks: base.Blocks,
    Steals: base.Steals,
    Turnovers: base.Turnovers,
    PersonalFouls: base.PersonalFouls,
  };
}

export function toCalculatedStats(form: AdminStatForm): BaseStats {
  const points = form.TwoPointMade * 2 + form.ThreesMade * 3 + form.FreeThrowsMade;
  const fieldGoalsMade = form.TwoPointMade + form.ThreesMade;
  const fieldGoalAttempts = form.TwoPointAttempts + form.ThreesAttempts;
  const rebounds = form.Offrebounds + form.Defrebounds;

  return {
    Points: points,
    FieldGoalsMade: fieldGoalsMade,
    FieldGoalAttempts: fieldGoalAttempts,
    ThreesMade: form.ThreesMade,
    ThreesAttempts: form.ThreesAttempts,
    FreeThrowsMade: form.FreeThrowsMade,
    FreeThrowsAttempts: form.FreeThrowsAttempts,
    Rebounds: rebounds,
    Offrebounds: form.Offrebounds,
    Defrebounds: form.Defrebounds,
    Assists: form.Assists,
    Blocks: form.Blocks,
    Steals: form.Steals,
    Turnovers: form.Turnovers,
    PersonalFouls: form.PersonalFouls,
  };
}

export function toScoreValue(value: string | number | undefined): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return /^\d+$/.test(trimmed) ? trimmed : "";
  }

  return "";
}

export function normalizeAdminApiUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.endsWith("/api/admin/update-stats")) {
    return `${trimmed}/`;
  }

  return trimmed;
}

export function isRelativeAdminApiUrl(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//");
}

export function getGameNumberFromWeek(
  weekLabel: string | undefined,
  fallbackIndex: number,
): string {
  const match = weekLabel?.match(/^Week\s+(\d+)/i);
  if (match) {
    return match[1];
  }

  return String(fallbackIndex + 1);
}

export function readAdminSettings(): AdminSettings {
  if (typeof window === "undefined") {
    return { apiUrl: ADMIN_API_ENDPOINT, adminKey: "" };
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_ADMIN_SETTINGS_KEY);
    if (!raw) {
      return { apiUrl: normalizeAdminApiUrl(ADMIN_API_ENDPOINT), adminKey: "" };
    }

    const parsed = JSON.parse(raw) as Partial<AdminSettings>;
    return {
      apiUrl:
        typeof parsed.apiUrl === "string" && parsed.apiUrl.trim()
          ? normalizeAdminApiUrl(parsed.apiUrl)
          : normalizeAdminApiUrl(ADMIN_API_ENDPOINT),
      adminKey: typeof parsed.adminKey === "string" ? parsed.adminKey : "",
    };
  } catch {
    return { apiUrl: normalizeAdminApiUrl(ADMIN_API_ENDPOINT), adminKey: "" };
  }
}

export function writeAdminSettings(settings: AdminSettings): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    LOCAL_ADMIN_SETTINGS_KEY,
    JSON.stringify({
      ...settings,
      apiUrl: normalizeAdminApiUrl(settings.apiUrl),
    }),
  );
}

export function readMatchupDrafts(): Record<string, MatchupDraft> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(LOCAL_MATCHUP_DRAFTS_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, MatchupDraft>;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([key, draft]) => [
        key,
        {
          ...draft,
          deletedPlayers: Array.isArray(draft.deletedPlayers)
            ? draft.deletedPlayers
            : [],
          originalHomeScore:
            typeof draft.originalHomeScore === "string"
              ? draft.originalHomeScore
              : draft.homeScore ?? "",
          originalAwayScore:
            typeof draft.originalAwayScore === "string"
              ? draft.originalAwayScore
              : draft.awayScore ?? "",
        },
      ]),
    );
  } catch {
    return {};
  }
}

export function writeMatchupDrafts(
  drafts: Record<string, MatchupDraft>,
): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    LOCAL_MATCHUP_DRAFTS_KEY,
    JSON.stringify(drafts, null, 2),
  );
}

export function readQueuedPublishes(): AdminQueuedPublish[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_QUEUED_PUBLISHES_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as AdminQueuedPublish[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeQueuedPublishes(queue: AdminQueuedPublish[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    LOCAL_QUEUED_PUBLISHES_KEY,
    JSON.stringify(queue, null, 2),
  );
}

function buildDraftPlayer(
  team: Team,
  player: Player,
  gameNumber: string,
  opponent: string,
  manualOverallLookup: Record<string, number>,
): MatchupPlayerDraft {
  const existingLog =
    player.stats?.find(
      (entry) =>
        String(entry.game_number) === gameNumber &&
        (entry.opponent === opponent || entry.opponent.trim() === ""),
    ) ?? null;

  return {
    id: `existing:${normalizePlayerKey(team.Team)}:${normalizePlayerKey(player.name)}`,
    teamName: team.Team,
    opponent,
    playerName: player.name,
    originalPlayerName: player.name,
    number: String(player.number ?? ""),
    originalNumber: String(player.number ?? ""),
    playerHead: player.PlayerHead ?? "",
    originalPlayerHead: player.PlayerHead ?? "",
    statsForm: toStatFormValue(existingLog ?? EMPTY_STATS),
    originalStats: toStatsValue(existingLog ?? EMPTY_STATS),
    overall:
      manualOverallLookup[normalizePlayerKey(player.name)] !== undefined
        ? String(manualOverallLookup[normalizePlayerKey(player.name)])
        : "",
    originalOverall:
      manualOverallLookup[normalizePlayerKey(player.name)] ?? null,
    isNewPlayer: false,
    upload: null,
  };
}

export function buildInitialMatchupDraft({
  seasonId,
  gameNumber,
  game,
  season,
  manualOverallLookup,
}: BuildMatchupDraftArgs): MatchupDraft {
  const homeTeam =
    season?.teams.find((team) => team.Team === game.homeTeam) ?? null;
  const awayTeam =
    season?.teams.find((team) => team.Team === game.awayTeam) ?? null;

  const homePlayers = homeTeam
    ? homeTeam.roster.map((player) =>
        buildDraftPlayer(
          homeTeam,
          player,
          gameNumber,
          game.awayTeam ?? "",
          manualOverallLookup,
        ),
      )
    : [];

  const awayPlayers = awayTeam
    ? awayTeam.roster.map((player) =>
        buildDraftPlayer(
          awayTeam,
          player,
          gameNumber,
          game.homeTeam ?? "",
          manualOverallLookup,
        ),
      )
    : [];

  return {
    seasonId,
    gameNumber,
    gameLabel: game.week,
    homeTeam: game.homeTeam ?? "Home Team",
    awayTeam: game.awayTeam ?? "Away Team",
    homeScore: toScoreValue(game.homeScore),
    awayScore: toScoreValue(game.awayScore),
    originalHomeScore: toScoreValue(game.homeScore),
    originalAwayScore: toScoreValue(game.awayScore),
    players: [...homePlayers, ...awayPlayers],
    deletedPlayers: [],
  };
}

export function cloneMatchupDraft(draft: MatchupDraft): MatchupDraft {
  return {
    ...draft,
    players: draft.players.map((row) => ({
      ...row,
      statsForm: { ...row.statsForm },
      originalStats: { ...row.originalStats },
      upload: row.upload ? { ...row.upload } : null,
    })),
    deletedPlayers: draft.deletedPlayers.map((player) => ({ ...player })),
  };
}

export function getRowValidation(row: MatchupPlayerDraft): {
  hasErrors: boolean;
  messages: string[];
} {
  const messages = [
    row.statsForm.TwoPointMade > row.statsForm.TwoPointAttempts
      ? `${row.playerName}: 2PM cannot be greater than 2PA.`
      : null,
    row.statsForm.ThreesMade > row.statsForm.ThreesAttempts
      ? `${row.playerName}: 3PM cannot be greater than 3PA.`
      : null,
    row.statsForm.FreeThrowsMade > row.statsForm.FreeThrowsAttempts
      ? `${row.playerName}: FTM cannot be greater than FTA.`
      : null,
  ].filter((message): message is string => Boolean(message));

  return { hasErrors: messages.length > 0, messages };
}

export function sanitizeHeadshotFileName(
  rawValue: string,
  fallbackPlayerName: string,
): string {
  const trimmed = rawValue
    .trim()
    .replace(/^.*[\\/]/, "")
    .replace(/[?#].*$/, "");

  const extMatch = trimmed.match(/\.([a-z0-9]+)$/i);
  const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : ".jpg";
  const baseValue = (extMatch ? trimmed.slice(0, -ext.length) : trimmed) || fallbackPlayerName;
  const base = baseValue
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base || "player-headshot"}${ext}`;
}

export async function readHeadshotFile(
  file: File,
  fallbackPlayerName: string,
): Promise<HeadshotUploadDraft> {
  const fileName = sanitizeHeadshotFileName(file.name, fallbackPlayerName);

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Failed to read image file."));
    };
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });

  const contentBase64 = dataUrl.split(",")[1] ?? "";
  if (!contentBase64) {
    throw new Error("Failed to decode image upload.");
  }

  return {
    fileName,
    contentBase64,
    previewUrl: dataUrl,
  };
}

export function rowsToProfileUpdates(
  rows: MatchupPlayerDraft[],
): AdminPlayerProfileUpdate[] {
  return rows
    .filter(
      (row) =>
        row.isNewPlayer ||
        row.number !== row.originalNumber ||
        normalizeFileKey(row.playerHead) !== normalizeFileKey(row.originalPlayerHead),
    )
    .map((row) => ({
      teamName: row.teamName,
      playerName: row.playerName.trim(),
      number: row.number.trim(),
      playerHead: row.playerHead.trim()
        ? sanitizeHeadshotFileName(row.playerHead, row.playerName)
        : "",
    }));
}

export function rowsToHeadshotUploads(
  rows: MatchupPlayerDraft[],
): AdminHeadshotUpload[] {
  return rows
    .filter((row) => row.upload)
    .map((row) => ({
      playerName: row.playerName.trim(),
      fileName: row.upload!.fileName,
      contentBase64: row.upload!.contentBase64,
    }));
}

function statsEqual(left: BaseStats, right: BaseStats): boolean {
  return (
    left.Points === right.Points &&
    left.FieldGoalsMade === right.FieldGoalsMade &&
    left.FieldGoalAttempts === right.FieldGoalAttempts &&
    left.ThreesMade === right.ThreesMade &&
    left.ThreesAttempts === right.ThreesAttempts &&
    left.FreeThrowsMade === right.FreeThrowsMade &&
    left.FreeThrowsAttempts === right.FreeThrowsAttempts &&
    left.Rebounds === right.Rebounds &&
    left.Offrebounds === right.Offrebounds &&
    left.Defrebounds === right.Defrebounds &&
    left.Assists === right.Assists &&
    left.Blocks === right.Blocks &&
    left.Steals === right.Steals &&
    left.Turnovers === right.Turnovers &&
    left.PersonalFouls === right.PersonalFouls
  );
}

export function buildPublishPayload(
  draft: MatchupDraft,
): AdminStatsUpdatePayload {
  const updates = draft.players
    .map((row) => ({
      row,
      gameLog: toCalculatedStats(row.statsForm),
    }))
    .filter(({ row, gameLog }) => row.isNewPlayer || !statsEqual(gameLog, row.originalStats))
    .map(({ row, gameLog }) => ({
      teamName: row.teamName,
      playerName: row.playerName.trim(),
      opponent: row.opponent,
      gameLog,
    }));

  const manualOverallUpdates = draft.players
    .map((row) => {
      const parsed = Number.parseInt(row.overall, 10);
      if (!Number.isInteger(parsed) || parsed < 60 || parsed > 99) {
        return null;
      }

      if (!row.isNewPlayer && row.originalOverall === parsed) {
        return null;
      }

      return {
        playerName: row.playerName.trim(),
        overall: parsed,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const playerProfileUpdates = rowsToProfileUpdates(draft.players);
  const headshotUploads = rowsToHeadshotUploads(draft.players);
  const hasManualScore =
    draft.homeScore.trim().length > 0 && draft.awayScore.trim().length > 0;
  const hasScoreChange =
    hasManualScore &&
    (draft.homeScore !== draft.originalHomeScore ||
      draft.awayScore !== draft.originalAwayScore);

  return {
    seasonId: draft.seasonId,
    gameNumber: draft.gameNumber,
    updates,
    scheduleUpdate: hasScoreChange
      ? {
          week: draft.gameLabel,
          homeTeam: draft.homeTeam,
          awayTeam: draft.awayTeam,
          homeScore: Number.parseInt(draft.homeScore, 10),
          awayScore: Number.parseInt(draft.awayScore, 10),
        }
      : undefined,
    manualOverallUpdates:
      manualOverallUpdates.length > 0 ? manualOverallUpdates : undefined,
    playerProfileUpdates:
      playerProfileUpdates.length > 0 ? playerProfileUpdates : undefined,
    headshotUploads: headshotUploads.length > 0 ? headshotUploads : undefined,
    deletedPlayers:
      draft.deletedPlayers.length > 0 ? draft.deletedPlayers : undefined,
  };
}
