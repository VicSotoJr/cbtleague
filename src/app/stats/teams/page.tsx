import React, { Suspense } from "react";
import { Metadata } from "next";
import TeamStatsClient from "./teams-client";

export const metadata: Metadata = {
    title: "Team Stats | CBT League",
    description: "View comprehensive team statistics for the CBT basketball league.",
};

export default function TeamStatsPage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center text-white">Loading...</div>}>
            <TeamStatsClient />
        </Suspense>
    );
}
