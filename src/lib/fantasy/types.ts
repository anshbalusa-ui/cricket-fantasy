/** Canonical normalized per-match stats, not raw provider events. */
export type PlayerRole = "BAT" | "BOWL" | "ALL" | "WK";

export interface PlayerMatchStats {
  runs: number;
  fours: number;
  sixes: number;
  ballsFaced: number;
  dismissed: boolean;
  wickets: number;
  maidens: number;
  catches: number;
  stumpings: number;
  directRunOuts: number;
  assistedRunOuts: number;
}

export interface MatchPointBreakdown {
  runs: number;
  boundaries: number;
  battingMilestone: number;
  duck: number;
  wickets: number;
  bowlingMilestone: number;
  maidens: number;
  fielding: number;
  total: number;
}

export type ScoredAppearance = {
  matchId: string;
  fantasyPoints: number;
};

export const ZERO_STATS: PlayerMatchStats = {
  runs: 0,
  fours: 0,
  sixes: 0,
  ballsFaced: 0,
  dismissed: false,
  wickets: 0,
  maidens: 0,
  catches: 0,
  stumpings: 0,
  directRunOuts: 0,
  assistedRunOuts: 0,
};
