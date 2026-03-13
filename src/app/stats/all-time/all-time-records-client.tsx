"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Flame, Star, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import PlayerHead from "@/components/league/player-head";

type RecordListItem = {
  name: string;
  playerHead?: string;
  href: string;
  meta: string;
  detail?: string;
  value: string;
  badge: string;
};

type RecordSection = {
  key: string;
  label: string;
  icon: "trophy" | "star" | "flame";
  items: RecordListItem[];
};

type RecordView = "career" | "games";

function getSectionIcon(icon: RecordSection["icon"]) {
  if (icon === "star") return Star;
  if (icon === "flame") return Flame;
  return Trophy;
}

export default function AllTimeRecordsClient({
  careerSections,
  gameHighSections,
}: {
  careerSections: RecordSection[];
  gameHighSections: RecordSection[];
}) {
  const [activeView, setActiveView] = React.useState<RecordView>("career");

  const sections = activeView === "career" ? careerSections : gameHighSections;

  return (
    <>
      <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-copper-400">
            CBT history archive
          </p>
          <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-white md:text-3xl">
            {activeView === "career" ? "Career Records" : "Single-Game Highs"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
            {activeView === "career"
              ? "All-time leaders across every CBT season, from career scoring totals to rate-based marks."
              : "The biggest one-night explosions in league history, pulled straight from each player&apos;s game log."}
          </p>
        </div>

        <div className="inline-flex w-full rounded-2xl border border-white/10 bg-zinc-950/60 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:w-auto">
          <button
            type="button"
            onClick={() => setActiveView("career")}
            className={cn(
              "flex-1 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition-all md:flex-none",
              activeView === "career"
                ? "bg-copper-500 text-white shadow-[0_12px_28px_rgba(249,115,22,0.25)]"
                : "text-zinc-500 hover:text-white"
            )}
          >
            Career Records
          </button>
          <button
            type="button"
            onClick={() => setActiveView("games")}
            className={cn(
              "flex-1 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition-all md:flex-none",
              activeView === "games"
                ? "bg-white text-zinc-950 shadow-[0_12px_28px_rgba(255,255,255,0.12)]"
                : "text-zinc-500 hover:text-white"
            )}
          >
            Single-Game Highs
          </button>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        {sections.map((section) => {
          const Icon = getSectionIcon(section.icon);

          return (
            <div key={section.key} className="min-w-0 space-y-8">
              <div className="flex items-center gap-4">
                <Icon className="h-6 w-6 text-zinc-400" />
                <h3 className="text-2xl font-black uppercase tracking-tight text-white">{section.label}</h3>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="space-y-4">
                {section.items.map((player, index) => (
                  <Link
                    key={`${section.key}-${player.name}-${index}`}
                    href={player.href}
                    prefetch={false}
                    className="group flex min-w-0 items-center gap-4 rounded-2xl border border-white/5 bg-zinc-900/40 p-4 transition-all hover:border-white/10 hover:bg-zinc-900"
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black italic shadow-inner",
                        index === 0
                          ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white"
                          : index === 1
                            ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white"
                            : index === 2
                              ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white"
                              : "bg-zinc-800 text-zinc-500"
                      )}
                    >
                      {index + 1}
                    </div>

                    <PlayerHead
                      playerName={player.name}
                      playerHead={player.playerHead}
                      size={40}
                      className="shrink-0 rounded-lg"
                    />

                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-bold uppercase tracking-tight text-white transition-colors group-hover:text-copper-500">
                        {player.name}
                      </h4>
                      <p className="truncate text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-600">
                        {player.meta}
                      </p>
                      {player.detail ? (
                        <p className="mt-1 truncate text-[11px] font-medium text-zinc-500">{player.detail}</p>
                      ) : null}
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-black italic text-white">{player.value}</p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
                        {player.badge}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-24 rounded-3xl border border-white/5 bg-gradient-to-r from-zinc-900 to-black p-12 text-center">
        <Trophy className="mx-auto mb-6 h-12 w-12 text-copper-500" />
        <h2 className="mb-4 text-3xl font-bold text-white">Want to see more records?</h2>
        <p className="mx-auto mb-8 max-w-xl text-zinc-400">
          Explore the detailed season-by-season breakdown in our expanded league leaders section.
        </p>
        <Link
          href="/stats/leaders/"
          prefetch={false}
          className="inline-flex items-center gap-2 rounded-xl bg-copper-600 px-8 py-4 font-bold text-white transition-all hover:bg-copper-700"
        >
          LEAGUE LEADERS <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </>
  );
}
