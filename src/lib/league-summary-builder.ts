import type { LeagueData } from "@/types/league";
import { buildLeagueSummary as buildLeagueSummaryRuntime } from "./league-summary-builder-runtime.mjs";

export function buildLeagueSummary(data: LeagueData) {
  return buildLeagueSummaryRuntime(data);
}
