import React, { Suspense } from "react";
import { Metadata } from "next";
import TeamProfileClient from "./team-profile-client";
import { getLeagueData } from "@/lib/league-data";

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

    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center text-white">Loading...</div>}>
            <TeamProfileClient teamName={teamName} />
        </Suspense>
    );
}
