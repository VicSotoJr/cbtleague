"use client";

import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
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
import PlayerHead from "@/components/league/player-head";
import { getSeasonId, getSeasonLabel, getSeasonPlayersWithAggregates, SEASON_OPTIONS } from "@/lib/league-summary";
import { buildCurrentReturnTo, buildPlayerProfileHref, buildTeamProfileHref } from "@/lib/player-links";
import { getSeasonPlayerOveralls } from "@/lib/player-overalls";
import { getOverallTierClasses } from "@/lib/player-overall-tier";
import { filterDisplayableSeasonPlayers } from "@/lib/player-visibility";
import { STAT_TABLE_COLUMNS } from "@/lib/stat-columns";

export default function PlayersClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const seasonId = getSeasonId(searchParams.get("season"));
  const returnTo = React.useMemo(() => buildCurrentReturnTo(pathname, searchParams), [pathname, searchParams]);

  const players = React.useMemo(
    () => getSeasonPlayerOveralls(getSeasonPlayersWithAggregates(seasonId), seasonId),
    [seasonId]
  );
  const visiblePlayers = React.useMemo(
    () => filterDisplayableSeasonPlayers(players, seasonId, (entry) => entry.player.name),
    [players, seasonId]
  );

  const [searchQuery, setSearchQuery] = React.useState("");
  const deferredSearchQuery = React.useDeferredValue(searchQuery);
  const searchValue = deferredSearchQuery.trim().toLowerCase();
  const filteredPlayers = React.useMemo(
    () => visiblePlayers.filter((entry) => entry.player.name.toLowerCase().includes(searchValue)),
    [visiblePlayers, searchValue]
  );

  const seasonLabel = getSeasonLabel(seasonId);
  const seasonModelCopy =
    seasonId === "3"
      ? "SEASON-SPECIFIC RATINGS AND PLAYER STATS."
      : "Season-only 2k-style model v7 using inferred stat archetypes with tuned middle-tier weighting and a lighter scorer-vs-connector balancing pass.";

  return (
    <div className="container mx-auto overflow-x-hidden px-4 py-12 md:px-6">
      <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl uppercase italic">
            Player <span className="text-copper-500">Stats</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Detailed statistical records for every player in the league.
          </p>
        </div>

        <div className="flex w-full flex-col gap-4 md:w-auto md:flex-row md:items-center">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-2 text-white placeholder:text-zinc-600 focus:border-copper-500/50 focus:outline-none focus:ring-1 focus:ring-copper-500/20"
            />
          </div>
          <SeasonToggle
            seasonId={seasonId}
            options={SEASON_OPTIONS}
            hrefForSeason={(id) => `/stats/players/?season=${id}`}
          />
        </div>
      </div>

      <div className="mb-8 flex flex-col gap-3 rounded-xl border border-copper-500/20 bg-copper-600/10 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-bold text-copper-400 uppercase tracking-tighter">Current View:</span>
          <span className="text-lg font-bold text-white">{seasonLabel}</span>
        </div>
        <p className="w-full break-words text-[10px] font-medium uppercase leading-relaxed tracking-[0.1em] text-zinc-400 md:hidden">
          Season-specific ratings and player stats.
        </p>
        <p className="hidden max-w-2xl text-xs font-medium uppercase leading-relaxed tracking-[0.18em] text-zinc-400 md:block">
          {seasonModelCopy}
        </p>
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
                <TableHead className="text-center font-bold text-copper-500 uppercase tracking-tighter whitespace-nowrap px-4">
                  OVR
                </TableHead>
                {STAT_TABLE_COLUMNS.map((stat) => (
                  <TableHead
                    key={stat}
                    className={cn(
                      "text-center font-bold uppercase tracking-tighter whitespace-nowrap px-4",
                      stat === "PPG" || stat === "EFF" ? "text-copper-500" : "text-zinc-500"
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
                const overallClasses = getOverallTierClasses(entry.overall);

                return (
                  <TableRow
                    key={`${player.name}-${teamName}-${i}`}
                    className="border-white/5 hover:bg-white/5 transition-colors group"
                  >
                    <TableCell className="font-bold text-white group-hover:text-copper-500">
                      <Link
                        href={buildPlayerProfileHref(player.name, {
                          seasonId,
                          teamName,
                          returnTo,
                        })}
                        prefetch={false}
                        className="flex items-center gap-3 whitespace-nowrap"
                      >
                        <PlayerHead
                          playerName={player.name}
                          playerHead={player.PlayerHead}
                          size={32}
                          className="rounded-md shrink-0"
                        />
                        <span className="uppercase tracking-tight">{player.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-zinc-500 font-bold text-sm uppercase tracking-tight whitespace-nowrap">
                      <Link
                        href={buildTeamProfileHref(teamName, { seasonId, returnTo })}
                        prefetch={false}
                        className="hover:text-white transition-colors"
                      >
                        {teamName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          "inline-flex min-w-11 items-center justify-center rounded-full px-2.5 py-1 text-sm font-black italic",
                          overallClasses.badge
                        )}
                      >
                        {entry.overall ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-medium text-zinc-400">{aggregated.GAMES}</TableCell>
                    <TableCell className="text-center font-black text-white">{aggregated.Points}</TableCell>
                    <TableCell className="text-center font-black text-copper-500 italic">{aggregated.PPG}</TableCell>
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
                    <TableCell className="text-right font-black text-copper-500 italic">{aggregated.EFF}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-3 border-t border-white/5 bg-zinc-950/70 px-4 py-4 text-sm text-zinc-400 md:flex-row md:items-center md:justify-between">
          <div>
            Showing <span className="font-bold text-white">{filteredPlayers.length}</span> players
          </div>
        </div>
      </div>
    </div>
  );
}
