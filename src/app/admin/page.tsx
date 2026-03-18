"use client";

import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Download,
  ImagePlus,
  Plus,
  RefreshCcw,
  Save,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from "lucide-react";
import PlayerHead from "@/components/league/player-head";
import { getSeasonData } from "@/lib/league-data";
import { getManualSeasonOveralls } from "@/lib/manual-player-overalls";
import { cn } from "@/lib/utils";
import type { AdminQueuedPublish, MatchupDraft, MatchupPlayerDraft } from "./admin-shared";
import {
  ADMIN_API_ENDPOINT,
  EMPTY_STAT_FORM,
  EMPTY_STATS,
  STAT_INPUT_COLUMNS,
  buildInitialMatchupDraft,
  buildPublishPayload,
  cloneMatchupDraft,
  getGameNumberFromWeek,
  getRowValidation,
  isRelativeAdminApiUrl,
  normalizeAdminApiUrl,
  normalizePlayerKey,
  readAdminSettings,
  readHeadshotFile,
  readMatchupDrafts,
  readQueuedPublishes,
  sanitizeHeadshotFileName,
  toCalculatedStats,
  toStatFormValue,
  writeAdminSettings,
  writeMatchupDrafts,
  writeQueuedPublishes,
} from "./admin-shared";
import type { AdminStatsUpdateResponse } from "@/types/admin-api";

type StatusState = {
  type: "success" | "error" | null;
  message: string;
};

type TeamTableProps = {
  seasonId: string;
  teamName: string;
  rows: MatchupPlayerDraft[];
  tone: "copper" | "sky";
  rowMessages: Record<string, string[]>;
  onAddPlayer: () => void;
  onPlayerNameChange: (rowId: string, value: string) => void;
  onNumberChange: (rowId: string, value: string) => void;
  onPlayerHeadChange: (rowId: string, value: string) => void;
  onOverallChange: (rowId: string, value: string) => void;
  onStatChange: (
    rowId: string,
    key: (typeof STAT_INPUT_COLUMNS)[number]["key"],
    value: string,
  ) => void;
  onHeadshotUpload: (rowId: string, event: ChangeEvent<HTMLInputElement>) => void;
  onClearHeadshot: (rowId: string) => void;
  onResetRow: (rowId: string) => void;
  onRemoveRow: (rowId: string) => void;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Failed to publish matchup";
}

function buildDraftKey(
  seasonId: string,
  gameNumber: string,
  homeTeam: string | undefined,
  awayTeam: string | undefined,
): string {
  return `${seasonId}:${gameNumber}:${homeTeam ?? "home"}:${awayTeam ?? "away"}`;
}

function buildManualOverallLookup(seasonId: string): Record<string, number> {
  return { ...getManualSeasonOveralls(seasonId) };
}

function createNewPlayerRow(
  draft: MatchupDraft,
  teamName: string,
): MatchupPlayerDraft {
  const opponent = teamName === draft.homeTeam ? draft.awayTeam : draft.homeTeam;
  const idSuffix = Math.random().toString(36).slice(2, 8);

  return {
    id: `new:${normalizePlayerKey(teamName)}:${idSuffix}`,
    teamName,
    opponent,
    playerName: "",
    originalPlayerName: "",
    number: "",
    originalNumber: "",
    playerHead: "",
    originalPlayerHead: "",
    statsForm: { ...EMPTY_STAT_FORM },
    originalStats: { ...EMPTY_STATS },
    overall: "",
    originalOverall: null,
    isNewPlayer: true,
    upload: null,
  };
}

function sanitizeDigits(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function parseStatInput(value: string): number {
  const trimmed = sanitizeDigits(value);
  if (!trimmed) return 0;

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isInteger(parsed) ? parsed : 0;
}

function buildPendingSummary(draft: MatchupDraft | null) {
  if (!draft) {
    return {
      stats: 0,
      scores: 0,
      overalls: 0,
      profiles: 0,
      headshots: 0,
      hasChanges: false,
      payload: null,
    };
  }

  const payload = buildPublishPayload(draft);
  const counts = {
    stats: payload.updates.length,
    scores: payload.scheduleUpdate ? 1 : 0,
    overalls: payload.manualOverallUpdates?.length ?? 0,
    profiles: payload.playerProfileUpdates?.length ?? 0,
    headshots: payload.headshotUploads?.length ?? 0,
  };

  return {
    ...counts,
    hasChanges:
      counts.stats > 0 ||
      counts.scores > 0 ||
      counts.overalls > 0 ||
      counts.profiles > 0 ||
      counts.headshots > 0,
    payload,
  };
}

function MatchupTeamTable({
  seasonId,
  teamName,
  rows,
  tone,
  rowMessages,
  onAddPlayer,
  onPlayerNameChange,
  onNumberChange,
  onPlayerHeadChange,
  onOverallChange,
  onStatChange,
  onHeadshotUpload,
  onClearHeadshot,
  onResetRow,
  onRemoveRow,
}: TeamTableProps) {
  const toneClasses =
    tone === "copper"
      ? {
          accent: "text-copper-400",
          chip: "border-copper-500/30 bg-copper-500/10 text-copper-100",
          button:
            "border-copper-500/30 bg-copper-500/10 text-copper-100 hover:border-copper-400/60 hover:bg-copper-500/20",
        }
      : {
          accent: "text-sky-400",
          chip: "border-sky-500/30 bg-sky-500/10 text-sky-100",
          button:
            "border-sky-500/30 bg-sky-500/10 text-sky-100 hover:border-sky-400/60 hover:bg-sky-500/20",
        };

  return (
    <section className="rounded-[2rem] border border-white/6 bg-zinc-950/60 p-5 shadow-[0_28px_80px_-56px_rgba(0,0,0,0.95)] sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className={cn("inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]", toneClasses.chip)}>
            {teamName}
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">
              Box Score Board
            </h2>
            <p className="text-sm text-zinc-500">
              Existing roster names stay locked. Use add player when someone new needs a profile, headshot, and stat line.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddPlayer}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors",
            toneClasses.button,
          )}
        >
          <Plus className="h-4 w-4" />
          Add Player
        </button>
      </div>

      <div className="overflow-x-auto rounded-[1.5rem] border border-white/6 bg-black/20">
        <table className="min-w-[1680px] w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
              <th className="px-4 py-4">Player</th>
              <th className="px-3 py-4">#</th>
              <th className="px-4 py-4">Headshot</th>
              <th className="px-3 py-4">OVR</th>
              {STAT_INPUT_COLUMNS.map((column) => (
                <th key={column.key} className={cn("px-2 py-4 text-center", column.tone)}>
                  {column.label}
                </th>
              ))}
              <th className="px-3 py-4 text-center">PTS</th>
              <th className="px-3 py-4 text-center">REB</th>
              <th className="px-4 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const totals = toCalculatedStats(row.statsForm);
              const messages = rowMessages[row.id] ?? [];
              const previewUrl = row.upload?.previewUrl ?? null;

              return (
                <tr
                  key={row.id}
                  className={cn(
                    "align-top text-sm text-white",
                    row.isNewPlayer ? "bg-white/[0.025]" : "bg-transparent",
                  )}
                >
                  <td className="border-t border-white/6 px-4 py-4">
                    <div className="flex min-w-[260px] gap-3">
                      <div className="shrink-0">
                        {previewUrl ? (
                          <Image
                            src={previewUrl}
                            alt={row.playerName || "New player"}
                            width={56}
                            height={56}
                            unoptimized
                            className="h-14 w-14 rounded-2xl border border-white/10 object-cover"
                          />
                        ) : (
                          <PlayerHead
                            playerName={row.playerName || "New Player"}
                            playerHead={row.playerHead}
                            seasonId={seasonId}
                            size={56}
                            className="rounded-2xl border border-white/10"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-2">
                        <input
                          type="text"
                          value={row.playerName}
                          onChange={(event) =>
                            onPlayerNameChange(row.id, event.target.value)
                          }
                          disabled={!row.isNewPlayer}
                          placeholder="Player name"
                          className={cn(
                            "w-full rounded-2xl border px-4 py-3 font-bold text-white transition-colors focus:outline-none focus:ring-2",
                            row.isNewPlayer
                              ? "border-white/10 bg-zinc-900/80 focus:ring-copper-500/40"
                              : "cursor-not-allowed border-white/5 bg-zinc-950/70 text-zinc-400",
                          )}
                        />
                        <div className="flex flex-wrap gap-2">
                          {row.isNewPlayer ? (
                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
                              New player
                            </span>
                          ) : (
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                              Existing roster
                            </span>
                          )}
                          {row.upload ? (
                            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-sky-200">
                              Image ready
                            </span>
                          ) : null}
                        </div>
                        {messages.length > 0 ? (
                          <div className="space-y-1">
                            {messages.map((message) => (
                              <p
                                key={`${row.id}-${message}`}
                                className="text-xs font-semibold text-red-300"
                              >
                                {message}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  <td className="border-t border-white/6 px-3 py-4">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={row.number}
                      onChange={(event) => onNumberChange(row.id, event.target.value)}
                      placeholder="00"
                      className="w-16 rounded-2xl border border-white/10 bg-zinc-900/80 px-3 py-3 text-center font-bold text-white focus:outline-none focus:ring-2 focus:ring-copper-500/40"
                    />
                  </td>

                  <td className="border-t border-white/6 px-4 py-4">
                    <div className="min-w-[230px] space-y-3">
                      <input
                        type="text"
                        value={row.playerHead}
                        onChange={(event) => onPlayerHeadChange(row.id, event.target.value)}
                        placeholder="player-head.jpg"
                        className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-copper-500/40"
                      />
                      <div className="flex gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition-colors hover:border-white/20 hover:bg-white/10">
                          <UploadCloud className="h-4 w-4" />
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => onHeadshotUpload(row.id, event)}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => onClearHeadshot(row.id)}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/80 px-3 py-2 text-xs font-bold text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
                        >
                          <ImagePlus className="h-4 w-4" />
                          Clear
                        </button>
                      </div>
                    </div>
                  </td>

                  <td className="border-t border-white/6 px-3 py-4">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={row.overall}
                      onChange={(event) => onOverallChange(row.id, event.target.value)}
                      placeholder="75"
                      className="w-20 rounded-2xl border border-white/10 bg-zinc-900/80 px-3 py-3 text-center font-bold text-white focus:outline-none focus:ring-2 focus:ring-copper-500/40"
                    />
                  </td>

                  {STAT_INPUT_COLUMNS.map((column) => (
                    <td
                      key={`${row.id}-${column.key}`}
                      className="border-t border-white/6 px-2 py-4 text-center"
                    >
                      <input
                        type="text"
                        inputMode="numeric"
                        value={row.statsForm[column.key]}
                        onChange={(event) =>
                          onStatChange(row.id, column.key, event.target.value)
                        }
                        className="w-16 rounded-2xl border border-white/10 bg-zinc-900/80 px-2 py-3 text-center font-bold text-white focus:outline-none focus:ring-2 focus:ring-copper-500/40"
                      />
                    </td>
                  ))}

                  <td className="border-t border-white/6 px-3 py-4 text-center">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 font-black text-white">
                      {totals.Points}
                    </div>
                  </td>

                  <td className="border-t border-white/6 px-3 py-4 text-center">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 font-black text-white">
                      {totals.Rebounds}
                    </div>
                  </td>

                  <td className="border-t border-white/6 px-4 py-4">
                    <div className="flex min-w-[130px] flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => onResetRow(row.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-zinc-900/80 px-3 py-2 text-xs font-bold text-zinc-200 transition-colors hover:border-white/20 hover:bg-zinc-900"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Reset
                      </button>
                      {row.isNewPlayer ? (
                        <button
                          type="button"
                          onClick={() => onRemoveRow(row.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200 transition-colors hover:border-red-400/40 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AdminPage() {
  const seasonId = "3";
  const season = getSeasonData(seasonId);

  const [selectedGameIdx, setSelectedGameIdx] = useState<number | "">("");
  const [matchupDrafts, setMatchupDrafts] = useState<Record<string, MatchupDraft>>({});
  const [manualOverallLookup, setManualOverallLookup] = useState<Record<string, number>>({});
  const [apiUrl, setApiUrl] = useState(ADMIN_API_ENDPOINT);
  const [adminKey, setAdminKey] = useState("");
  const [queuedCount, setQueuedCount] = useState(0);
  const [status, setStatus] = useState<StatusState>({ type: null, message: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const settings = readAdminSettings();
    setApiUrl(settings.apiUrl);
    setAdminKey(settings.adminKey);
    setMatchupDrafts(readMatchupDrafts());
    setQueuedCount(readQueuedPublishes().length);
    setManualOverallLookup(buildManualOverallLookup(seasonId));
  }, [seasonId]);

  useEffect(() => {
    writeAdminSettings({ apiUrl, adminKey });
  }, [adminKey, apiUrl]);

  useEffect(() => {
    writeMatchupDrafts(matchupDrafts);
  }, [matchupDrafts]);

  const games = useMemo(
    () => (season?.schedule ?? []).filter((game) => !game.isBye),
    [season],
  );
  const selectedGame = selectedGameIdx === "" ? null : games[selectedGameIdx] ?? null;
  const selectedGameNumber = useMemo(
    () =>
      selectedGameIdx === ""
        ? ""
        : getGameNumberFromWeek(selectedGame?.week, selectedGameIdx),
    [selectedGame, selectedGameIdx],
  );
  const selectedGameKey =
    selectedGame && selectedGameNumber
      ? buildDraftKey(
          seasonId,
          selectedGameNumber,
          selectedGame.homeTeam,
          selectedGame.awayTeam,
        )
      : "";

  useEffect(() => {
    if (!selectedGame || !selectedGameKey || !selectedGameNumber) return;

    setMatchupDrafts((previous) => {
      if (previous[selectedGameKey]) {
        return previous;
      }

      return {
        ...previous,
        [selectedGameKey]: buildInitialMatchupDraft({
          seasonId,
          gameNumber: selectedGameNumber,
          game: selectedGame,
          season,
          manualOverallLookup,
        }),
      };
    });
  }, [
    manualOverallLookup,
    season,
    seasonId,
    selectedGame,
    selectedGameKey,
    selectedGameNumber,
  ]);

  const currentDraft = selectedGameKey ? matchupDrafts[selectedGameKey] ?? null : null;
  const homeRows = useMemo(
    () =>
      currentDraft?.players.filter((row) => row.teamName === currentDraft.homeTeam) ?? [],
    [currentDraft],
  );
  const awayRows = useMemo(
    () =>
      currentDraft?.players.filter((row) => row.teamName === currentDraft.awayTeam) ?? [],
    [currentDraft],
  );

  const validationState = useMemo(() => {
    if (!currentDraft) {
      return {
        hasErrors: false,
        allMessages: [] as string[],
        rowMessages: {} as Record<string, string[]>,
      };
    }

    const duplicateCounts = new Map<string, number>();
    for (const row of currentDraft.players) {
      if (!row.playerName.trim()) continue;
      const key = `${normalizePlayerKey(row.teamName)}:${normalizePlayerKey(row.playerName)}`;
      duplicateCounts.set(key, (duplicateCounts.get(key) ?? 0) + 1);
    }

    const rowMessages: Record<string, string[]> = {};
    const allMessages: string[] = [];

    for (const row of currentDraft.players) {
      const nextMessages = [...getRowValidation(row).messages];
      const label = row.playerName.trim() || `${row.teamName} new player`;

      if (!row.playerName.trim()) {
        nextMessages.push(`${row.teamName}: player name is required.`);
      }

      if (row.playerName.trim()) {
        const duplicateKey = `${normalizePlayerKey(row.teamName)}:${normalizePlayerKey(row.playerName)}`;
        if ((duplicateCounts.get(duplicateKey) ?? 0) > 1) {
          nextMessages.push(`${label}: duplicate player name on ${row.teamName}.`);
        }
      }

      if (row.overall.trim()) {
        const parsedOverall = Number.parseInt(row.overall, 10);
        if (
          !Number.isInteger(parsedOverall) ||
          parsedOverall < 60 ||
          parsedOverall > 99
        ) {
          nextMessages.push(`${label}: overall must be between 60 and 99.`);
        }
      }

      rowMessages[row.id] = nextMessages;
      allMessages.push(...nextMessages);
    }

    const hasPartialScore =
      currentDraft.homeScore.trim().length > 0 ||
      currentDraft.awayScore.trim().length > 0;
    const hasCompleteScore =
      currentDraft.homeScore.trim().length > 0 &&
      currentDraft.awayScore.trim().length > 0;

    if (hasPartialScore && !hasCompleteScore) {
      allMessages.push("Enter both matchup scores to publish the scoreboard update.");
    }

    return {
      hasErrors: allMessages.length > 0,
      allMessages,
      rowMessages,
    };
  }, [currentDraft]);

  const pendingSummary = useMemo(
    () => buildPendingSummary(currentDraft),
    [currentDraft],
  );

  const normalizedApiUrl =
    normalizeAdminApiUrl(apiUrl) || normalizeAdminApiUrl(ADMIN_API_ENDPOINT);
  const isLocalHost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");
  const requiresHostedApi =
    typeof window !== "undefined" &&
    !isLocalHost &&
    isRelativeAdminApiUrl(normalizedApiUrl);
  const canPublish =
    Boolean(currentDraft) &&
    pendingSummary.hasChanges &&
    !validationState.hasErrors &&
    !isSaving &&
    !requiresHostedApi;

  function updateSelectedDraft(updater: (draft: MatchupDraft) => MatchupDraft) {
    if (!selectedGame || !selectedGameKey || !selectedGameNumber) return;

    setMatchupDrafts((previous) => {
      const current =
        previous[selectedGameKey] ??
        buildInitialMatchupDraft({
          seasonId,
          gameNumber: selectedGameNumber,
          game: selectedGame,
          season,
          manualOverallLookup,
        });

      return {
        ...previous,
        [selectedGameKey]: updater(cloneMatchupDraft(current)),
      };
    });
  }

  function updateRow(
    rowId: string,
    updater: (row: MatchupPlayerDraft) => MatchupPlayerDraft,
  ) {
    updateSelectedDraft((draft) => ({
      ...draft,
      players: draft.players.map((row) => (row.id === rowId ? updater(row) : row)),
    }));
  }

  function handleAddPlayer(teamName: string) {
    updateSelectedDraft((draft) => ({
      ...draft,
      players: [...draft.players, createNewPlayerRow(draft, teamName)],
    }));
  }

  function handleScoreChange(side: "homeScore" | "awayScore", value: string) {
    updateSelectedDraft((draft) => ({
      ...draft,
      [side]: sanitizeDigits(value),
    }));
  }

  function handlePlayerNameChange(rowId: string, value: string) {
    updateRow(rowId, (row) => ({
      ...row,
      playerName: value,
      playerHead:
        row.upload?.fileName ??
        (row.playerHead.trim()
          ? sanitizeHeadshotFileName(row.playerHead, value || row.playerName || "player")
          : ""),
    }));
  }

  function handleNumberChange(rowId: string, value: string) {
    updateRow(rowId, (row) => ({
      ...row,
      number: sanitizeDigits(value),
    }));
  }

  function handlePlayerHeadChange(rowId: string, value: string) {
    updateRow(rowId, (row) => ({
      ...row,
      playerHead: value,
    }));
  }

  function handleOverallChange(rowId: string, value: string) {
    updateRow(rowId, (row) => ({
      ...row,
      overall: sanitizeDigits(value).slice(0, 2),
    }));
  }

  function handleStatChange(
    rowId: string,
    key: (typeof STAT_INPUT_COLUMNS)[number]["key"],
    value: string,
  ) {
    updateRow(rowId, (row) => ({
      ...row,
      statsForm: {
        ...row.statsForm,
        [key]: parseStatInput(value),
      },
    }));
  }

  async function handleHeadshotUpload(
    rowId: string,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const selectedRow = currentDraft?.players.find((row) => row.id === rowId);
    const fallbackName = selectedRow?.playerName || "player";

    try {
      const upload = await readHeadshotFile(file, fallbackName);
      updateRow(rowId, (row) => ({
        ...row,
        playerHead: upload.fileName,
        upload,
      }));
      setStatus({
        type: "success",
        message: `Loaded ${upload.fileName} for ${fallbackName}.`,
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: getErrorMessage(error),
      });
    }
  }

  function handleClearHeadshot(rowId: string) {
    updateRow(rowId, (row) => ({
      ...row,
      playerHead: row.originalPlayerHead,
      upload: null,
    }));
  }

  function handleResetRow(rowId: string) {
    updateRow(rowId, (row) => ({
      ...row,
      playerName: row.originalPlayerName,
      number: row.originalNumber,
      playerHead: row.originalPlayerHead,
      statsForm: toStatFormValue(row.originalStats),
      overall:
        row.originalOverall === null ? "" : String(row.originalOverall),
      upload: null,
    }));
  }

  function handleRemoveRow(rowId: string) {
    updateSelectedDraft((draft) => ({
      ...draft,
      players: draft.players.filter((row) => row.id !== rowId),
    }));
  }

  function handleResetMatchup() {
    if (!selectedGame || !selectedGameKey || !selectedGameNumber) return;

    setMatchupDrafts((previous) => ({
      ...previous,
      [selectedGameKey]: buildInitialMatchupDraft({
        seasonId,
        gameNumber: selectedGameNumber,
        game: selectedGame,
        season,
        manualOverallLookup,
      }),
    }));
    setStatus({
      type: "success",
      message: "Reset the matchup draft back to the published roster and box score.",
    });
  }

  function handleExportQueuedPublishes() {
    const queuedPublishes = readQueuedPublishes();
    if (queuedPublishes.length === 0) {
      setStatus({
        type: "error",
        message: "No queued matchup publishes to export.",
      });
      return;
    }

    const blob = new Blob([JSON.stringify(queuedPublishes, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cbtleague-admin-queue-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setStatus({
      type: "success",
      message: `Exported ${queuedPublishes.length} queued publish payload${queuedPublishes.length === 1 ? "" : "s"}.`,
    });
  }

  async function handlePublishMatchup() {
    if (!currentDraft || !pendingSummary.payload) return;

    if (requiresHostedApi) {
      setStatus({
        type: "error",
        message: "Enter the Vercel admin API URL before publishing from the live site.",
      });
      return;
    }

    if (!pendingSummary.hasChanges) {
      setStatus({
        type: "error",
        message: "There are no matchup changes ready to publish yet.",
      });
      return;
    }

    if (validationState.hasErrors) {
      setStatus({
        type: "error",
        message: validationState.allMessages[0] ?? "Fix the row validation errors first.",
      });
      return;
    }

    setIsSaving(true);
    setStatus({ type: null, message: "" });

    try {
      if (!normalizedApiUrl) {
        throw new Error("Missing admin API URL.");
      }

      const response = await fetch(normalizedApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminKey.trim()
            ? { Authorization: `Bearer ${adminKey.trim()}` }
            : {}),
        },
        body: JSON.stringify(pendingSummary.payload),
      });

      const result = (await response.json()) as AdminStatsUpdateResponse;
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Failed to publish matchup");
      }

      setManualOverallLookup((previous) => ({
        ...previous,
        ...Object.fromEntries(
          (pendingSummary.payload.manualOverallUpdates ?? []).map((entry) => [
            normalizePlayerKey(entry.playerName),
            entry.overall,
          ]),
        ),
      }));

      setMatchupDrafts((previous) => {
        const existing = previous[selectedGameKey];
        if (!existing) return previous;

        const nextDraft = cloneMatchupDraft(existing);
        nextDraft.originalHomeScore = nextDraft.homeScore;
        nextDraft.originalAwayScore = nextDraft.awayScore;
        nextDraft.players = nextDraft.players.map((row) => {
          const parsedOverall = Number.parseInt(row.overall, 10);
          const normalizedHeadshot = row.playerHead.trim()
            ? sanitizeHeadshotFileName(row.playerHead, row.playerName || "player")
            : "";

          return {
            ...row,
            playerName: row.playerName.trim(),
            originalPlayerName: row.playerName.trim(),
            number: row.number.trim(),
            originalNumber: row.number.trim(),
            playerHead: normalizedHeadshot,
            originalPlayerHead: normalizedHeadshot,
            originalStats: toCalculatedStats(row.statsForm),
            originalOverall:
              Number.isInteger(parsedOverall) &&
              parsedOverall >= 60 &&
              parsedOverall <= 99
                ? parsedOverall
                : null,
            isNewPlayer: false,
            upload: null,
          };
        });

        return {
          ...previous,
          [selectedGameKey]: nextDraft,
        };
      });

      setStatus({
        type: "success",
        message: `Published the matchup to GitHub (${result.commitSha.slice(0, 7)}). ${result.updatedPlayers} stat row${result.updatedPlayers === 1 ? "" : "s"}, ${result.updatedProfiles} profile update${result.updatedProfiles === 1 ? "" : "s"}, ${result.uploadedHeadshots} headshot${result.uploadedHeadshots === 1 ? "" : "s"}, ${result.updatedManualOveralls} rating${result.updatedManualOveralls === 1 ? "" : "s"}.`,
      });
    } catch (error) {
      const queue = readQueuedPublishes();
      const label = currentDraft
        ? `${currentDraft.gameLabel}: ${currentDraft.homeTeam} vs ${currentDraft.awayTeam}`
        : "Queued matchup";
      const queuedPublish: AdminQueuedPublish = {
        savedAt: new Date().toISOString(),
        label,
        payload: pendingSummary.payload,
      };
      const nextQueue = [
        ...queue.filter((entry) => entry.label !== queuedPublish.label),
        queuedPublish,
      ];

      writeQueuedPublishes(nextQueue);
      setQueuedCount(nextQueue.length);
      setStatus({
        type: "error",
        message: `${getErrorMessage(error)}. The payload was queued locally for export.`,
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050507] text-white selection:bg-copper-500/30">
      <div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 lg:px-10">
        <header className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-zinc-500 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back To League
            </Link>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-copper-500/20 bg-copper-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-copper-100">
                Season 3 Admin
              </div>
              <h1 className="max-w-3xl text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">
                Matchup-by-matchup box scores, ratings, and player profile edits
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                Pick one game, fill out the full matchup board, and publish that entire game in one commit. This board also handles new players, jersey numbers, and headshot uploads.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.75rem] border border-white/6 bg-zinc-950/70 px-5 py-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-copper-400" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-600">
                    Active Season
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">2026 • Season 3</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/6 bg-zinc-950/70 px-5 py-4">
              <div className="flex items-center gap-3">
                <Save className="h-5 w-5 text-sky-400" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-600">
                    Draft Memory
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">
                    {Object.keys(matchupDrafts).length} saved matchup
                    {Object.keys(matchupDrafts).length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/6 bg-zinc-950/70 px-5 py-4">
              <div className="flex items-center gap-3">
                <UploadCloud className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-600">
                    Offline Queue
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">
                    {queuedCount} payload{queuedCount === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-white/6 bg-zinc-950/70 p-6 shadow-[0_28px_80px_-56px_rgba(0,0,0,0.95)]">
            <div className="mb-5 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-copper-400" />
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white">
                  Publishing Endpoint
                </h2>
                <p className="text-sm text-zinc-500">
                  Use the Vercel admin endpoint here when you’re on the live site or on mobile.
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-600">
                  Admin API URL
                </label>
                <input
                  type="url"
                  value={apiUrl}
                  onChange={(event) => setApiUrl(event.target.value)}
                  placeholder="https://your-vercel-project.vercel.app/api/admin/update-stats"
                  className="w-full rounded-[1.5rem] border border-white/10 bg-zinc-900/80 px-4 py-4 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-copper-500/40"
                />
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-600">
                  Admin Key
                </label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(event) => setAdminKey(event.target.value)}
                  placeholder="Optional bearer token"
                  className="w-full rounded-[1.5rem] border border-white/10 bg-zinc-900/80 px-4 py-4 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-copper-500/40"
                />
              </div>
            </div>

            {requiresHostedApi ? (
              <div className="mt-4 rounded-[1.5rem] border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
                Relative `/api/...` URLs will not work on the live static site. Paste the full Vercel endpoint before publishing.
              </div>
            ) : (
              <p className="mt-4 text-xs font-semibold text-zinc-500">
                These values stay in this browser so your friend can reuse them from a phone without touching the code.
              </p>
            )}
          </section>

          <section className="rounded-[2rem] border border-white/6 bg-zinc-950/70 p-6 shadow-[0_28px_80px_-56px_rgba(0,0,0,0.95)]">
            <div className="mb-5 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-sky-400" />
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white">
                  Matchup Selector
                </h2>
                <p className="text-sm text-zinc-500">
                  Each draft stays saved locally, so you can fill a game out in pieces and come back later.
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <select
                value={selectedGameIdx}
                onChange={(event) => {
                  setSelectedGameIdx(
                    event.target.value === ""
                      ? ""
                      : Number.parseInt(event.target.value, 10),
                  );
                  setStatus({ type: null, message: "" });
                }}
                className="w-full rounded-[1.5rem] border border-white/10 bg-zinc-900/80 px-4 py-4 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-copper-500/40"
              >
                <option value="">Choose a matchup...</option>
                {games.map((game, index) => (
                  <option key={`${game.week}-${game.homeTeam}-${game.awayTeam}-${index}`} value={index}>
                    {game.week}: {game.homeTeam} vs {game.awayTeam}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleExportQueuedPublishes}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition-colors hover:border-white/20 hover:bg-white/10"
              >
                <Download className="h-4 w-4" />
                Export Queue
              </button>
            </div>

            {selectedGame ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-600">
                    Home
                  </p>
                  <p className="mt-2 text-lg font-black uppercase tracking-tight text-white">
                    {selectedGame.homeTeam}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-600">
                    Away
                  </p>
                  <p className="mt-2 text-lg font-black uppercase tracking-tight text-white">
                    {selectedGame.awayTeam}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-600">
                    Draft Status
                  </p>
                  <p className="mt-2 text-lg font-black uppercase tracking-tight text-white">
                    {currentDraft ? "Loaded" : "Preparing"}
                  </p>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        {status.type ? (
          <div
            className={cn(
              "mt-6 flex items-start gap-3 rounded-[1.75rem] border px-5 py-4 text-sm",
              status.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
                : "border-red-500/20 bg-red-500/10 text-red-100",
            )}
          >
            {status.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <p>{status.message}</p>
          </div>
        ) : null}

        {!currentDraft ? (
          <section className="mt-6 rounded-[2rem] border border-dashed border-white/10 bg-zinc-950/60 p-12 text-center">
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">
              Choose a matchup to start
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
              The selected game will open with every player from both teams already loaded into one board, along with the current box score and any saved manual ratings.
            </p>
          </section>
        ) : (
          <div className="mt-6 space-y-6">
            <section className="rounded-[2rem] border border-white/6 bg-zinc-950/70 p-6 shadow-[0_28px_80px_-56px_rgba(0,0,0,0.95)]">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center rounded-full border border-copper-500/20 bg-copper-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-copper-100">
                    {currentDraft.gameLabel}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight text-white">
                      {currentDraft.homeTeam} vs {currentDraft.awayTeam}
                    </h2>
                    <p className="mt-2 text-sm text-zinc-500">
                      Publish the full matchup in one commit, including player stat lines, ratings, score, jersey numbers, and profile photos.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-600">
                      {currentDraft.homeTeam}
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={currentDraft.homeScore}
                      onChange={(event) =>
                        handleScoreChange("homeScore", event.target.value)
                      }
                      placeholder="0"
                      className="mt-3 w-full rounded-[1.25rem] border border-white/10 bg-zinc-900/80 px-4 py-4 text-3xl font-black text-white focus:outline-none focus:ring-2 focus:ring-copper-500/40"
                    />
                  </div>

                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-600">
                      {currentDraft.awayTeam}
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={currentDraft.awayScore}
                      onChange={(event) =>
                        handleScoreChange("awayScore", event.target.value)
                      }
                      placeholder="0"
                      className="mt-3 w-full rounded-[1.25rem] border border-white/10 bg-zinc-900/80 px-4 py-4 text-3xl font-black text-white focus:outline-none focus:ring-2 focus:ring-copper-500/40"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  { label: "Stat rows", value: pendingSummary.stats, tone: "text-white" },
                  { label: "Score updates", value: pendingSummary.scores, tone: "text-copper-200" },
                  { label: "Profile edits", value: pendingSummary.profiles, tone: "text-sky-200" },
                  { label: "Headshots", value: pendingSummary.headshots, tone: "text-emerald-200" },
                  { label: "Ratings", value: pendingSummary.overalls, tone: "text-white" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-600">
                      {item.label}
                    </p>
                    <p className={cn("mt-3 text-3xl font-black tracking-tight", item.tone)}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {validationState.allMessages.length > 0 ? (
                <div className="mt-6 rounded-[1.5rem] border border-red-500/20 bg-red-500/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-200">
                    Fix Before Publish
                  </p>
                  <div className="mt-3 space-y-2">
                    {validationState.allMessages.slice(0, 6).map((message) => (
                      <p key={message} className="text-sm text-red-100">
                        {message}
                      </p>
                    ))}
                    {validationState.allMessages.length > 6 ? (
                      <p className="text-sm text-red-200/80">
                        {validationState.allMessages.length - 6} more issues are highlighted in the table.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleResetMatchup}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition-colors hover:border-white/20 hover:bg-white/10"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Reset Matchup
                </button>
                <button
                  type="button"
                  onClick={handlePublishMatchup}
                  disabled={!canPublish}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-colors",
                    canPublish
                      ? "bg-copper-500 text-black hover:bg-copper-400"
                      : "cursor-not-allowed bg-zinc-800 text-zinc-500",
                  )}
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Publishing..." : "Publish Matchup"}
                </button>
              </div>
            </section>

            <MatchupTeamTable
              seasonId={seasonId}
              teamName={currentDraft.homeTeam}
              rows={homeRows}
              tone="copper"
              rowMessages={validationState.rowMessages}
              onAddPlayer={() => handleAddPlayer(currentDraft.homeTeam)}
              onPlayerNameChange={handlePlayerNameChange}
              onNumberChange={handleNumberChange}
              onPlayerHeadChange={handlePlayerHeadChange}
              onOverallChange={handleOverallChange}
              onStatChange={handleStatChange}
              onHeadshotUpload={handleHeadshotUpload}
              onClearHeadshot={handleClearHeadshot}
              onResetRow={handleResetRow}
              onRemoveRow={handleRemoveRow}
            />

            <MatchupTeamTable
              seasonId={seasonId}
              teamName={currentDraft.awayTeam}
              rows={awayRows}
              tone="sky"
              rowMessages={validationState.rowMessages}
              onAddPlayer={() => handleAddPlayer(currentDraft.awayTeam)}
              onPlayerNameChange={handlePlayerNameChange}
              onNumberChange={handleNumberChange}
              onPlayerHeadChange={handlePlayerHeadChange}
              onOverallChange={handleOverallChange}
              onStatChange={handleStatChange}
              onHeadshotUpload={handleHeadshotUpload}
              onClearHeadshot={handleClearHeadshot}
              onResetRow={handleResetRow}
              onRemoveRow={handleRemoveRow}
            />
          </div>
        )}
      </div>
    </div>
  );
}
