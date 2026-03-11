import {
  getScheduleSections,
  getSeasonSchedule,
  getSeasonTeams,
  type ScheduleSection,
  type SummaryTeam,
} from "@/lib/league-summary";

export type RecordLine = {
  wins: number;
  loss: number;
  gamesPlayed: number;
};

export type TeamRecordAudit = {
  teamName: string;
  stored: RecordLine;
  regularSeason: RecordLine;
  playoffs: RecordLine;
  totalFromSchedule: RecordLine;
  includesPlayoffsInStoredRecord: boolean;
  hasMismatch: boolean;
  notes: string[];
};

export type SeasonRecordAudit = {
  seasonId: string;
  hasFlags: boolean;
  seasonNotes: string[];
  teams: Record<string, TeamRecordAudit>;
};

function emptyRecord(): RecordLine {
  return { wins: 0, loss: 0, gamesPlayed: 0 };
}

function toNumericScore(score: string | number | undefined): number | null {
  const parsed = Number(score);
  return Number.isFinite(parsed) ? parsed : null;
}

function sameRecord(a: RecordLine, b: RecordLine): boolean {
  return a.wins === b.wins && a.loss === b.loss && a.gamesPlayed === b.gamesPlayed;
}

function addGameResult(record: RecordLine, teamScore: number, opponentScore: number) {
  record.gamesPlayed += 1;

  if (teamScore > opponentScore) {
    record.wins += 1;
  } else if (teamScore < opponentScore) {
    record.loss += 1;
  }
}

function createInitialAudit(teams: SummaryTeam[]): Record<string, TeamRecordAudit> {
  return Object.fromEntries(
    teams.map((team) => [
      team.Team,
      {
        teamName: team.Team,
        stored: {
          wins: team.wins,
          loss: team.loss,
          gamesPlayed: team.gamesPlayed,
        },
        regularSeason: emptyRecord(),
        playoffs: emptyRecord(),
        totalFromSchedule: emptyRecord(),
        includesPlayoffsInStoredRecord: false,
        hasMismatch: false,
        notes: [],
      },
    ])
  );
}

function applySectionResults(
  teams: Record<string, TeamRecordAudit>,
  sections: ScheduleSection[]
) {
  for (const section of sections) {
    if (section.id === "special") {
      continue;
    }

    for (const week of section.weeks) {
      for (const game of week.games) {
        if (game.isBye) {
          continue;
        }

        const homeTeam = game.homeTeam;
        const awayTeam = game.awayTeam;
        if (!homeTeam || !awayTeam || !teams[homeTeam] || !teams[awayTeam]) {
          continue;
        }

        const homeScore = toNumericScore(game.homeScore);
        const awayScore = toNumericScore(game.awayScore);
        if (homeScore === null || awayScore === null) {
          continue;
        }

        const homeTarget = section.id === "playoffs" ? teams[homeTeam].playoffs : teams[homeTeam].regularSeason;
        const awayTarget = section.id === "playoffs" ? teams[awayTeam].playoffs : teams[awayTeam].regularSeason;

        addGameResult(homeTarget, homeScore, awayScore);
        addGameResult(awayTarget, awayScore, homeScore);
      }
    }
  }
}

function buildSeasonNotes(
  teams: Record<string, TeamRecordAudit>,
  sections: ScheduleSection[]
): string[] {
  const notes: string[] = [];
  const hasInferredPlayoffs = sections.some((section) => section.id === "playoffs" && section.inferred);
  const teamsIncludingPlayoffs = Object.values(teams).filter((team) => team.includesPlayoffsInStoredRecord);
  const mismatchedTeams = Object.values(teams).filter((team) => team.hasMismatch);

  if (teamsIncludingPlayoffs.length > 0) {
    notes.push("Stored standings include postseason results for at least part of this season.");
  }

  if (hasInferredPlayoffs) {
    notes.push("Playoff rounds are inferred from archived schedule dates because the original schedule did not label them explicitly.");
  }

  if (mismatchedTeams.length > 0) {
    notes.push("Some team records still disagree with the archived game-by-game schedule and need manual historical review.");
  }

  return notes;
}

export function getSeasonRecordAudit(seasonId: string): SeasonRecordAudit {
  const teams = getSeasonTeams(seasonId);
  const sections = getScheduleSections(getSeasonSchedule(seasonId)) as ScheduleSection[];
  const auditTeams = createInitialAudit(teams);

  applySectionResults(auditTeams, sections);

  for (const team of Object.values(auditTeams)) {
    team.totalFromSchedule = {
      wins: team.regularSeason.wins + team.playoffs.wins,
      loss: team.regularSeason.loss + team.playoffs.loss,
      gamesPlayed: team.regularSeason.gamesPlayed + team.playoffs.gamesPlayed,
    };

    const storedMatchesSchedule = sameRecord(team.stored, team.totalFromSchedule);
    const storedMatchesRegularPlusPlayoffs =
      storedMatchesSchedule && team.playoffs.gamesPlayed > 0 && !sameRecord(team.stored, team.regularSeason);

    team.includesPlayoffsInStoredRecord = storedMatchesRegularPlusPlayoffs;

    if (team.includesPlayoffsInStoredRecord) {
      team.notes.push(
        `Stored record includes playoffs. Regular season: ${team.regularSeason.wins}-${team.regularSeason.loss}; playoffs: ${team.playoffs.wins}-${team.playoffs.loss}.`
      );
    }

    if (!storedMatchesSchedule) {
      team.hasMismatch = true;
      team.notes.push(
        `Stored record is ${team.stored.wins}-${team.stored.loss}, but archived schedule totals to ${team.totalFromSchedule.wins}-${team.totalFromSchedule.loss}.`
      );
    }
  }

  const seasonNotes = buildSeasonNotes(auditTeams, sections);

  return {
    seasonId,
    hasFlags: seasonNotes.length > 0,
    seasonNotes,
    teams: auditTeams,
  };
}
