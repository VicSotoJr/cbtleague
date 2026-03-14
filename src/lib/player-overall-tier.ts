export function getOverallTierClasses(overall: number | null | undefined) {
  if (overall == null) {
    return {
      badge: "border-white/10 bg-white/5 text-zinc-300",
      text: "text-zinc-200",
      icon: "text-zinc-200",
      iconSurface: "bg-white/5 border border-white/10",
      ring: "from-[#d4d4d8] via-[#71717a] to-[#18181b]",
      glow: "bg-zinc-300/20",
      tierLabel: "UNRATED",
    };
  }

  if (overall >= 90) {
    return {
      badge: "border-amber-300/35 bg-amber-300/10 text-amber-200",
      text: "text-amber-200",
      icon: "text-amber-200",
      iconSurface: "bg-amber-300/10 border border-amber-300/20",
      ring: "from-[#fff2b3] via-[#d4a63a] to-[#7a5512]",
      glow: "bg-amber-300/35",
      tierLabel: "GOLD",
    };
  }

  if (overall >= 80) {
    return {
      badge: "border-white/35 bg-white/10 text-white",
      text: "text-white",
      icon: "text-white",
      iconSurface: "bg-white/10 border border-white/20",
      ring: "from-[#ffffff] via-[#d4d4d8] to-[#3f3f46]",
      glow: "bg-white/25",
      tierLabel: "ELITE",
    };
  }

  if (overall >= 70) {
    return {
      badge: "border-orange-300/35 bg-orange-300/10 text-orange-200",
      text: "text-orange-200",
      icon: "text-orange-200",
      iconSurface: "bg-orange-300/10 border border-orange-300/20",
      ring: "from-[#f3c58e] via-[#b8742e] to-[#5b3414]",
      glow: "bg-orange-300/30",
      tierLabel: "BRONZE",
    };
  }

  return {
    badge: "border-white/10 bg-white/5 text-zinc-300",
    text: "text-zinc-200",
    icon: "text-zinc-200",
    iconSurface: "bg-white/5 border border-white/10",
    ring: "from-[#d4d4d8] via-[#71717a] to-[#18181b]",
    glow: "bg-zinc-300/20",
    tierLabel: "RATED",
  };
}
