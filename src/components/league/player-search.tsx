"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Link from "next/link";
import PlayerHead from "./player-head";

interface PlayerSummary {
    name: string;
    team: string;
    playerHead: string;
}

interface PlayerSearchProps {
    players: PlayerSummary[];
}

export default function PlayerSearch({ players }: PlayerSearchProps) {
    const [query, setQuery] = useState("");

    const filteredPlayers = useMemo(() => {
        if (!query.trim()) return [];
        return players
            .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 10);
    }, [query, players]);

    return (
        <div className="relative w-full max-w-md">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                    type="text"
                    placeholder="Search players..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-12 border-white/10 bg-zinc-900/50 pl-10 text-white placeholder:text-zinc-600 focus:border-copper-500/50 focus:ring-copper-500/20 rounded-xl"
                />
            </div>

            {query.trim().length > 0 && (
                <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-2 shadow-2xl backdrop-blur-xl">
                    {filteredPlayers.length > 0 ? (
                        <div className="space-y-1">
                            {filteredPlayers.map((player) => (
                                <Link
                                    key={player.name + player.team}
                                    href={`/players/${encodeURIComponent(player.name.trim())}/`}
                                    prefetch={false}
                                    className="flex items-center gap-3 rounded-xl p-3 hover:bg-white/5 transition-colors group"
                                    onClick={() => setQuery("")}
                                >
                                    <PlayerHead
                                        playerName={player.name}
                                        playerHead={player.playerHead}
                                        size={40}
                                        className="rounded-lg shrink-0"
                                    />
                                    <div className="flex-1">
                                        <p className="font-bold text-white group-hover:text-copper-500 transition-colors uppercase text-sm">
                                            {player.name}
                                        </p>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                                            {player.team}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-sm font-medium text-zinc-500">No players found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
