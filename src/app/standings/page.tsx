import React, { Suspense } from "react";
import { Metadata } from "next";
import StandingsClient from "./standings-client";

export const metadata: Metadata = {
    title: "Standings | CBT League",
    description: "View current and historical standings for the CBT basketball league.",
};

export default function StandingsPage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center text-white">Loading...</div>}>
            <StandingsClient />
        </Suspense>
    );
}
