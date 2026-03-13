"use client";

import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import TeamLogo from "@/components/league/team-logo";
import PlayerHead from "@/components/league/player-head";
import { ArrowLeft } from "lucide-react";
import type { AggregatedBaseStats } from "@/types/league";
import { buildCurrentReturnTo, buildPlayerProfileHref, getSafeReturnTo } from "@/lib/player-links";
import { cn } from "@/lib/utils";
import { getOverallTierClasses } from "@/lib/player-overall-tier";

type TeamProfileRosterPlayer = {
  name: string;
  number: string | number;
  PlayerHead?: string;
  gp: number;
  ppg: number;
  apg: number;
  rpg: number;
  overall: number | null;
};

type TeamProfileSnapshot = {
  Team: string;
  wins: number;
  loss: number;
  gamesPlayed: number;
  aggregated: AggregatedBaseStats;
  roster: TeamProfileRosterPlayer[];
};

export type TeamProfileSeason = {
  seasonId: string;
  championTeam: string | null;
  team: TeamProfileSnapshot;
};

interface TeamProfileClientProps {
  seasons: TeamProfileSeason[];
}

function RosterStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-zinc-950/60 px-2 py-1.5 text-center">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

export default function TeamProfileClient({ seasons }: TeamProfileClientProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedSeason = searchParams.get("season");
  const explicitReturnTo = getSafeReturnTo(searchParams.get("returnTo"));

  const seasonId = React.useMemo(() => {
    if (requestedSeason && seasons.some((season) => season.seasonId === requestedSeason)) {
      return requestedSeason;
    }

    return seasons[0]?.seasonId ?? "3";
  }, [requestedSeason, seasons]);

  const selectedSeason = React.useMemo(
    () => seasons.find((season) => season.seasonId === seasonId) ?? null,
    [seasonId, seasons]
  );
  const team = selectedSeason?.team ?? null;
  const championTeam = selectedSeason?.championTeam ?? null;
  const isChampion = championTeam === team?.Team;
  const currentReturnTo = React.useMemo(() => buildCurrentReturnTo(pathname, searchParams), [pathname, searchParams]);

  if (!team) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl font-bold">Team Not Found</h1>
        <p className="mt-4 text-zinc-400">The team you are looking for does not exist in season {seasonId}.</p>
        <Link href="/teams/" prefetch={false} className="mt-8 inline-flex text-copper-500 hover:underline">
          Back to Teams
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto overflow-x-hidden px-4 py-12 md:px-6">
      <Link
        href={explicitReturnTo ?? `/teams/?season=${seasonId}`}
        prefetch={false}
        className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {explicitReturnTo ? "BACK" : "BACK TO TEAMS"}
      </Link>

      <div className="relative mb-12 flex flex-col items-center gap-8 md:flex-row md:items-end">
        <TeamLogo teamName={team.Team} size={192} className="rounded-3xl shadow-2xl" />
        <div className="text-center md:text-left">
          <div className="flex flex-wrap justify-center gap-2 md:justify-start mb-4">
            <span className="rounded-full bg-copper-600/10 px-3 py-1 text-xs font-bold text-copper-500 border border-copper-500/20 uppercase tracking-widest">
              Season {seasonId}
            </span>
            {isChampion && (
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-300">
                Season Champion
              </span>
            )}
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white sm:text-5xl md:text-7xl uppercase">{team.Team}</h1>
          <div className="mt-4 flex flex-wrap justify-center gap-6 md:justify-start">
            <div className="text-center md:text-left">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Record</p>
              <p className="text-2xl font-black text-white">
                {team.wins}W - {team.loss}L
              </p>
            </div>
            <div className="text-center md:text-left border-l border-white/10 pl-6">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Win %</p>
              <p className="text-2xl font-black text-copper-500">{(team.wins / (team.wins + team.loss) || 0).toFixed(3)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white shrink-0 italic uppercase tracking-tighter">Team Roster</h2>
            <div className="h-px w-full bg-white/10" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {team.roster.map((player, i) => {
              const overallClasses = getOverallTierClasses(player.overall);

              return (
                <Link
                  key={`${player.name}-${i}`}
                  href={buildPlayerProfileHref(player.name, {
                    seasonId,
                    teamName: team.Team,
                    returnTo: currentReturnTo,
                  })}
                  prefetch={false}
                  className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50 p-4 transition-all hover:bg-zinc-900 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(194,120,69,0.12),transparent_34%)] opacity-70 transition-opacity group-hover:opacity-100" />

                  <div className="relative flex items-start gap-4">
                    <PlayerHead
                      playerName={player.name}
                      playerHead={player.PlayerHead}
                      size={64}
                      className="rounded-xl group-hover:scale-110 transition-transform"
                    />
                    <div className="min-w-0 flex-1 pr-2">
                      <h3 className="truncate font-bold text-white group-hover:text-copper-500 transition-colors uppercase tracking-tight">
                        {player.name}
                      </h3>
                      <div className="mt-2 flex items-center gap-2">
                        <p className="text-sm font-mono text-zinc-500">#{player.number}</p>
                      </div>
                    </div>
                    <div className="relative shrink-0">
                      <div className={cn("absolute inset-1 rounded-full blur-md", overallClasses.glow)} />
                      <div
                        className={cn(
                          "relative grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br p-[2px] shadow-[0_14px_30px_rgba(0,0,0,0.4)]",
                          overallClasses.ring
                        )}
                      >
                        <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-black/40 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.08),rgba(24,24,27,0.98)_48%,rgba(8,8,10,1)_100%)] text-center">
                          <span className="text-[8px] font-black uppercase tracking-[0.22em] text-white/70">OVR</span>
                          <span className={cn("mt-0.5 text-2xl font-black italic leading-none", overallClasses.text)}>
                            {player.overall ?? "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-4 grid grid-cols-4 gap-2 border-t border-white/5 pt-3">
                    <RosterStat label="GP" value={String(player.gp)} />
                    <RosterStat label="PPG" value={player.ppg.toFixed(1)} />
                    <RosterStat label="APG" value={player.apg.toFixed(1)} />
                    <RosterStat label="RPG" value={player.rpg.toFixed(1)} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white shrink-0 italic uppercase tracking-tighter">Season Statistics</h2>
            <div className="h-px w-full bg-white/10" />
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5">
                  <tr>
                    {[
                      "GP",
                      "W",
                      "L",
                      "PTS",
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
                      "REB",
                      "OREB",
                      "DREB",
                      "AST",
                      "BLK",
                      "STL",
                      "TOV",
                      "PF",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-4 py-4 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-6 text-center text-white font-bold">{team.gamesPlayed}</td>
                    <td className="px-4 py-6 text-center text-green-500 font-bold">{team.wins}</td>
                    <td className="px-4 py-6 text-center text-red-500 font-bold">{team.loss}</td>
                    <td className="px-4 py-6 text-center text-white font-black italic">{team.aggregated.Points}</td>
                    <td className="px-4 py-6 text-center text-zinc-400">{team.aggregated.FieldGoalsMade}</td>
                    <td className="px-4 py-6 text-center text-zinc-400">{team.aggregated.FieldGoalAttempts}</td>
                    <td className="px-4 py-6 text-center text-zinc-300 font-mono font-bold">{team.aggregated["FG%"]}%</td>
                    <td className="px-4 py-6 text-center text-zinc-400">{team.aggregated.twoPM}</td>
                    <td className="px-4 py-6 text-center text-zinc-400">{team.aggregated.twoPA}</td>
                    <td className="px-4 py-6 text-center text-zinc-300 font-mono font-bold">{team.aggregated["2P%"]}%</td>
                    <td className="px-4 py-6 text-center text-zinc-400">{team.aggregated.ThreesMade}</td>
                    <td className="px-4 py-6 text-center text-zinc-400">{team.aggregated.ThreesAttempts}</td>
                    <td className="px-4 py-6 text-center text-zinc-300 font-mono font-bold">{team.aggregated["3P%"]}%</td>
                    <td className="px-4 py-6 text-center text-zinc-400">{team.aggregated.FreeThrowsMade}</td>
                    <td className="px-4 py-6 text-center text-zinc-400">{team.aggregated.FreeThrowsAttempts}</td>
                    <td className="px-4 py-6 text-center text-zinc-300 font-mono font-bold">{team.aggregated["FT%"]}%</td>
                    <td className="px-4 py-6 text-center text-zinc-200 font-bold">{team.aggregated.Rebounds}</td>
                    <td className="px-4 py-6 text-center text-zinc-400">{team.aggregated.Offrebounds}</td>
                    <td className="px-4 py-6 text-center text-zinc-400">{team.aggregated.Defrebounds}</td>
                    <td className="px-4 py-6 text-center text-zinc-300">{team.aggregated.Assists}</td>
                    <td className="px-4 py-6 text-center text-zinc-300">{team.aggregated.Blocks}</td>
                    <td className="px-4 py-6 text-center text-zinc-300">{team.aggregated.Steals}</td>
                    <td className="px-4 py-6 text-center text-zinc-300">{team.aggregated.Turnovers}</td>
                    <td className="px-4 py-6 text-center text-zinc-300">{team.aggregated.PersonalFouls}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
