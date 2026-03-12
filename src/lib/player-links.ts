type PlayerLinkContext = {
  seasonId?: string | null;
  teamName?: string | null;
};

export function buildPlayerProfileHref(playerName: string, context: PlayerLinkContext = {}): string {
  const pathname = `/players/${encodeURIComponent(playerName.trim())}/`;
  const params = new URLSearchParams();

  if (context.seasonId?.trim()) {
    params.set("season", context.seasonId.trim());
  }

  if (context.teamName?.trim()) {
    params.set("team", context.teamName.trim());
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
