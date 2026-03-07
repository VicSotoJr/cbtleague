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

export const dynamicParams = false;

export async function generateStaticParams() {
    const playerNames = new Set<string>();

    Object.values((allData as any).seasons).forEach((season: any) => {
        season.teams?.forEach((team: any) => {
            team.roster?.forEach((player: any) => {
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

    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center text-white">Loading...</div>}>
            <PlayerProfileClient playerName={playerName} />
        </Suspense>
    );
}
