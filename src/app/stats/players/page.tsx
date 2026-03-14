import React, { Suspense } from "react";
import { Metadata } from "next";
import PlayersClient from "./players-client";

export const metadata: Metadata = {
    title: "Player Stats | CBT League",
    description: "View comprehensive player statistics for the CBT basketball league.",
};

export default function PlayerStatsPage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center text-white">Loading...</div>}>
            <PlayersClient />
        </Suspense>
    );
}
