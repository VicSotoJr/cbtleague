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

export interface AdminScheduleEntryUpdate {
  week: string;
  date: string;
  time?: string;
  homeTeam?: string;
  homeScore?: string | number;
  awayTeam?: string;
  awayScore?: string | number;
  isPlayoff?: boolean;
  isBye?: boolean;
  byeTeam?: string;
}

export interface AdminManualOverallUpdate {
  playerName: string;
  overall: number;
}

export interface AdminPlayerProfileUpdate {
  teamName: string;
  playerName: string;
  number: number | string;
  playerHead: string;
}

export interface AdminHeadshotUpload {
  playerName: string;
  fileName: string;
  contentBase64: string;
}

export interface AdminDeletedPlayer {
  teamName: string;
  playerName: string;
}

export interface AdminStatsUpdatePayload {
  seasonId: string;
  gameNumber?: string;
  updates: AdminPlayerGameUpdate[];
  scheduleUpdate?: AdminScheduleScoreUpdate;
  scheduleEntries?: AdminScheduleEntryUpdate[];
  manualOverallUpdates?: AdminManualOverallUpdate[];
  playerProfileUpdates?: AdminPlayerProfileUpdate[];
  headshotUploads?: AdminHeadshotUpload[];
  deletedPlayers?: AdminDeletedPlayer[];
}

export interface AdminStatsUpdateSuccess {
  ok: true;
  message: string;
  commitSha: string;
  path: string;
  updatedPlayers: number;
  updatedManualOveralls: number;
  updatedProfiles: number;
  uploadedHeadshots: number;
  updatedScheduleEntries: number;
  deletedPlayers: number;
}

export interface AdminStatsUpdateError {
  ok: false;
  message: string;
  details?: string;
}

export type AdminStatsUpdateResponse = AdminStatsUpdateSuccess | AdminStatsUpdateError;
