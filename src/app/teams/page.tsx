import React, { Suspense } from "react";
import { Metadata } from "next";
import TeamsClient from "./teams-client";

export const metadata: Metadata = {
    title: "Teams | CBT League",
    description: "Browse teams and rosters across all seasons of the CBT basketball league.",
};

export default function TeamsPage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center text-white">Loading...</div>}>
            <TeamsClient />
        </Suspense>
    );
}
