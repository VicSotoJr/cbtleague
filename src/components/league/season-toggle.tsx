"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type SeasonOption = {
  id: string;
  label?: string;
};

interface SeasonToggleProps {
  seasonId: string;
  options: readonly SeasonOption[];
  hrefForSeason: (seasonId: string) => string;
  className?: string;
}

export default function SeasonToggle({
  seasonId,
  options,
  hrefForSeason,
  className,
}: SeasonToggleProps) {
  return (
    <div className={cn("flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-2", className)}>
      <span className="pl-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Season</span>
      <div className="flex gap-1">
        {options.map((season) => (
          <Link
            key={season.id}
            href={hrefForSeason(season.id)}
            prefetch={false}
            className={cn(
              "rounded-xl px-5 py-2 text-xs font-black uppercase tracking-widest transition-all",
              seasonId === season.id
                ? "bg-copper-600 text-white shadow-lg shadow-copper-600/20"
                : "text-zinc-500 hover:bg-white/5 hover:text-white"
            )}
          >
            {season.id}
          </Link>
        ))}
      </div>
    </div>
  );
}
