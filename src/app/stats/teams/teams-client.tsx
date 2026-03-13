"use client";

import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SeasonToggle from "@/components/league/season-toggle";
import { cn } from "@/lib/utils";
import { getSeasonId, getSeasonLabel, getSeasonTeamsWithAggregates, SEASON_OPTIONS } from "@/lib/league-summary";
import { STAT_TABLE_COLUMNS, type StatTableColumn } from "@/lib/stat-columns";
import { buildCurrentReturnTo, buildTeamProfileHref } from "@/lib/player-links";

const rateFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

const percentStats = new Set<StatTableColumn>(["FG%", "2P%", "3P%", "FT%"]);
const highlightedStats = new Set<StatTableColumn>(["PTS", "EFF"]);
const brighterTotalStats = new Set<StatTableColumn>(["REB", "AST", "STL", "BLK", "TOV"]);

function getTeamEfficiency(team: ReturnType<typeof getSeasonTeamsWithAggregates>[number]) {
  const gamesPlayedForRate = Math.max(team.gamesPlayed, 1);
  const missedFG = Math.max(0, team.aggregated.FieldGoalAttempts - team.aggregated.FieldGoalsMade);
  const missedFT = Math.max(0, team.aggregated.FreeThrowsAttempts - team.aggregated.FreeThrowsMade);

  return (
    (team.aggregated.Points +
      team.aggregated.Rebounds +
      team.aggregated.Assists +
      team.aggregated.Steals +
      team.aggregated.Blocks -
      missedFG -
      missedFT -
      team.aggregated.Turnovers) /
    gamesPlayedForRate
  );
}

function getTeamStatValue(team: ReturnType<typeof getSeasonTeamsWithAggregates>[number], stat: StatTableColumn) {
  const gamesPlayedForRate = Math.max(team.gamesPlayed, 1);

  switch (stat) {
    case "GP":
      return team.gamesPlayed;
    case "PTS":
      return team.aggregated.Points;
    case "PPG":
      return team.aggregated.Points / gamesPlayedForRate;
    case "FGM":
      return team.aggregated.FieldGoalsMade;
    case "FGA":
      return team.aggregated.FieldGoalAttempts;
    case "FG%":
      return team.aggregated["FG%"];
    case "2PM":
      return team.aggregated.twoPM;
    case "2PA":
      return team.aggregated.twoPA;
    case "2P%":
      return team.aggregated["2P%"];
    case "3PM":
      return team.aggregated.ThreesMade;
    case "3PA":
      return team.aggregated.ThreesAttempts;
    case "3P%":
      return team.aggregated["3P%"];
    case "FTM":
      return team.aggregated.FreeThrowsMade;
    case "FTA":
      return team.aggregated.FreeThrowsAttempts;
    case "FT%":
      return team.aggregated["FT%"];
    case "OREB":
      return team.aggregated.Offrebounds;
    case "DREB":
      return team.aggregated.Defrebounds;
    case "REB":
      return team.aggregated.Rebounds;
    case "RPG":
      return team.aggregated.Rebounds / gamesPlayedForRate;
    case "AST":
      return team.aggregated.Assists;
    case "APG":
      return team.aggregated.Assists / gamesPlayedForRate;
    case "STL":
      return team.aggregated.Steals;
    case "SPG":
      return team.aggregated.Steals / gamesPlayedForRate;
    case "BLK":
      return team.aggregated.Blocks;
    case "BPG":
      return team.aggregated.Blocks / gamesPlayedForRate;
    case "TOV":
      return team.aggregated.Turnovers;
    case "TOVPG":
      return team.aggregated.Turnovers / gamesPlayedForRate;
    case "PF":
      return team.aggregated.PersonalFouls;
    case "EFF":
      return getTeamEfficiency(team);
  }
}

function formatTeamStatValue(team: ReturnType<typeof getSeasonTeamsWithAggregates>[number], stat: StatTableColumn) {
  const value = getTeamStatValue(team, stat);

  if (percentStats.has(stat)) {
    return `${rateFormatter.format(value)}%`;
  }

  if (stat === "PPG" || stat === "RPG" || stat === "APG" || stat === "SPG" || stat === "BPG" || stat === "TOVPG" || stat === "EFF") {
    return rateFormatter.format(value);
  }

  return rateFormatter.format(value);
}

export default function TeamStatsClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const seasonId = getSeasonId(searchParams.get("season"));
  const returnTo = React.useMemo(() => buildCurrentReturnTo(pathname, searchParams), [pathname, searchParams]);
  const teams = React.useMemo(
    () =>
      getSeasonTeamsWithAggregates(seasonId).toSorted(
        (a, b) => b.aggregated.Points - a.aggregated.Points
      ),
    [seasonId]
  );
  const seasonLabel = getSeasonLabel(seasonId);

  return (
    <div className="container mx-auto overflow-x-hidden px-4 py-12 md:px-6">
      <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl uppercase italic">
            Team <span className="text-copper-500">Stats</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Full team box score totals and rates using the same stat categories as player stats.
          </p>
        </div>

        <SeasonToggle
          seasonId={seasonId}
          options={SEASON_OPTIONS}
          hrefForSeason={(id) => `/stats/teams/?season=${id}`}
        />
      </div>

      <div className="mb-8 flex flex-col gap-3 rounded-xl border border-copper-500/20 bg-copper-600/10 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-tighter text-copper-400">Current View:</span>
          <span className="text-lg font-bold text-white">{seasonLabel}</span>
        </div>
        <p className="w-full break-words text-[10px] font-medium uppercase leading-relaxed tracking-[0.1em] text-zinc-400 md:hidden">
          Season-specific team totals and rate stats.
        </p>
        <p className="hidden max-w-2xl text-xs font-medium uppercase leading-relaxed tracking-[0.18em] text-zinc-400 md:block">
          Season-specific team totals and rate stats.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50 shadow-2xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="sticky left-0 z-10 min-w-[180px] bg-zinc-900 font-bold uppercase tracking-tighter italic text-white">
                  Team
                </TableHead>
                {STAT_TABLE_COLUMNS.map((stat) => (
                  <TableHead
                    key={stat}
                    className={cn(
                      "px-4 text-center font-bold uppercase tracking-tighter whitespace-nowrap",
                      highlightedStats.has(stat) ? "text-copper-500" : "text-zinc-500"
                    )}
                  >
                    {stat}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.Team} className="group border-white/5 transition-colors hover:bg-white/5">
                  <TableCell className="sticky left-0 z-10 bg-zinc-900/90 font-bold text-white backdrop-blur-md group-hover:text-copper-500">
                    <Link
                      href={buildTeamProfileHref(team.Team, { seasonId, returnTo })}
                      prefetch={false}
                      className="whitespace-nowrap uppercase tracking-tight"
                    >
                      {team.Team}
                    </Link>
                  </TableCell>
                  {STAT_TABLE_COLUMNS.map((stat) => (
                    <TableCell
                      key={`${team.Team}-${stat}`}
                      className={cn(
                        "text-center",
                        highlightedStats.has(stat) && "font-black italic text-copper-500",
                        percentStats.has(stat) && "font-mono font-bold text-zinc-500",
                        brighterTotalStats.has(stat) && "font-medium text-zinc-300",
                        !highlightedStats.has(stat) &&
                          !percentStats.has(stat) &&
                          !brighterTotalStats.has(stat) &&
                          "font-medium text-zinc-400",
                        stat === "PTS" && "font-black",
                        stat === "REB" && "font-bold text-zinc-300"
                      )}
                    >
                      {formatTeamStatValue(team, stat)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
