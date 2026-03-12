"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Calendar, CheckCircle2, Download, Save, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSeasonData } from "@/lib/league-data";
import type {
  AdminPlayerGameUpdate,
  AdminStatsUpdatePayload,
  AdminStatsUpdateResponse,
} from "@/types/admin-api";
import type { BaseStats, Team } from "@/types/league";

const LOCAL_GAME_DRAFTS_KEY = "cbtleague-admin-game-drafts";
const LOCAL_QUEUED_GAMES_KEY = "cbtleague-admin-queued-games";
const LOCAL_ADMIN_SETTINGS_KEY = "cbtleague-admin-settings";
const ADMIN_API_ENDPOINT = process.env.NEXT_PUBLIC_ADMIN_API_URL ?? "/api/admin/update-stats";

type StatKey = keyof BaseStats;

const EMPTY_STATS: BaseStats = {
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

type AdminGameDraft = {
  seasonId: string;
  gameNumber: string;
  gameLabel: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: string;
  awayScore: string;
  updates: AdminPlayerGameUpdate[];
};

type AdminQueuedGameUpdate = AdminGameDraft & {
  savedAt: string;
};

type AdminSettings = {
  apiUrl: string;
  adminKey: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Failed to publish game";
}

function normalizeAdminApiUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.endsWith("/api/admin/update-stats")) {
    return `${trimmed}/`;
  }

  return trimmed;
}

function getGameNumberFromWeek(weekLabel: string | undefined, fallbackIndex: number): string {
  const match = weekLabel?.match(/^Week\s+(\d+)/i);
  if (match) {
    return match[1];
  }

  return String(fallbackIndex + 1);
}

function toStatsValue(log?: Partial<BaseStats>): BaseStats {
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

function toScoreValue(value: string | number | undefined): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return /^\d+$/.test(trimmed) ? trimmed : "";
  }

  return "";
}

function readGameDrafts(): Record<string, AdminGameDraft> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(LOCAL_GAME_DRAFTS_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, AdminGameDraft>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeGameDrafts(drafts: Record<string, AdminGameDraft>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_GAME_DRAFTS_KEY, JSON.stringify(drafts));
}

function readQueuedGames(): AdminQueuedGameUpdate[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_QUEUED_GAMES_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as AdminQueuedGameUpdate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueuedGames(games: AdminQueuedGameUpdate[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_QUEUED_GAMES_KEY, JSON.stringify(games, null, 2));
}

function readAdminSettings(): AdminSettings {
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

function writeAdminSettings(settings: AdminSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    LOCAL_ADMIN_SETTINGS_KEY,
    JSON.stringify({
      ...settings,
      apiUrl: normalizeAdminApiUrl(settings.apiUrl),
    })
  );
}

function buildDraftKey(seasonId: string, gameNumber: string, homeTeam?: string, awayTeam?: string): string {
  return `${seasonId}:${gameNumber}:${homeTeam ?? "home"}:${awayTeam ?? "away"}`;
}

function buildDraftFromGame(args: {
  seasonId: string;
  gameNumber: string;
  gameLabel: string;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: string | number;
  awayScore?: string | number;
  updates?: AdminPlayerGameUpdate[];
}): AdminGameDraft {
  return {
    seasonId: args.seasonId,
    gameNumber: args.gameNumber,
    gameLabel: args.gameLabel,
    homeTeam: args.homeTeam ?? "Home Team",
    awayTeam: args.awayTeam ?? "Away Team",
    homeScore: toScoreValue(args.homeScore),
    awayScore: toScoreValue(args.awayScore),
    updates: args.updates ?? [],
  };
}

function findExistingGameLog(args: {
  season: ReturnType<typeof getSeasonData> | null | undefined;
  selectedTeam: string;
  selectedPlayer: string;
  selectedGameNumber: string;
  opponent: string;
}): BaseStats | null {
  const team = args.season?.teams.find((candidate: Team) => candidate.Team === args.selectedTeam);
  const player = team?.roster.find((candidate) => candidate.name === args.selectedPlayer);
  const existingLog = player?.stats?.find(
    (entry) =>
      String(entry.game_number) === args.selectedGameNumber &&
      (entry.opponent === args.opponent || entry.opponent.trim() === "")
  );

  return existingLog ? toStatsValue(existingLog) : null;
}

export default function AdminPage() {
  const seasonId = "3";
  const season = getSeasonData(seasonId);

  const [selectedGameIdx, setSelectedGameIdx] = useState<number | "">("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const [gameDrafts, setGameDrafts] = useState<Record<string, AdminGameDraft>>({});
  const [apiUrl, setApiUrl] = useState(ADMIN_API_ENDPOINT);
  const [adminKey, setAdminKey] = useState("");
  const [stats, setStats] = useState<BaseStats>(EMPTY_STATS);
  const [gameScore, setGameScore] = useState({ homeScore: "", awayScore: "" });

  useEffect(() => {
    setQueuedCount(readQueuedGames().length);
    setGameDrafts(readGameDrafts());
    const settings = readAdminSettings();
    setApiUrl(settings.apiUrl);
    setAdminKey(settings.adminKey);
  }, []);

  useEffect(() => {
    writeAdminSettings({ apiUrl, adminKey });
  }, [apiUrl, adminKey]);

  useEffect(() => {
    writeGameDrafts(gameDrafts);
  }, [gameDrafts]);

  const games = useMemo(() => (season?.schedule ?? []).filter((game) => !game.isBye), [season]);
  const selectedGame = selectedGameIdx !== "" ? games[selectedGameIdx] : null;
  const selectedGameNumber = useMemo(
    () => (selectedGameIdx === "" ? "" : getGameNumberFromWeek(selectedGame?.week, selectedGameIdx)),
    [selectedGame, selectedGameIdx]
  );
  const selectedGameKey =
    selectedGame && selectedGameNumber
      ? buildDraftKey(seasonId, selectedGameNumber, selectedGame.homeTeam, selectedGame.awayTeam)
      : "";
  const selectedGameDraft = useMemo(
    () => (selectedGameKey ? gameDrafts[selectedGameKey] ?? null : null),
    [gameDrafts, selectedGameKey]
  );

  const gameTeams = useMemo(
    () =>
      selectedGame
        ? [selectedGame.homeTeam, selectedGame.awayTeam].filter((teamName): teamName is string => Boolean(teamName))
        : [],
    [selectedGame]
  );

  const players = useMemo(
    () =>
      selectedTeam
        ? (season?.teams.find((team: Team) => team.Team === selectedTeam)?.roster ?? [])
        : [],
    [season, selectedTeam]
  );

  const selectedOpponent = useMemo(() => {
    if (!selectedGame || !selectedTeam) return "";
    return selectedTeam === selectedGame.homeTeam ? selectedGame.awayTeam ?? "" : selectedGame.homeTeam ?? "";
  }, [selectedGame, selectedTeam]);

  const draftedPlayers = useMemo(
    () =>
      (selectedGameDraft?.updates ?? []).toSorted((a, b) => {
        if (a.teamName === b.teamName) {
          return a.playerName.localeCompare(b.playerName);
        }

        return a.teamName.localeCompare(b.teamName);
      }),
    [selectedGameDraft]
  );

  const selectedDraftEntry = useMemo(
    () =>
      selectedGameDraft?.updates.find(
        (entry) => entry.teamName === selectedTeam && entry.playerName === selectedPlayer
      ) ?? null,
    [selectedGameDraft, selectedPlayer, selectedTeam]
  );

  useEffect(() => {
    if (!selectedGame || !selectedGameNumber) {
      setGameScore({ homeScore: "", awayScore: "" });
      return;
    }

    if (selectedGameDraft) {
      setGameScore({
        homeScore: selectedGameDraft.homeScore,
        awayScore: selectedGameDraft.awayScore,
      });
      return;
    }

    setGameScore({
      homeScore: toScoreValue(selectedGame.homeScore),
      awayScore: toScoreValue(selectedGame.awayScore),
    });
  }, [selectedGame, selectedGameDraft, selectedGameNumber]);

  useEffect(() => {
    if (!selectedGameDraft || !selectedGameKey) return;

    if (
      selectedGameDraft.homeScore === gameScore.homeScore &&
      selectedGameDraft.awayScore === gameScore.awayScore
    ) {
      return;
    }

    setGameDrafts((prev) => ({
      ...prev,
      [selectedGameKey]: {
        ...prev[selectedGameKey],
        homeScore: gameScore.homeScore,
        awayScore: gameScore.awayScore,
      },
    }));
  }, [gameScore.awayScore, gameScore.homeScore, selectedGameDraft, selectedGameKey]);

  useEffect(() => {
    if (!selectedTeam || !selectedPlayer || !selectedGame || selectedGameIdx === "" || !selectedGameNumber) {
      setStats(EMPTY_STATS);
      return;
    }

    if (selectedDraftEntry) {
      setStats(toStatsValue(selectedDraftEntry.gameLog));
      return;
    }

    const existingStats = findExistingGameLog({
      season,
      selectedTeam,
      selectedPlayer,
      selectedGameNumber,
      opponent: selectedOpponent,
    });

    setStats(existingStats ?? EMPTY_STATS);
  }, [
    season,
    selectedDraftEntry,
    selectedGame,
    selectedGameIdx,
    selectedGameNumber,
    selectedOpponent,
    selectedPlayer,
    selectedTeam,
  ]);

  const errors = {
    fg: stats.FieldGoalsMade > stats.FieldGoalAttempts,
    three: stats.ThreesMade > stats.ThreesAttempts,
    impossibleThree: stats.ThreesAttempts > stats.FieldGoalAttempts,
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const hasManualScore = gameScore.homeScore.trim() !== "" && gameScore.awayScore.trim() !== "";

  const resetStats = useCallback(() => setStats(EMPTY_STATS), []);

  const handleStagePlayer = useCallback(() => {
    if (!selectedPlayer || !selectedGame || !selectedTeam || !selectedGameKey || !selectedGameNumber || hasErrors) {
      return;
    }

    const nextUpdate: AdminPlayerGameUpdate = {
      teamName: selectedTeam,
      playerName: selectedPlayer,
      opponent: selectedOpponent || "Unknown",
      gameLog: stats,
    };

    setGameDrafts((prev) => {
      const existingDraft =
        prev[selectedGameKey] ??
        buildDraftFromGame({
          seasonId,
          gameNumber: selectedGameNumber,
          gameLabel: selectedGame.week,
          homeTeam: selectedGame.homeTeam,
          awayTeam: selectedGame.awayTeam,
          homeScore: gameScore.homeScore,
          awayScore: gameScore.awayScore,
        });

      const nextUpdates = existingDraft.updates.some(
        (entry) => entry.teamName === nextUpdate.teamName && entry.playerName === nextUpdate.playerName
      )
        ? existingDraft.updates.map((entry) =>
            entry.teamName === nextUpdate.teamName && entry.playerName === nextUpdate.playerName ? nextUpdate : entry
          )
        : [...existingDraft.updates, nextUpdate];

      return {
        ...prev,
        [selectedGameKey]: {
          ...existingDraft,
          homeScore: gameScore.homeScore,
          awayScore: gameScore.awayScore,
          updates: nextUpdates,
        },
      };
    });

    setStatus({
      type: "success",
      message: `Drafted ${selectedPlayer} for ${selectedGame.week}.`,
    });
    setSelectedPlayer("");
    resetStats();
  }, [
    hasErrors,
    resetStats,
    seasonId,
    selectedGame,
    selectedGameKey,
    selectedGameNumber,
    gameScore.awayScore,
    gameScore.homeScore,
    selectedOpponent,
    selectedPlayer,
    selectedTeam,
    stats,
  ]);

  const handleRemoveDraftedPlayer = useCallback(() => {
    if (!selectedGameKey || !selectedPlayer || !selectedTeam) return;

    setGameDrafts((prev) => {
      const existingDraft = prev[selectedGameKey];
      if (!existingDraft) return prev;

      const nextUpdates = existingDraft.updates.filter(
        (entry) => !(entry.teamName === selectedTeam && entry.playerName === selectedPlayer)
      );

      if (nextUpdates.length === 0) {
        const nextDrafts = { ...prev };
        delete nextDrafts[selectedGameKey];
        return nextDrafts;
      }

      return {
        ...prev,
        [selectedGameKey]: {
          ...existingDraft,
          updates: nextUpdates,
        },
      };
    });

    setStatus({
      type: "success",
      message: `Removed ${selectedPlayer} from the game draft.`,
    });
    setSelectedPlayer("");
    resetStats();
  }, [resetStats, selectedGameKey, selectedPlayer, selectedTeam]);

  const handlePublishGame = useCallback(async () => {
    if (!selectedGameDraft || selectedGameDraft.updates.length === 0 || !selectedGameKey || !hasManualScore) return;

    setIsSaving(true);
    setStatus({ type: null, message: "" });

    try {
      const endpoint = normalizeAdminApiUrl(apiUrl) || normalizeAdminApiUrl(ADMIN_API_ENDPOINT);
      if (!endpoint) {
        throw new Error("Missing admin API URL");
      }

      const payload: AdminStatsUpdatePayload = {
        seasonId,
        gameNumber: selectedGameDraft.gameNumber,
        updates: selectedGameDraft.updates,
        scheduleUpdate: {
          week: selectedGameDraft.gameLabel,
          homeTeam: selectedGameDraft.homeTeam,
          awayTeam: selectedGameDraft.awayTeam,
          homeScore: Number.parseInt(selectedGameDraft.homeScore, 10),
          awayScore: Number.parseInt(selectedGameDraft.awayScore, 10),
        },
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminKey.trim() ? { Authorization: `Bearer ${adminKey.trim()}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as AdminStatsUpdateResponse;
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Failed to publish game");
      }

      setGameDrafts((prev) => {
        const nextDrafts = { ...prev };
        delete nextDrafts[selectedGameKey];
        return nextDrafts;
      });

      setSelectedTeam("");
      setSelectedPlayer("");
      resetStats();
      setStatus({
        type: "success",
        message: `Published ${result.updatedPlayers} player entries and manual score to GitHub (${result.commitSha.slice(0, 7)}).`,
      });
    } catch (error) {
      const queuedGame: AdminQueuedGameUpdate = {
        ...selectedGameDraft,
        savedAt: new Date().toISOString(),
      };

      const existing = readQueuedGames();
      const nextQueuedGames = [
        ...existing.filter(
          (entry) =>
            !(
              entry.seasonId === queuedGame.seasonId &&
              entry.gameNumber === queuedGame.gameNumber &&
              entry.homeTeam === queuedGame.homeTeam &&
              entry.awayTeam === queuedGame.awayTeam
            )
        ),
        queuedGame,
      ];

      writeQueuedGames(nextQueuedGames);
      setQueuedCount(nextQueuedGames.length);
      setStatus({
        type: "error",
        message: `${getErrorMessage(error)}. Game queued locally (${nextQueuedGames.length}) for export.`,
      });
    } finally {
      setIsSaving(false);
    }
  }, [adminKey, apiUrl, hasManualScore, resetStats, seasonId, selectedGameDraft, selectedGameKey]);

  const handleExportUpdates = useCallback(() => {
    const queuedGames = readQueuedGames();

    if (queuedGames.length === 0) {
      setStatus({ type: "error", message: "No queued games to export" });
      return;
    }

    const blob = new Blob([JSON.stringify(queuedGames, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cbtleague-game-updates-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setStatus({ type: "success", message: "Exported queued games as JSON." });
  }, []);

  return (
    <div className="min-h-screen bg-[#060608] text-white selection:bg-orange-500/30">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <header className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" /> Back to League
            </Link>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">
              Stat <span className="text-orange-500">Entry</span>
            </h1>
            <p className="font-medium text-zinc-500">Season 3 game-by-game box score publishing</p>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-zinc-900/50 p-4">
            <Calendar className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Active Season</p>
              <p className="text-sm font-bold">2026 - Season 3</p>
            </div>
          </div>
        </header>

        <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-3 rounded-3xl border border-white/5 bg-zinc-900/30 p-6 lg:col-span-3">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Admin API URL</label>
                <input
                  type="url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://your-admin-api.vercel.app/api/admin/update-stats"
                  className="w-full rounded-2xl border border-white/5 bg-zinc-900/80 px-5 py-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
                <p className="text-xs text-zinc-500">
                  Use your Vercel endpoint here when you’re saving from GitHub Pages or from your phone.
                </p>
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Admin Key</label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Optional bearer key"
                  className="w-full rounded-2xl border border-white/5 bg-zinc-900/80 px-5 py-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
                <p className="text-xs text-zinc-500">
                  Stored only in this browser so you can reuse it on mobile without editing the site.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">1. Select Matchup</label>
            <select
              value={selectedGameIdx}
              onChange={(e) => {
                setSelectedGameIdx(e.target.value === "" ? "" : Number.parseInt(e.target.value, 10));
                setSelectedTeam("");
                setSelectedPlayer("");
              }}
              className="w-full cursor-pointer appearance-none rounded-2xl border border-white/5 bg-zinc-900/80 px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <option value="">Choose Game...</option>
              {games.map((game, index) => (
                <option key={`${game.week}-${index}`} value={index}>
                  {game.week}: {game.homeTeam} vs {game.awayTeam}
                </option>
              ))}
            </select>
          </div>

          <div className={cn("space-y-3 transition-opacity", !selectedGame && "pointer-events-none opacity-30")}>
            <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">2. Select Team</label>
            <select
              value={selectedTeam}
              onChange={(e) => {
                setSelectedTeam(e.target.value);
                setSelectedPlayer("");
              }}
              className="w-full rounded-2xl border border-white/5 bg-zinc-900/80 px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <option value="">Choose Team...</option>
              {gameTeams.map((teamName) => (
                <option key={teamName} value={teamName}>
                  {teamName}
                </option>
              ))}
            </select>
          </div>

          <div className={cn("space-y-3 transition-opacity", !selectedTeam && "pointer-events-none opacity-30")}>
            <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">3. Select Player</label>
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="w-full rounded-2xl border border-white/5 bg-zinc-900/80 px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <option value="">Choose Player...</option>
              {players.map((player) => (
                <option key={player.name} value={player.name}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedGame && (
          <div className="grid gap-12 lg:grid-cols-[1fr_300px] animate-in slide-in-from-bottom-8 duration-700">
            <div className="rounded-[2.5rem] border border-white/5 bg-zinc-900/30 p-10 backdrop-blur-md">
              <div className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600/20">
                    <User className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">
                      {selectedPlayer || "Select a Player"}
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Drafting Player Stats</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Opponent</p>
                  <p className="text-sm font-bold uppercase italic text-white">{selectedOpponent || "Choose Team"}</p>
                </div>
              </div>

              <div className={cn("grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4", !selectedPlayer && "opacity-40")}>
                {(Object.entries(stats) as Array<[StatKey, number]>).map(([key, value]) => (
                  <div key={key} className="group">
                    <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-zinc-500 transition-colors group-focus-within:text-orange-500">
                      {key}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      disabled={!selectedPlayer}
                      value={value === 0 ? "" : value}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setStats((prev) => ({ ...prev, [key]: val === "" ? 0 : Number.parseInt(val, 10) }));
                      }}
                      onFocus={(e) => e.target.select()}
                      placeholder="0"
                      className={cn(
                        "w-full border-b-2 bg-transparent p-0 pb-2 text-3xl font-black italic tracking-tighter transition-all placeholder:text-zinc-800 focus:outline-none",
                        (key === "FieldGoalsMade" && errors.fg) || (key === "ThreesAttempts" && errors.impossibleThree)
                          ? "border-red-500/50 text-red-500"
                          : "border-white/10 text-white focus:border-orange-600",
                        !selectedPlayer && "cursor-not-allowed"
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="sticky top-12 rounded-3xl border border-white/5 bg-zinc-900/50 p-8">
                <h3 className="mb-6 text-xs font-black uppercase tracking-widest text-zinc-500">Validation Summary</h3>

                {hasErrors ? (
                  <div className="mb-8 flex items-start gap-4 rounded-2xl border border-red-500/20 bg-red-400/5 p-4 text-red-400">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <p className="text-xs font-bold leading-relaxed">
                      Math Error: You have more 3P attempts than total Field Goal attempts. Check your data.
                    </p>
                  </div>
                ) : (
                  <div className="mb-8 space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold uppercase italic text-zinc-500">
                      <span>Accuracy Check</span>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="h-px bg-white/5" />
                  </div>
                )}

                {status.type && (
                  <div
                    className={cn(
                      "mb-6 rounded-xl p-4 text-center text-xs font-black uppercase tracking-widest animate-in zoom-in-95",
                      status.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    )}
                  >
                    {status.message}
                  </div>
                )}

                <div className="mb-4 rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Manual Final Score</p>
                  <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        {selectedGame.homeTeam}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={gameScore.homeScore}
                        onChange={(e) =>
                          setGameScore((prev) => ({
                            ...prev,
                            homeScore: e.target.value.replace(/[^0-9]/g, ""),
                          }))
                        }
                        placeholder="0"
                        className="w-full rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-center text-2xl font-black italic text-white focus:border-orange-600 focus:outline-none"
                      />
                    </div>
                    <div className="pb-3 text-sm font-black uppercase tracking-widest text-zinc-600">vs</div>
                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        {selectedGame.awayTeam}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={gameScore.awayScore}
                        onChange={(e) =>
                          setGameScore((prev) => ({
                            ...prev,
                            awayScore: e.target.value.replace(/[^0-9]/g, ""),
                          }))
                        }
                        placeholder="0"
                        className="w-full rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-center text-2xl font-black italic text-white focus:border-orange-600 focus:outline-none"
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-zinc-500">
                    The schedule score comes from these boxes only. It is not auto-calculated from player totals.
                  </p>
                </div>

                <div className="mb-4 rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Current Draft</p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {draftedPlayers.length} player{draftedPlayers.length === 1 ? "" : "s"}
                  </p>
                  <div className="mt-4 space-y-2 text-xs">
                    {draftedPlayers.length === 0 ? (
                      <p className="text-zinc-500">No player entries drafted for this matchup yet.</p>
                    ) : (
                      draftedPlayers.map((entry) => (
                        <div
                          key={`${entry.teamName}-${entry.playerName}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-zinc-950/60 px-3 py-2"
                        >
                          <div>
                            <p className="font-bold text-white">{entry.playerName}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{entry.teamName}</p>
                          </div>
                          <p className="text-sm font-black text-orange-500">{entry.gameLog.Points} PTS</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <button
                  onClick={handleStagePlayer}
                  disabled={hasErrors || !selectedPlayer || isSaving}
                  className={cn(
                    "flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-sm font-black uppercase tracking-widest transition-all",
                    hasErrors || !selectedPlayer || isSaving
                      ? "cursor-not-allowed bg-zinc-800 text-zinc-600"
                      : "bg-white/10 text-white hover:bg-white/15 active:scale-95"
                  )}
                >
                  {selectedDraftEntry ? "Update Drafted Player" : "Add Player To Draft"}
                  <Save className="h-4 w-4" />
                </button>

                <button
                  onClick={handleRemoveDraftedPlayer}
                  disabled={!selectedDraftEntry || isSaving}
                  className={cn(
                    "mt-3 w-full rounded-2xl border py-3 text-xs font-black uppercase tracking-widest transition-all",
                    !selectedDraftEntry || isSaving
                      ? "cursor-not-allowed border-white/5 bg-zinc-900 text-zinc-600"
                      : "border-white/10 bg-transparent text-zinc-300 hover:bg-white/5"
                  )}
                >
                  Remove Selected Player From Draft
                </button>

                <button
                  onClick={handlePublishGame}
                  disabled={draftedPlayers.length === 0 || isSaving || !hasManualScore}
                  className={cn(
                    "mt-3 flex w-full items-center justify-center gap-3 rounded-2xl py-6 text-xl font-black uppercase italic tracking-tighter transition-all",
                    draftedPlayers.length === 0 || isSaving || !hasManualScore
                      ? "cursor-not-allowed bg-zinc-800 text-zinc-600"
                      : "bg-orange-600 text-white shadow-[0_20px_40px_-15px_rgba(234,88,12,0.4)] hover:bg-orange-700 active:scale-95"
                  )}
                >
                  {isSaving ? "Publishing..." : `Publish Game (${draftedPlayers.length})`}
                  <Save className="h-5 w-5" />
                </button>

                <button
                  onClick={handleExportUpdates}
                  className="mt-3 flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-4 text-xs font-black uppercase tracking-widest text-zinc-300 transition-all hover:bg-white/10"
                >
                  Export Queued Games ({queuedCount})
                  <Download className="h-4 w-4" />
                </button>

                <p className="mt-6 text-center text-[10px] font-bold uppercase leading-relaxed text-zinc-700">
                  Enter the manual final score, draft each player, then publish one full matchup to GitHub. <br />
                  If API is unavailable, the whole game is queued in your browser for export.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
