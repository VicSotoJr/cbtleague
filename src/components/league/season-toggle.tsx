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
    <div
      className={cn(
        "flex w-full flex-col gap-3 rounded-2xl border border-white/5 bg-white/5 p-2 sm:w-auto sm:flex-row sm:items-center sm:gap-4",
        className
      )}
    >
      <span className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 sm:pl-3">Season</span>
      <div className="grid w-full grid-cols-3 gap-1 sm:flex sm:w-auto">
        {options.map((season) => (
          <Link
            key={season.id}
            href={hrefForSeason(season.id)}
            prefetch={false}
            className={cn(
              "rounded-xl px-4 py-2 text-center text-xs font-black uppercase tracking-widest transition-all sm:px-5",
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
