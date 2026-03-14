import React, { Suspense } from "react";
import { Metadata } from "next";
import ScheduleClient from "./schedule-client";

export const metadata: Metadata = {
    title: "Schedule | CBT League",
    description: "View upcoming and past games for the CBT basketball league.",
};

export default function SchedulePage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center text-white">Loading...</div>}>
            <ScheduleClient />
        </Suspense>
    );
}
