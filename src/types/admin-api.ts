import type { BaseStats } from "@/types/league";

export interface AdminStatsUpdatePayload {
  seasonId: string;
  teamName: string;
  playerName: string;
  opponent: string;
  gameNumber: string;
  gameLog: BaseStats;
}

export interface AdminStatsUpdateSuccess {
  ok: true;
  message: string;
  commitSha: string;
  path: string;
}

export interface AdminStatsUpdateError {
  ok: false;
  message: string;
  details?: string;
}

export type AdminStatsUpdateResponse = AdminStatsUpdateSuccess | AdminStatsUpdateError;
