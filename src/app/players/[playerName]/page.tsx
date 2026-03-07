import React, { Suspense } from "react";
import { Metadata } from "next";
import PlayerProfileClient from "./player-profile-client";
import allData from "@/data/data.json";

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

export async function generateStaticParams() {
    const paths: { playerName: string }[] = [];

    Object.entries((allData as any).seasons).forEach(([seasonId, seasonData]: [string, any]) => {
        seasonData.teams.forEach((team: any) => {
            team.roster.forEach((player: any) => {
                if (player.name) {
                    paths.push({ playerName: player.name.trim() });
                    // Next.js can be extremely flaky with encoded static params
                    // Generate both the unencoded and encoded versions just in case
                    paths.push({ playerName: encodeURIComponent(player.name.trim()) });
                }
            });
        });
    });

    const uniquePlayers = Array.from(new Set(paths.map(p => p.playerName)));
    return uniquePlayers.map(p => ({ playerName: String(p) }));
}

export default async function PlayerProfilePage(props: {
    params: Promise<{ playerName: string }>;
}) {
    const params = await props.params;
    const playerName = decodeURIComponent(params.playerName).trim();

    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center text-white">Loading...</div>}>
            <PlayerProfileClient playerName={playerName} />
        </Suspense>
    );
}
