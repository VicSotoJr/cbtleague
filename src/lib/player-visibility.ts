const HIDDEN_DISPLAY_PLAYERS = new Set(["1::z"]);

function normalizePlayerName(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function shouldHideSeasonPlayerFromDisplay(
  playerName: string | null | undefined,
  seasonId: string | null | undefined
): boolean {
  if (!seasonId) {
    return false;
  }

  return HIDDEN_DISPLAY_PLAYERS.has(`${seasonId}::${normalizePlayerName(playerName)}`);
}

export function filterDisplayableSeasonPlayers<T>(
  players: T[],
  seasonId: string | null | undefined,
  getName: (player: T) => string | null | undefined
): T[] {
  return players.filter((player) => !shouldHideSeasonPlayerFromDisplay(getName(player), seasonId));
}
