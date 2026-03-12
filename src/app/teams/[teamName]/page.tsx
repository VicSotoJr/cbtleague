import React, { Suspense } from "react";
import { Metadata } from "next";
import TeamProfileClient, { type TeamProfileSeason } from "./team-profile-client";
import {
    aggregatePlayerStats,
    getLeagueData,
    getSeasonPlayersWithAggregates,
    getSeasonTeamsWithAggregates,
} from "@/lib/league-data";
import { getSeasonChampion } from "@/lib/season-honors";
import { getSeasonPlayerOveralls } from "@/lib/player-overalls";

function normalizeTeamKey(value: string): string {
    return value.replace(/\s+/g, "").trim().toLowerCase();
}

function getTeamSeasons(teamName: string): TeamProfileSeason[] {
    const normalizedName = normalizeTeamKey(teamName);
    const seasonIds = Object.keys(getLeagueData().seasons).toSorted((a, b) => Number(b) - Number(a));

    const results: TeamProfileSeason[] = [];

    for (const seasonId of seasonIds) {
        const seasonTeams = getSeasonTeamsWithAggregates(seasonId);
        const overallsByPlayerName = new Map(
            getSeasonPlayerOveralls(getSeasonPlayersWithAggregates(seasonId), seasonId).map((entry) => [
                entry.player.name.trim().toLowerCase(),
                entry.overall,
            ])
        );
        const match = seasonTeams.find((team) => normalizeTeamKey(team.Team) === normalizedName);
        if (!match) {
            continue;
        }

        results.push({
            seasonId,
            championTeam: getSeasonChampion(seasonId)?.teamName ?? null,
            team: {
                Team: match.Team,
                wins: match.wins,
                loss: match.loss,
                gamesPlayed: match.gamesPlayed,
                aggregated: match.aggregated,
                roster: match.roster.map((player) => {
                    const aggregatedPlayer = aggregatePlayerStats(player);

                    return {
                        name: player.name,
                        number: player.number,
                        PlayerHead: player.PlayerHead,
                        gp: aggregatedPlayer.GAMES,
                        ppg: aggregatedPlayer.PPG,
                        apg: aggregatedPlayer.APG,
                        rpg: aggregatedPlayer.RPG,
                        overall: overallsByPlayerName.get(player.name.trim().toLowerCase()) ?? 60,
                    };
                }),
            },
        });
    }

    return results;
}

export async function generateMetadata(props: {
    params: Promise<{ teamName: string }>;
}): Promise<Metadata> {
    const params = await props.params;
    const teamName = decodeURIComponent(params.teamName).trim();
    return {
        title: `${teamName} | CBT League`,
        description: `Roster and statistics for ${teamName}.`,
    };
}

export const dynamicParams = false;

export async function generateStaticParams() {
    const teamNames = new Set<string>();
    const leagueData = getLeagueData();

    Object.values(leagueData.seasons).forEach((season) => {
        season.teams.forEach((team) => {
            if (team.Team) {
                teamNames.add(team.Team.trim());
            }
        });
        // Also include names from schedule as they might differ (e.g., spacing)
        season.schedule.forEach((game) => {
            if (game.homeTeam) teamNames.add(game.homeTeam.trim());
            if (game.awayTeam) teamNames.add(game.awayTeam.trim());
            if (game.byeTeam) teamNames.add(game.byeTeam.trim());
        });
    });

    const paths: { teamName: string }[] = [];
    teamNames.forEach(name => {
        paths.push({ teamName: name });
        if (name.includes(" ") || name.includes("$")) {
            paths.push({ teamName: encodeURIComponent(name) });
        }
    });

    // De-dupe the objects
    const uniquePaths = Array.from(new Set(paths.map(p => p.teamName))).map(name => ({
        teamName: name,
    }));

    return uniquePaths;
}

export default async function TeamProfilePage(props: {
    params: Promise<{ teamName: string }>;
}) {
    const params = await props.params;
    const teamName = decodeURIComponent(params.teamName).trim();
    const seasons = getTeamSeasons(teamName);

    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center text-white">Loading...</div>}>
            <TeamProfileClient seasons={seasons} />
        </Suspense>
    );
}
