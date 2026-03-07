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
import SeasonToggle from "@/components/league/season-toggle";
import { getSeasonId, getSeasonLabel, getSeasonPlayersWithAggregates, SEASON_OPTIONS } from "@/lib/league-summary";

const ROWS_PER_PAGE = 50;

const PLAYER_STAT_COLUMNS = [
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
] as const;

export default function PlayersClient() {
  const searchParams = useSearchParams();
  const seasonId = getSeasonId(searchParams.get("season"));

  const players = React.useMemo(() => getSeasonPlayersWithAggregates(seasonId), [seasonId]);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const deferredSearchQuery = React.useDeferredValue(searchQuery);
  const searchValue = deferredSearchQuery.trim().toLowerCase();
  const filteredPlayers = React.useMemo(
    () => players.filter((entry) => entry.player.name.toLowerCase().includes(searchValue)),
    [players, searchValue]
  );
  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / ROWS_PER_PAGE));

  React.useEffect(() => {
    setPage(1);
  }, [seasonId, searchValue]);

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedPlayers = React.useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return filteredPlayers.slice(start, start + ROWS_PER_PAGE);
  }, [filteredPlayers, page]);

  const seasonLabel = getSeasonLabel(seasonId);
  const pageStart = filteredPlayers.length === 0 ? 0 : (page - 1) * ROWS_PER_PAGE + 1;
  const pageEnd = Math.min(page * ROWS_PER_PAGE, filteredPlayers.length);

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
          <SeasonToggle
            seasonId={seasonId}
            options={SEASON_OPTIONS}
            hrefForSeason={(id) => `/stats/players/?season=${id}`}
          />
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
                <TableHead className="min-w-[200px] font-bold text-white uppercase tracking-tighter italic">
                  Player
                </TableHead>
                <TableHead className="min-w-[120px] font-bold text-zinc-500 uppercase tracking-tighter">Team</TableHead>
                {PLAYER_STAT_COLUMNS.map((stat) => (
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
              {paginatedPlayers.map((entry, i) => {
                const { player, teamName, aggregated } = entry;

                return (
                  <TableRow
                    key={`${player.name}-${teamName}-${page}-${i}`}
                    className="border-white/5 hover:bg-white/5 transition-colors group"
                  >
                    <TableCell className="font-bold text-white group-hover:text-orange-500">
                      <Link href={`/players/${encodeURIComponent(player.name.trim())}/`} prefetch={false} className="block uppercase tracking-tight whitespace-nowrap">
                        {player.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-zinc-500 font-bold text-sm uppercase tracking-tight whitespace-nowrap">
                      <Link
                        href={`/teams/${encodeURIComponent(teamName.trim())}/?season=${seasonId}`}
                        prefetch={false}
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
        <div className="flex flex-col gap-3 border-t border-white/5 bg-zinc-950/70 px-4 py-4 text-sm text-zinc-400 md:flex-row md:items-center md:justify-between">
          <div>
            Showing <span className="font-bold text-white">{pageStart}-{pageEnd}</span> of{" "}
            <span className="font-bold text-white">{filteredPlayers.length}</span> players
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition-colors enabled:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Page {page}/{totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition-colors enabled:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
