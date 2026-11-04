import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildRoundRobin, groupHistoricalRounds } from "./season";

describe("historical schedule invariants", () => {
  it("pairs each of six teams with every other exactly once across five rounds", () => {
    const ids = ["a", "b", "c", "d", "e", "f"];
    const games = buildRoundRobin(ids);
    assert.equal(games.length, 15);
    assert.deepEqual(
      [...new Set(games.map((game) => game.round))],
      [1, 2, 3, 4, 5],
    );
    assert.ok(games.every((game) => game.homeTeamId !== game.awayTeamId));
    const pairs = games.map(({ homeTeamId, awayTeamId }) =>
      [homeTeamId, awayTeamId].sort().join(":"),
    );
    assert.equal(new Set(pairs).size, 15);
    for (let round = 1; round <= 5; round++)
      assert.equal(games.filter((game) => game.round === round).length, 3);
    assert.throws(
      () => buildRoundRobin(["a", "a", "c", "d", "e", "f"]),
      RangeError,
    );
  });
  it("makes seven chronological contiguous groups without splitting same-day fixtures", () => {
    const matches = Array.from({ length: 9 }, (_, day) => ({
      id: `m${day}`,
      date: `2026-01-${String(day + 1).padStart(2, "0")}`,
    }));
    matches.splice(1, 0, { id: "same-day", date: "2026-01-02" });
    const rounds = groupHistoricalRounds(matches);
    assert.equal(rounds.length, 7);
    assert.deepEqual(
      rounds.map((round) => round.number),
      [1, 2, 3, 4, 5, 6, 7],
    );
    assert.deepEqual(
      rounds.map((round) => round.stage),
      [
        "regular",
        "regular",
        "regular",
        "regular",
        "regular",
        "semifinal",
        "final",
      ],
    );
    const ids = rounds.flatMap((round) => round.matchIds);
    assert.equal(new Set(ids).size, matches.length);
    assert.deepEqual(new Set(ids), new Set(matches.map((match) => match.id)));
    for (const round of rounds) {
      assert.ok(round.matchIds.length > 0);
      assert.ok(
        round.matchIds.every(
          (id) =>
            matches.find((match) => match.id === id)!.date >= round.startsOn &&
            matches.find((match) => match.id === id)!.date <= round.endsOn,
        ),
      );
    }
    const allAtDate = rounds.filter(
      (round) =>
        round.matchIds.includes("m1") || round.matchIds.includes("same-day"),
    );
    assert.equal(allAtDate.length, 1);
  });
  it("refuses fewer than seven real dates and duplicate match identities", () => {
    assert.throws(
      () =>
        groupHistoricalRounds(
          Array.from({ length: 7 }, (_, day) => ({
            id: `m${day}`,
            date: "2026-01-01",
          })),
        ),
      RangeError,
    );
    assert.throws(
      () =>
        groupHistoricalRounds([
          { id: "same", date: "2026-01-01" },
          { id: "same", date: "2026-01-02" },
        ]),
      RangeError,
    );
  });
});
