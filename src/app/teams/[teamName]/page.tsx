import React, { Suspense } from "react";
import { Metadata } from "next";
import TeamProfileClient from "./team-profile-client";
import allData from "@/data/data.json";

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

export async function generateStaticParams() {
    const paths: { teamName: string }[] = [];
    Object.keys((allData as any).seasons).forEach(seasonId => {
        const teams = (allData as any).seasons[seasonId]?.teams || [];
        teams.forEach((team: any) => {
            const trimmedTeam = team.Team.trim();
            paths.push({ teamName: trimmedTeam });
            paths.push({ teamName: encodeURIComponent(trimmedTeam) });
        });
    });

    // De-dupe by teamName to avoid warnings if the same team is in multiple seasons
    const uniqueTeams = Array.from(new Set(paths.map(p => p.teamName)));
    return uniqueTeams.map(t => ({ teamName: String(t) }));
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
