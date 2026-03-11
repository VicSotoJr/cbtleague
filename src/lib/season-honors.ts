import leagueDataJson from "@/data/data.json";
import type { GameEntry, LeagueData } from "@/types/league";

export type SeasonChampion = {
  teamName: string;
  game: GameEntry;
};

const leagueData = leagueDataJson as LeagueData;

function toNumericScore(score: string | number | undefined): number | null {
  const parsed = Number(score);
  return Number.isFinite(parsed) ? parsed : null;
}

function getWinner(game: GameEntry): string | null {
  if (!game.homeTeam || !game.awayTeam) {
    return null;
  }

  const homeScore = toNumericScore(game.homeScore);
  const awayScore = toNumericScore(game.awayScore);

  if (homeScore !== null && awayScore !== null) {
    if (homeScore === awayScore) {
      return null;
    }

    return homeScore > awayScore ? game.homeTeam : game.awayTeam;
  }

  if (game.homeScore === "-" && game.awayScore === "Forfeit") {
    return game.homeTeam;
  }

  if (game.homeScore === "Forfeit" && game.awayScore === "-") {
    return game.awayTeam;
  }

  return null;
}

export function getSeasonChampion(seasonId: string): SeasonChampion | null {
  const season = leagueData.seasons[seasonId];
  if (!season) {
    return null;
  }

  const championshipGame = season.schedule.find((game) => /championship/i.test(game.week));
  if (!championshipGame) {
    return null;
  }

  const winner = getWinner(championshipGame);
  if (!winner) {
    return null;
  }

  return {
    teamName: winner,
    game: championshipGame,
  };
}
