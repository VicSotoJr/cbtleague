import React, { Suspense } from "react";
import { Metadata } from "next";
import PlayerProfileClient, { type SeasonStats } from "./player-profile-client";
import { aggregatePlayerStats, getLeagueData } from "@/lib/league-data";

function normalizePlayerKey(value: string): string {
    return value.trim().toLowerCase();
}

function getPlayerSeasonStats(playerName: string): SeasonStats[] {
    const leagueData = getLeagueData();
    const normalizedPlayerName = normalizePlayerKey(playerName);
    const seasonIds = Object.keys(leagueData.seasons).toSorted((a, b) => Number(a) - Number(b));
    const results: SeasonStats[] = [];

    for (const seasonId of seasonIds) {
        const seasonData = leagueData.seasons[seasonId];

        for (const team of seasonData.teams) {
            const player = team.roster.find((entry) => normalizePlayerKey(entry.name) === normalizedPlayerName);
            if (!player) {
                continue;
            }

            results.push({
                seasonId,
                seasonName: seasonData.name,
                teamName: team.Team,
                stats: aggregatePlayerStats(player),
                playerHead: player.PlayerHead,
                gameLogs: player.stats ?? [],
            });
        }
    }

    return results;
}

export async function generateMetadata(props: {
    params: Promise<{ playerName: string }>;
}): Promise<Metadata> {
    const params = await props.params;
    const playerName = decodeURIComponent(params.playerName).trim();
    return {
        title: `${playerName} | Player Profile | CBT League`,
        description: `Career statistics and game logs for ${playerName} in the CBT League.`,
    };
}

export const dynamicParams = false;

export async function generateStaticParams() {
    const playerNames = new Set<string>();
    const leagueData = getLeagueData();

    Object.values(leagueData.seasons).forEach((season) => {
        season.teams.forEach((team) => {
            team.roster.forEach((player) => {
                if (player.name) {
                    playerNames.add(player.name.trim());
                }
            });
        });
    });

    const paths: { playerName: string }[] = [];
    playerNames.forEach(name => {
        paths.push({ playerName: name });
        if (name.includes(" ") || name.includes("$")) {
            paths.push({ playerName: encodeURIComponent(name) });
        }
    });

    return Array.from(new Set(paths.map(p => p.playerName))).map(name => ({
        playerName: name,
    }));
}

export default async function PlayerProfilePage(props: {
    params: Promise<{ playerName: string }>;
}) {
    const params = await props.params;
    const playerName = decodeURIComponent(params.playerName).trim();
    const seasonData = getPlayerSeasonStats(playerName);

    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center text-white">Loading...</div>}>
            <PlayerProfileClient playerName={playerName} seasonData={seasonData} />
        </Suspense>
    );
}
