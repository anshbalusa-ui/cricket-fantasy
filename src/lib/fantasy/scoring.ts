import type { MatchPointBreakdown, PlayerMatchStats, PlayerRole, ScoredAppearance } from "./types";

/**
 * The initial scoring system is experimental; version it whenever rules change.
 * Runs already include runs from 4s and 6s. Boundaries add only their bonus.
 */
export const SCORING_VERSION = "mlc-v0.1";

function tier(value: number, thresholds: ReadonlyArray<readonly [number, number]>): number {
  for (const [minimum, bonus] of thresholds) {
    if (value >= minimum) return bonus;
  }
  return 0;
}

function validateStats(stats: PlayerMatchStats) {
  for (const [name, value] of Object.entries(stats)) {
    if (typeof value === "boolean") continue;
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError(`Invalid non-negative integer stat: ${name}`);
    }
  }
}

/** Score one normalized real-match player stat line. */
export function scorePlayerMatch(
  stats: PlayerMatchStats,
  role: PlayerRole
): MatchPointBreakdown {
  validateStats(stats);
  const runs = stats.runs;
  const boundaries = stats.fours + 2 * stats.sixes;
  const battingMilestone = tier(stats.runs, [[100, 20], [50, 10], [30, 5]]);
  const duck = stats.dismissed && stats.runs === 0 && stats.ballsFaced > 0 && role !== "BOWL" ? -5 : 0;
  const wickets = stats.wickets * 25;
  const bowlingMilestone = tier(stats.wickets, [[5, 20], [4, 10], [3, 5]]);
  const maidens = stats.maidens * 12;
  const fielding = stats.catches * 8 + stats.stumpings * 12 +
    stats.directRunOuts * 12 + stats.assistedRunOuts * 6;
  const total = runs + boundaries + battingMilestone + duck +
    wickets + bowlingMilestone + maidens + fielding;

  return { runs, boundaries, battingMilestone, duck, wickets, bowlingMilestone, maidens, fielding, total };
}

/**
 * A fantasy-round starter score is their mean score per real appearance.
 * No appearance = zero; duplicate match IDs are rejected to prevent double count.
 * Deliberately keep full precision for standings; round display may be rounded.
 */
export function scorePlayerRound(appearances: ReadonlyArray<ScoredAppearance>): number {
  if (appearances.length === 0) return 0;
  const matchIds = new Set<string>();
  let sum = 0;
  for (const appearance of appearances) {
    if (!appearance.matchId || matchIds.has(appearance.matchId)) {
      throw new Error("Duplicate or missing real match ID in round");
    }
    if (!Number.isFinite(appearance.fantasyPoints)) {
      throw new Error("Non-finite fantasy points");
    }
    matchIds.add(appearance.matchId);
    sum += appearance.fantasyPoints;
  }
  return sum / appearances.length;
}
