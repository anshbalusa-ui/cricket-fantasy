import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { managerAtSnakePick, snakePickOrder } from "./draft";
import { scorePlayerMatch, scorePlayerRound, SCORING_VERSION } from "./scoring";
import type { PlayerMatchStats } from "./types";
import { ZERO_STATS } from "./types";

const stats = (overrides: Partial<PlayerMatchStats> = {}): PlayerMatchStats => ({
  ...ZERO_STATS,
  ...overrides,
});

describe("scoring v0.1", () => {
  it("counts runs, boundary bonus and the highest milestone only", () => {
    const result = scorePlayerMatch(stats({ runs: 104, fours: 8, sixes: 5, ballsFaced: 60 }), "BAT");
    assert.equal(result.runs, 104);
    assert.equal(result.boundaries, 18);
    assert.equal(result.battingMilestone, 20);
    assert.equal(result.total, 142);
    assert.equal(SCORING_VERSION, "mlc-v0.1");
  });
  it("credits bowler wickets, only the highest haul, maidens and fielding", () => {
    const result = scorePlayerMatch(stats({ wickets: 4, maidens: 1, catches: 2 }), "BOWL");
    assert.equal(result.total, 4 * 25 + 10 + 12 + 2 * 8);
  });
  it("only penalizes a duck when dismissed after facing a ball in eligible role", () => {
    assert.equal(scorePlayerMatch(stats({ dismissed: true, ballsFaced: 1 }), "BAT").total, -5);
    assert.equal(scorePlayerMatch(stats({ dismissed: true, ballsFaced: 0 }), "BAT").total, 0);
    assert.equal(scorePlayerMatch(stats({ dismissed: true, ballsFaced: 1 }), "BOWL").total, 0);
  });
  it("rejects malformed negative stats", () => {
    assert.throws(() => scorePlayerMatch(stats({ wickets: -1 }), "ALL"), RangeError);
  });
  it("averages real-match appearances instead of adding both match totals", () => {
    assert.equal(scorePlayerRound([{ matchId: "m1", fantasyPoints: 58 }, { matchId: "m2", fantasyPoints: 22 }]), 40);
    assert.equal(scorePlayerRound([]), 0);
    assert.throws(() => scorePlayerRound([{ matchId: "m1", fantasyPoints: 1 }, { matchId: "m1", fantasyPoints: 1 }]));
  });
});

describe("snake draft", () => {
  it("reverses every other round and wraps correctly", () => {
    assert.deepEqual(snakePickOrder(6, 3), [
      0, 1, 2, 3, 4, 5,
      5, 4, 3, 2, 1, 0,
      0, 1, 2, 3, 4, 5,
    ]);
    assert.equal(managerAtSnakePick(12, 6), 0);
  });
  it("rejects invalid inputs", () => {
    assert.throws(() => managerAtSnakePick(-1, 6), RangeError);
    assert.throws(() => managerAtSnakePick(0, 1), RangeError);
    assert.throws(() => snakePickOrder(6, 0), RangeError);
  });
});
