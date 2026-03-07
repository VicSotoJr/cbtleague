export interface BaseStats {
    Points: number;
    FieldGoalsMade: number;
    FieldGoalAttempts: number;
    ThreesMade: number;
    ThreesAttempts: number;
    FreeThrowsMade: number;
    FreeThrowsAttempts: number;
    Rebounds: number;
    Offrebounds: number;
    Defrebounds: number;
    Assists: number;
    Blocks: number;
    Steals: number;
    Turnovers: number;
    PersonalFouls: number;
}

export interface PlayerStat extends BaseStats {
    game_number: string;
    opponent: string;
}

export interface Player {
    name: string;
    number: number | string;
    GamesPlayed: number;
    PlayerHead: string;
    stats: PlayerStat[];
}

export interface Team {
    Team: string;
    wins: number;
    loss: number;
    gamesPlayed: number;
    roster: Player[];
}

export interface GameEntry {
    week: string;
    homeTeam?: string;
    homeScore?: string | number;
    awayTeam?: string;
    awayScore?: string | number;
    date: string;
    time?: string;
    isPlayoff?: boolean;
    byeTeam?: string;
    isBye?: boolean;
}

export type SeasonData = Team[];
export type SchedulesData = Record<string, GameEntry[]>;
