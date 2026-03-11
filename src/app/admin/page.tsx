"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Save, AlertCircle, CheckCircle2, User, Calendar, ArrowLeft, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSeasonData } from "@/lib/league-data";
import type { AdminStatsUpdatePayload, AdminStatsUpdateResponse } from "@/types/admin-api";
import type { BaseStats, Team } from "@/types/league";

const LOCAL_UPDATES_KEY = "cbtleague-admin-updates";
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

type AdminQueuedUpdate = {
  savedAt: string;
  seasonId: string;
  teamName: string;
  playerName: string;
  opponent: string;
  gameNumber: string;
  gameLog: BaseStats;
};

type AdminSettings = {
  apiUrl: string;
  adminKey: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Failed to save stats";
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

function readQueuedUpdates(): AdminQueuedUpdate[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_UPDATES_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as AdminQueuedUpdate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueuedUpdates(updates: AdminQueuedUpdate[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_UPDATES_KEY, JSON.stringify(updates, null, 2));
}

function readAdminSettings(): AdminSettings {
  if (typeof window === "undefined") {
    return { apiUrl: ADMIN_API_ENDPOINT, adminKey: "" };
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_ADMIN_SETTINGS_KEY);
    if (!raw) {
      return { apiUrl: ADMIN_API_ENDPOINT, adminKey: "" };
    }

    const parsed = JSON.parse(raw) as Partial<AdminSettings>;
    return {
      apiUrl: typeof parsed.apiUrl === "string" && parsed.apiUrl.trim() ? parsed.apiUrl : ADMIN_API_ENDPOINT,
      adminKey: typeof parsed.adminKey === "string" ? parsed.adminKey : "",
    };
  } catch {
    return { apiUrl: ADMIN_API_ENDPOINT, adminKey: "" };
  }
}

function writeAdminSettings(settings: AdminSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_ADMIN_SETTINGS_KEY, JSON.stringify(settings));
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
  const [apiUrl, setApiUrl] = useState(ADMIN_API_ENDPOINT);
  const [adminKey, setAdminKey] = useState("");

  const [stats, setStats] = useState<BaseStats>(EMPTY_STATS);

  useEffect(() => {
    setQueuedCount(readQueuedUpdates().length);
    const settings = readAdminSettings();
    setApiUrl(settings.apiUrl);
    setAdminKey(settings.adminKey);
  }, []);

  useEffect(() => {
    writeAdminSettings({ apiUrl, adminKey });
  }, [apiUrl, adminKey]);

  const games = useMemo(() => (season?.schedule ?? []).filter((game) => !game.isBye), [season]);
  const selectedGame = selectedGameIdx !== "" ? games[selectedGameIdx] : null;
  const selectedGameNumber = React.useMemo(
    () => (selectedGameIdx === "" ? "" : getGameNumberFromWeek(selectedGame?.week, selectedGameIdx)),
    [selectedGame, selectedGameIdx]
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

  useEffect(() => {
    if (!selectedTeam || !selectedPlayer || !selectedGame || selectedGameIdx === "") {
      setStats(EMPTY_STATS);
      return;
    }

    const opponent = selectedTeam === selectedGame.homeTeam ? selectedGame.awayTeam : selectedGame.homeTeam;
    const team = season?.teams.find((candidate: Team) => candidate.Team === selectedTeam);
    const player = team?.roster.find((candidate) => candidate.name === selectedPlayer);
    const existingLog = player?.stats?.find(
      (entry) =>
        String(entry.game_number) === selectedGameNumber &&
        (entry.opponent === opponent || entry.opponent.trim() === "")
    );

    setStats(toStatsValue(existingLog));
  }, [season, selectedGame, selectedGameIdx, selectedGameNumber, selectedPlayer, selectedTeam]);

  const errors = {
    fg: stats.FieldGoalsMade > stats.FieldGoalAttempts,
    three: stats.ThreesMade > stats.ThreesAttempts,
    impossibleThree: stats.ThreesAttempts > stats.FieldGoalAttempts,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const resetStats = useCallback(() => setStats(EMPTY_STATS), []);

  const handleSave = useCallback(async () => {
    if (!selectedPlayer || !selectedGame || hasErrors || !selectedTeam) return;

    setIsSaving(true);
    setStatus({ type: null, message: "" });

    try {
      const opponent = selectedTeam === selectedGame.homeTeam ? selectedGame.awayTeam : selectedGame.homeTeam;
      const endpoint = apiUrl.trim() || ADMIN_API_ENDPOINT;

      if (!endpoint) {
        throw new Error("Missing admin API URL");
      }

      const payload: AdminStatsUpdatePayload = {
        seasonId,
        teamName: selectedTeam,
        playerName: selectedPlayer,
        opponent: opponent ?? "Unknown",
        gameNumber: selectedGameNumber || selectedGame.week,
        gameLog: stats,
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
        throw new Error(result.message || "Failed to save stats");
      }

      setStatus({
        type: "success",
        message: `Saved ${selectedPlayer} to GitHub (${result.commitSha.slice(0, 7)}).`,
      });
      resetStats();
    } catch (error) {
      const opponent = selectedTeam === selectedGame.homeTeam ? selectedGame.awayTeam : selectedGame.homeTeam;

      const queuedUpdate: AdminQueuedUpdate = {
        savedAt: new Date().toISOString(),
        seasonId,
        teamName: selectedTeam,
        playerName: selectedPlayer,
        opponent: opponent ?? "Unknown",
        gameNumber: selectedGameNumber || selectedGame.week,
        gameLog: stats,
      };

      const existing = readQueuedUpdates();
      const nextUpdates = [...existing, queuedUpdate];
      writeQueuedUpdates(nextUpdates);
      setQueuedCount(nextUpdates.length);

      setStatus({
        type: "error",
        message: `${getErrorMessage(error)}. Entry queued locally (${nextUpdates.length}) for export.`,
      });
    } finally {
      setIsSaving(false);
    }
  }, [adminKey, apiUrl, hasErrors, resetStats, seasonId, selectedGame, selectedGameNumber, selectedPlayer, selectedTeam, stats]);

  const handleExportUpdates = useCallback(() => {
    const updates = readQueuedUpdates();

    if (updates.length === 0) {
      setStatus({ type: "error", message: "No queued updates to export" });
      return;
    }

    const blob = new Blob([JSON.stringify(updates, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cbtleague-updates-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setStatus({ type: "success", message: "Exported queued updates as JSON." });
  }, []);

  return (
    <div className="min-h-screen bg-[#060608] text-white selection:bg-orange-500/30">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <header className="mb-16 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-4"
            >
              <ArrowLeft className="h-3 w-3" /> Back to League
            </Link>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">
              Stat <span className="text-orange-500">Entry</span>
            </h1>
            <p className="text-zinc-500 font-medium">Season 3 Official Box Score Management</p>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
            <Calendar className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Active Season</p>
              <p className="text-sm font-bold">2026 - Season 3</p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          <div className="space-y-3 lg:col-span-3 rounded-3xl border border-white/5 bg-zinc-900/30 p-6">
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
                <p className="text-xs text-zinc-500">Use your Vercel endpoint here when you’re saving from the GitHub Pages site or from your phone.</p>
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
                <p className="text-xs text-zinc-500">Stored only in this browser so you can reuse it on mobile without editing the site.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-1">1. Select Matchup</label>
            <select
              value={selectedGameIdx}
              onChange={(e) => {
                setSelectedGameIdx(e.target.value === "" ? "" : Number.parseInt(e.target.value, 10));
                setSelectedTeam("");
                setSelectedPlayer("");
              }}
              className="w-full bg-zinc-900/80 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none cursor-pointer"
            >
              <option value="">Choose Game...</option>
              {games.map((game, index) => (
                <option key={`${game.week}-${index}`} value={index}>
                  {game.week}: {game.homeTeam} vs {game.awayTeam}
                </option>
              ))}
            </select>
          </div>

          <div className={cn("space-y-3 transition-opacity", !selectedGame && "opacity-30 pointer-events-none")}>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-1">2. Select Team</label>
            <select
              value={selectedTeam}
              onChange={(e) => {
                setSelectedTeam(e.target.value);
                setSelectedPlayer("");
              }}
              className="w-full bg-zinc-900/80 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <option value="">Choose Team...</option>
              {gameTeams.map((teamName) => (
                <option key={teamName} value={teamName}>
                  {teamName}
                </option>
              ))}
            </select>
          </div>

          <div className={cn("space-y-3 transition-opacity", !selectedTeam && "opacity-30 pointer-events-none")}>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-1">3. Select Player</label>
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="w-full bg-zinc-900/80 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50"
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

        {selectedPlayer && (
          <div className="grid gap-12 lg:grid-cols-[1fr_300px] animate-in slide-in-from-bottom-8 duration-700">
            <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-md">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-orange-600/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">{selectedPlayer}</h2>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Entering Game Stats</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Opponent</p>
                  <p className="text-sm font-bold text-white uppercase italic">
                    {selectedTeam === selectedGame?.homeTeam ? selectedGame?.awayTeam : selectedGame?.homeTeam}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10">
                {(Object.entries(stats) as Array<[StatKey, number]>).map(([key, value]) => (
                  <div key={key} className="group">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-focus-within:text-orange-500 transition-colors block mb-3">
                      {key}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={value === 0 ? "" : value}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setStats((prev) => ({ ...prev, [key]: val === "" ? 0 : Number.parseInt(val, 10) }));
                      }}
                      onFocus={(e) => e.target.select()}
                      placeholder="0"
                      className={cn(
                        "w-full bg-transparent border-b-2 text-3xl font-black italic tracking-tighter transition-all focus:outline-none p-0 pb-2 placeholder:text-zinc-800",
                        (key === "FieldGoalsMade" && errors.fg) || (key === "ThreesAttempts" && errors.impossibleThree)
                          ? "border-red-500/50 text-red-500"
                          : "border-white/10 focus:border-orange-600 text-white"
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 sticky top-12">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-6">Validation Summary</h3>

                {hasErrors ? (
                  <div className="flex items-start gap-4 text-red-400 bg-red-400/5 p-4 rounded-2xl border border-red-500/20 mb-8">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold leading-relaxed">
                      Math Error: You have more 3P attempts than total Field Goal attempts. Check your data.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between text-zinc-500 font-bold text-xs uppercase italic">
                      <span>Accuracy Check</span>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="h-px bg-white/5" />
                  </div>
                )}

                {status.type && (
                  <div
                    className={cn(
                      "mb-6 p-4 rounded-xl text-xs font-black uppercase tracking-widest text-center animate-in zoom-in-95",
                      status.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    )}
                  >
                    {status.message}
                  </div>
                )}

                <button
                  onClick={handleSave}
                  disabled={hasErrors || isSaving}
                  className={cn(
                    "w-full py-6 rounded-2xl font-black uppercase italic tracking-tighter text-xl transition-all flex items-center justify-center gap-3",
                    hasErrors || isSaving
                      ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                      : "bg-orange-600 text-white hover:bg-orange-700 shadow-[0_20px_40px_-15px_rgba(234,88,12,0.4)] active:scale-95"
                  )}
                >
                  {isSaving ? "Saving..." : "Save Stats"}
                  <Save className="h-5 w-5" />
                </button>

                <button
                  onClick={handleExportUpdates}
                  className="mt-3 w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                >
                  Export Queued Updates ({queuedCount})
                  <Download className="h-4 w-4" />
                </button>

                <p className="mt-6 text-[10px] text-zinc-700 text-center font-bold uppercase leading-relaxed">
                  Primary mode: save directly to GitHub via API. <br />
                  If API is unavailable, updates are queued in your browser for export.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
