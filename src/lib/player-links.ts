type PlayerLinkContext = {
  seasonId?: string | null;
  teamName?: string | null;
  returnTo?: string | null;
};

type TeamLinkContext = {
  seasonId?: string | null;
  returnTo?: string | null;
};

export function getSafeReturnTo(value?: string | null): string | null {
  const trimmed = value?.trim();

  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  return trimmed;
}

export function buildCurrentReturnTo(
  pathname: string,
  searchParams: Pick<URLSearchParams, "toString">
): string {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function buildPlayerProfileHref(playerName: string, context: PlayerLinkContext = {}): string {
  const pathname = `/players/${encodeURIComponent(playerName.trim())}/`;
  const params = new URLSearchParams();

  if (context.seasonId?.trim()) {
    params.set("season", context.seasonId.trim());
  }

  if (context.teamName?.trim()) {
    params.set("team", context.teamName.trim());
  }

  const safeReturnTo = getSafeReturnTo(context.returnTo);
  if (safeReturnTo) {
    params.set("returnTo", safeReturnTo);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function buildTeamProfileHref(teamName: string, context: TeamLinkContext = {}): string {
  const pathname = `/teams/${encodeURIComponent(teamName.trim())}/`;
  const params = new URLSearchParams();

  if (context.seasonId?.trim()) {
    params.set("season", context.seasonId.trim());
  }

  const safeReturnTo = getSafeReturnTo(context.returnTo);
  if (safeReturnTo) {
    params.set("returnTo", safeReturnTo);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
