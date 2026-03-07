"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { cn } from "@/lib/utils";
import PlayerHead from "@/components/league/player-head";
import { getSeasonId, getSeasonLabel, getSeasonPlayersWithAggregates, SEASON_OPTIONS } from "@/lib/league-data";

export default function PlayersClient() {
  const searchParams = useSearchParams();
  const seasonId = getSeasonId(searchParams.get("season"));

  const players = React.useMemo(
    () => getSeasonPlayersWithAggregates(seasonId).toSorted((a, b) => b.aggregated.PPG - a.aggregated.PPG),
    [seasonId]
  );

  const [searchQuery, setSearchQuery] = React.useState("");
  const searchValue = searchQuery.trim().toLowerCase();
  const filteredPlayers = React.useMemo(
    () => players.filter((entry) => entry.player.name.toLowerCase().includes(searchValue)),
    [players, searchValue]
  );

  const seasonLabel = getSeasonLabel(seasonId);

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl uppercase italic">
            Player <span className="text-orange-500">Stats</span>
          </h1>
          <p className="mt-2 text-zinc-400">Detailed statistical records for every player in the league.</p>
        </div>

        <div className="flex w-full flex-col gap-4 md:w-auto md:flex-row md:items-center">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-2 text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/20"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold uppercase tracking-widest text-zinc-500">Season</span>
            <div className="flex gap-2">
              {SEASON_OPTIONS.map((season) => (
                <Link
                  key={season.id}
                  href={`/stats/players?season=${season.id}`}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-bold transition-all",
                    seasonId === season.id
                      ? "bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                  )}
                >
                  {season.id}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 flex items-center justify-between rounded-xl bg-orange-600/10 p-4 border border-orange-500/20">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-orange-400 uppercase tracking-tighter">Current View:</span>
          <span className="text-lg font-bold text-white">{seasonLabel}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50 backdrop-blur-sm shadow-2xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="sticky left-0 bg-zinc-900 z-10 min-w-[200px] font-bold text-white uppercase tracking-tighter italic">
                  Player
                </TableHead>
                <TableHead className="min-w-[120px] font-bold text-zinc-500 uppercase tracking-tighter">Team</TableHead>
                {[
                  "GP",
                  "PTS",
                  "PPG",
                  "FGM",
                  "FGA",
                  "FG%",
                  "2PM",
                  "2PA",
                  "2P%",
                  "3PM",
                  "3PA",
                  "3P%",
                  "FTM",
                  "FTA",
                  "FT%",
                  "OREB",
                  "DREB",
                  "REB",
                  "RPG",
                  "AST",
                  "APG",
                  "STL",
                  "SPG",
                  "BLK",
                  "BPG",
                  "TOV",
                  "TOVPG",
                  "PF",
                  "EFF",
                ].map((stat) => (
                  <TableHead
                    key={stat}
                    className={cn(
                      "text-center font-bold uppercase tracking-tighter whitespace-nowrap px-4",
                      stat === "PPG" || stat === "EFF" ? "text-orange-500" : "text-zinc-500"
                    )}
                  >
                    {stat}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.map((entry, i) => {
                const { player, teamName, aggregated } = entry;

                return (
                  <TableRow
                    key={`${player.name}-${teamName}-${i}`}
                    className="border-white/5 hover:bg-white/5 transition-colors group"
                  >
                    <TableCell className="sticky left-0 bg-zinc-900/90 backdrop-blur-md z-10 font-bold text-white group-hover:text-orange-500">
                      <Link href={`/players/${encodeURIComponent(player.name.trim())}`} className="flex items-center gap-3">
                        <PlayerHead
                          playerName={player.name}
                          playerHead={player.PlayerHead}
                          size="sm"
                          className="rounded-full"
                        />
                        <span className="uppercase tracking-tight whitespace-nowrap">{player.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-zinc-500 font-bold text-sm uppercase tracking-tight whitespace-nowrap">
                      <Link
                        href={`/teams/${encodeURIComponent(teamName.trim())}?season=${seasonId}`}
                        className="hover:text-white transition-colors"
                      >
                        {teamName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center font-medium text-zinc-400">{aggregated.GAMES}</TableCell>
                    <TableCell className="text-center font-black text-white">{aggregated.Points}</TableCell>
                    <TableCell className="text-center font-black text-orange-500 italic">{aggregated.PPG}</TableCell>
                    <TableCell className="text-center font-medium text-zinc-400">{aggregated.FieldGoalsMade}</TableCell>
                    <TableCell className="text-center font-medium text-zinc-400">{aggregated.FieldGoalAttempts}</TableCell>
                    <TableCell className="text-center font-mono font-bold text-zinc-500">{aggregated["FG%"]}%</TableCell>
                    <TableCell className="text-center font-medium text-zinc-400">{aggregated.twoPM}</TableCell>
                    <TableCell className="text-center font-medium text-zinc-400">{aggregated.twoPA}</TableCell>
                    <TableCell className="text-center font-mono font-bold text-zinc-500">{aggregated["2P%"]}%</TableCell>
                    <TableCell className="text-center font-medium text-zinc-400">{aggregated.ThreesMade}</TableCell>
                    <TableCell className="text-center font-medium text-zinc-400">{aggregated.ThreesAttempts}</TableCell>
                    <TableCell className="text-center font-mono font-bold text-zinc-500">{aggregated["3P%"]}%</TableCell>
                    <TableCell className="text-center font-medium text-zinc-400">{aggregated.FreeThrowsMade}</TableCell>
                    <TableCell className="text-center font-medium text-zinc-400">{aggregated.FreeThrowsAttempts}</TableCell>
                    <TableCell className="text-center font-mono font-bold text-zinc-500">{aggregated["FT%"]}%</TableCell>
                    <TableCell className="text-center font-medium text-zinc-400">{aggregated.Offrebounds}</TableCell>
                    <TableCell className="text-center font-medium text-zinc-400">{aggregated.Defrebounds}</TableCell>
                    <TableCell className="text-center font-bold text-zinc-300">{aggregated.Rebounds}</TableCell>
                    <TableCell className="text-center font-mono text-zinc-400">{aggregated.RPG}</TableCell>
                    <TableCell className="text-center font-medium text-zinc-300">{aggregated.Assists}</TableCell>
                    <TableCell className="text-center font-mono text-zinc-400">{aggregated.APG}</TableCell>
                    <TableCell className="text-center font-medium text-zinc-300">{aggregated.Steals}</TableCell>
                    <TableCell className="text-center font-mono text-zinc-400">{aggregated.SPG}</TableCell>
                    <TableCell className="text-center font-medium text-zinc-300">{aggregated.Blocks}</TableCell>
                    <TableCell className="text-center font-mono text-zinc-400">{aggregated.BPG}</TableCell>
                    <TableCell className="text-center font-medium text-zinc-300">{aggregated.Turnovers}</TableCell>
                    <TableCell className="text-center font-mono text-zinc-400">{aggregated.TOVPG}</TableCell>
                    <TableCell className="text-center font-medium text-zinc-300">{aggregated.PersonalFouls}</TableCell>
                    <TableCell className="text-right font-black text-orange-500 italic">{aggregated.EFF}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
