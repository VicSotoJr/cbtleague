import type { BaseStats } from "@/types/league";

export interface AdminPlayerGameUpdate {
  teamName: string;
  playerName: string;
  opponent: string;
  gameLog: BaseStats;
}

export interface AdminScheduleScoreUpdate {
  week: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

export interface AdminManualOverallUpdate {
  playerName: string;
  overall: number;
}

export interface AdminStatsUpdatePayload {
  seasonId: string;
  gameNumber?: string;
  updates: AdminPlayerGameUpdate[];
  scheduleUpdate?: AdminScheduleScoreUpdate;
  manualOverallUpdates?: AdminManualOverallUpdate[];
}

export interface AdminStatsUpdateSuccess {
  ok: true;
  message: string;
  commitSha: string;
  path: string;
  updatedPlayers: number;
  updatedManualOveralls: number;
}

export interface AdminStatsUpdateError {
  ok: false;
  message: string;
  details?: string;
}

export type AdminStatsUpdateResponse = AdminStatsUpdateSuccess | AdminStatsUpdateError;
