import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const dataPath = path.join(root, "src/data/data.json");
const schedulesPath = path.join(root, "src/data/schedules.json");
const seasonPaths = {
  "1": path.join(root, "src/data/seasons/teams.json"),
  "2": path.join(root, "src/data/seasons/teams_season2.json"),
  "3": path.join(root, "src/data/seasons/teams_season3.json"),
};

const explicitWeekLabels = {
  "1": {
    "2023-05-09": "Playoffs - May 9, 2023",
    "2023-05-12": "Playoffs - May 12, 2023",
    "2023-05-16": "Championship - May 16, 2023",
  },
  "2": {
    "2025-05-06": "Rd 1 Playoffs - May 6, 2025",
    "2025-05-13": "Rd 2 Playoffs - May 13, 2025",
    "2025-05-20": "Championship - May 20, 2025",
    "2025-05-27": "All-Star Weekend - May 27, 2025",
  },
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function getIsoDateLabel(value) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return new Date(parsed).toISOString().slice(0, 10);
}

function isPlayoffWeek(label) {
  return /playoff|championship/i.test(label ?? "");
}

function isSpecialWeek(label) {
  return /allstar|all-star/i.test(label ?? "");
}

function normalizeSchedule(seasonId, schedule) {
  const dateLabels = explicitWeekLabels[seasonId] ?? {};

  return schedule.map((game) => {
    const isoDate = getIsoDateLabel(game.date);
    const explicitLabel = isoDate ? dateLabels[isoDate] : null;

    if (explicitLabel) {
      return {
        ...game,
        week: explicitLabel,
        isPlayoff: isPlayoffWeek(explicitLabel),
      };
    }

    return {
      ...game,
      isPlayoff: isPlayoffWeek(game.week),
    };
  });
}

function getGameResult(game) {
  const homeScore = Number(game.homeScore);
  const awayScore = Number(game.awayScore);

  if (Number.isFinite(homeScore) && Number.isFinite(awayScore)) {
    if (homeScore === awayScore) {
      return null;
    }

    return homeScore > awayScore ? "home" : "away";
  }

  if (game.homeScore === "Forfeit" && game.awayScore === "-") {
    return "away";
  }

  if (game.awayScore === "Forfeit" && game.homeScore === "-") {
    return "home";
  }

  return null;
}

function tallyRegularSeasonRecords(teams, schedule) {
  const records = Object.fromEntries(
    teams.map((team) => [
      team.Team,
      {
        wins: 0,
        loss: 0,
        gamesPlayed: 0,
      },
    ])
  );

  for (const game of schedule) {
    if (game.isBye || game.isPlayoff || isSpecialWeek(game.week)) {
      continue;
    }

    if (!game.homeTeam || !game.awayTeam || !records[game.homeTeam] || !records[game.awayTeam]) {
      continue;
    }

    const result = getGameResult(game);
    if (!result) {
      continue;
    }

    records[game.homeTeam].gamesPlayed += 1;
    records[game.awayTeam].gamesPlayed += 1;

    if (result === "home") {
      records[game.homeTeam].wins += 1;
      records[game.awayTeam].loss += 1;
    } else {
      records[game.awayTeam].wins += 1;
      records[game.homeTeam].loss += 1;
    }
  }

  return records;
}

function applyTeamRecords(teams, records) {
  return teams.map((team) => ({
    ...team,
    wins: records[team.Team]?.wins ?? team.wins,
    loss: records[team.Team]?.loss ?? team.loss,
    gamesPlayed: records[team.Team]?.gamesPlayed ?? team.gamesPlayed,
  }));
}

const data = readJson(dataPath);
const schedules = readJson(schedulesPath);

for (const seasonId of Object.keys(seasonPaths)) {
  const normalizedSchedule = normalizeSchedule(seasonId, schedules[seasonId] ?? []);
  const seasonTeams = data.seasons[seasonId]?.teams ?? [];
  const records = tallyRegularSeasonRecords(seasonTeams, normalizedSchedule);

  schedules[seasonId] = normalizedSchedule;
  data.seasons[seasonId].schedule = normalizedSchedule;
  data.seasons[seasonId].teams = applyTeamRecords(seasonTeams, records);

  const seasonTeamsFile = readJson(seasonPaths[seasonId]);
  writeJson(seasonPaths[seasonId], applyTeamRecords(seasonTeamsFile, records));
}

writeJson(schedulesPath, schedules);
writeJson(dataPath, data);

for (const seasonId of Object.keys(seasonPaths)) {
  console.log(`Season ${seasonId}`);
  for (const team of data.seasons[seasonId].teams) {
    console.log(`  ${team.Team}: ${team.wins}-${team.loss} (${team.gamesPlayed})`);
  }
}
