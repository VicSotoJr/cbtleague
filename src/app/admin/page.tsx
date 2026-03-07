"use client";

import React, { useState } from "react";
import Link from "next/link";
import allData from "@/data/data.json";
import { Save, AlertCircle, CheckCircle2, User, Trophy, BarChart3, Calendar, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminPage() {
    const [seasonId, setSeasonId] = useState("3");
    const [selectedGameIdx, setSelectedGameIdx] = useState<number | "">("");
    const [selectedTeam, setSelectedTeam] = useState("");
    const [selectedPlayer, setSelectedPlayer] = useState("");
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: "" });
    const [isSaving, setIsSaving] = useState(false);

    // Initial Stat State
    const [stats, setStats] = useState({
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
        PersonalFouls: 0
    });

    const season = (allData.seasons as any)[seasonId];
    const games = (season?.schedule || []).filter((g: any) => !g.isBye);
    const selectedGame = selectedGameIdx !== "" ? games[selectedGameIdx] : null;

    // Available teams for the selected game
    const gameTeams = selectedGame ? [selectedGame.homeTeam, selectedGame.awayTeam] : [];

    // Players for the selected team
    const players = selectedTeam
        ? (season.teams.find((t: any) => t.Team === selectedTeam)?.roster || [])
        : [];

    // Validation
    const errors = {
        fg: stats.FieldGoalsMade > stats.FieldGoalAttempts,
        three: stats.ThreesMade > stats.ThreesAttempts,
        impossibleThree: stats.ThreesAttempts > stats.FieldGoalAttempts,
    };
    const hasErrors = Object.values(errors).some(v => v);

    const handleSave = async () => {
        if (!selectedPlayer || !selectedGame || hasErrors) return;

        setIsSaving(true);
        setStatus({ type: null, message: "" });

        const opponent = selectedTeam === selectedGame.homeTeam ? selectedGame.awayTeam : selectedGame.homeTeam;

        try {
            const res = await fetch('/api/admin/update-stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    seasonId,
                    teamName: selectedTeam,
                    playerName: selectedPlayer,
                    opponent: opponent,
                    gameLog: stats
                })
            });

            const result = await res.json();
            if (result.success) {
                setStatus({ type: 'success', message: `Saved entry for ${selectedPlayer}!` });
                // Don't reset everything so user can quickly do another player on same team
                setStats({
                    Points: 0, FieldGoalsMade: 0, FieldGoalAttempts: 0, ThreesMade: 0, ThreesAttempts: 0,
                    FreeThrowsMade: 0, FreeThrowsAttempts: 0, Rebounds: 0, Offrebounds: 0, Defrebounds: 0,
                    Assists: 0, Blocks: 0, Steals: 0, Turnovers: 0, PersonalFouls: 0
                });
            } else {
                setStatus({ type: 'error', message: result.error });
            }
        } catch (err) {
            setStatus({ type: 'error', message: "Connection failed" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#060608] text-white selection:bg-orange-500/30">
            <div className="max-w-5xl mx-auto px-6 py-16">
                <header className="mb-16 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-4">
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
                    {/* Game Selector */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-1">1. Select Matchup</label>
                        <select
                            value={selectedGameIdx}
                            onChange={(e) => {
                                setSelectedGameIdx(e.target.value === "" ? "" : parseInt(e.target.value));
                                setSelectedTeam("");
                                setSelectedPlayer("");
                            }}
                            className="w-full bg-zinc-900/80 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none cursor-pointer"
                        >
                            <option value="">Choose Game...</option>
                            {games.map((g: any, i: number) => (
                                <option key={i} value={i}>{g.week}: {g.homeTeam} vs {g.awayTeam}</option>
                            ))}
                        </select>
                    </div>

                    {/* Team Selector */}
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
                            {gameTeams.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    {/* Player Selector */}
                    <div className={cn("space-y-3 transition-opacity", !selectedTeam && "opacity-30 pointer-events-none")}>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-1">3. Select Player</label>
                        <select
                            value={selectedPlayer}
                            onChange={(e) => setSelectedPlayer(e.target.value)}
                            className="w-full bg-zinc-900/80 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        >
                            <option value="">Choose Player...</option>
                            {players.map((p: any) => <option key={p.name} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>
                </div>

                {selectedPlayer && (
                    <div className="grid gap-12 lg:grid-cols-[1fr_300px] animate-in slide-in-from-bottom-8 duration-700">
                        {/* Box Score Form */}
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
                                    <p className="text-sm font-bold text-white uppercase italic">{selectedTeam === selectedGame?.homeTeam ? selectedGame?.awayTeam : selectedGame?.homeTeam}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10">
                                {Object.entries(stats).map(([key, value]) => (
                                    <div key={key} className="group">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-focus-within:text-orange-500 transition-colors block mb-3">{key}</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={value === 0 ? "" : value}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                setStats({ ...stats, [key]: val === "" ? 0 : parseInt(val) });
                                            }}
                                            onFocus={(e) => e.target.select()}
                                            placeholder="0"
                                            className={cn(
                                                "w-full bg-transparent border-b-2 text-3xl font-black italic tracking-tighter transition-all focus:outline-none p-0 pb-2 placeholder:text-zinc-800",
                                                (key === 'FieldGoalsMade' && errors.fg) || (key === 'ThreesAttempts' && errors.impossibleThree)
                                                    ? "border-red-500/50 text-red-500"
                                                    : "border-white/10 focus:border-orange-600 text-white"
                                            )}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Summary & Save */}
                        <div className="space-y-6">
                            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 sticky top-12">
                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-6">Validation Summary</h3>

                                {hasErrors ? (
                                    <div className="flex items-start gap-4 text-red-400 bg-red-400/5 p-4 rounded-2xl border border-red-500/20 mb-8">
                                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                        <p className="text-xs font-bold leading-relaxed">Math Error: You have more 3P attempts than total Field Goal attempts. Check your data.</p>
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
                                    <div className={cn(
                                        "mb-6 p-4 rounded-xl text-xs font-black uppercase tracking-widest text-center animate-in zoom-in-95",
                                        status.type === 'success' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                    )}>
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
                                    {isSaving ? "Saving..." : "Commit Stats"}
                                    <Save className="h-5 w-5" />
                                </button>

                                <p className="mt-6 text-[10px] text-zinc-700 text-center font-bold uppercase leading-relaxed">Changes will be saved locally. <br /> Push to GitHub to go live.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
