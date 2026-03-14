import React, { Suspense } from "react";
import { Metadata } from "next";
import LeadersClient from "./leaders-client";

export const metadata: Metadata = {
    title: "League Leaders | CBT League",
    description: "Top performers in Points, Rebounds, and Assists in the CBT basketball league.",
};

export default function LeadersPage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center text-white">Loading...</div>}>
            <LeadersClient />
        </Suspense>
    );
}
