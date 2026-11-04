import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeCricsheetMatch,
  type NormalizedCricsheetMatch,
} from "./cricsheet";

const names = ["bat", "non", "bowler", "fielder1", "fielder2"];
const match = (innings: unknown[]) => ({
  info: {
    dates: ["2026-06-01"],
    season: "2026",
    teams: ["A", "B"],
    venue: "Ground",
    balls_per_over: 6,
    players: { A: ["bat", "non"], B: ["bowler", "fielder1", "fielder2"] },
    registry: {
      people: Object.fromEntries(names.map((name) => [name, `id-${name}`])),
    },
  },
  innings,
});
const delivery = (
  over: number,
  batter = "bat",
  extra: Record<string, number> = {},
  runs = 0,
  wickets?: unknown[],
) => ({
  actual_delivery: `${over}.${Math.min(over + 1, 6)}`,
  batter,
  non_striker: batter === "bat" ? "non" : "bat",
  bowler: "bowler",
  runs: {
    batter: runs,
    extras: Object.values(extra).reduce((a, b) => a + b, 0),
    total: runs + Object.values(extra).reduce((a, b) => a + b, 0),
  },
  ...(Object.keys(extra).length ? { extras: extra } : {}),
  ...(wickets ? { wickets } : {}),
});
const over = (number: number, deliveries: unknown[]) => ({
  over: number,
  deliveries,
});
const byId = (result: NormalizedCricsheetMatch, id: string) =>
  result.players.find((entry) => entry.sourceId === id)!;

describe("Cricsheet normalization boundaries", () => {
  it("counts legal balls, batter runs and actual boundaries, while excluding super-over events", () => {
    const normal = over(0, [
      delivery(0, "bat", { wides: 1 }),
      delivery(0, "bat", { noballs: 1 }, 4),
      ...Array.from({ length: 4 }, () => delivery(0)),
    ]);
    const superOver = {
      team: "A",
      super_over: true,
      overs: [over(0, [delivery(0, "bat", {}, 6)])],
    };
    const result = normalizeCricsheetMatch(
      match([{ team: "A", overs: [normal] }, superOver]),
      "game-1",
    );
    const stats = byId(result, "id-bat").stats;
    assert.equal(stats.runs, 4);
    assert.equal(stats.fours, 1);
    assert.equal(stats.sixes, 0);
    assert.equal(stats.ballsFaced, 5);
    assert.equal(byId(result, "id-bowler").stats.maidens, 0);
    assert.equal(result.players.length, 5);
  });
  it("marks a dismissed non-striker, credits only bowler wickets, and warns rather than guessing multi-fielder runouts", () => {
    const deliveries = [
      delivery(0, "bat", {}, 1, [
        {
          kind: "run out",
          player_out: "non",
          fielders: [{ name: "fielder1" }, { name: "fielder2" }],
        },
      ]),
      ...Array.from({ length: 5 }, () => delivery(0)),
    ];
    const result = normalizeCricsheetMatch(
      match([{ team: "A", overs: [over(0, deliveries)] }]),
      "game-2",
    );
    assert.equal(byId(result, "id-non").stats.dismissed, true);
    assert.equal(byId(result, "id-bowler").stats.wickets, 0);
    assert.equal(byId(result, "id-fielder1").stats.assistedRunOuts, 1);
    assert.equal(byId(result, "id-fielder2").stats.assistedRunOuts, 1);
    assert.equal(byId(result, "id-fielder1").stats.directRunOuts, 0);
    assert.ok(
      result.warnings.some((warning) =>
        warning.includes("direct attribution ambiguous"),
      ),
    );
  });
  it("credits a full legal maiden, caught-and-bowled, and stumping to the actual participants", () => {
    const deliveries = [
      delivery(0, "bat", {}, 0, [
        { kind: "caught and bowled", player_out: "bat" },
      ]),
      delivery(0, "non", {}, 0, [
        {
          kind: "stumped",
          player_out: "non",
          fielders: [{ name: "fielder1" }],
        },
      ]),
      ...Array.from({ length: 4 }, () => delivery(0, "non")),
    ];
    const result = normalizeCricsheetMatch(
      match([{ team: "A", overs: [over(0, deliveries)] }]),
      "game-3",
    );
    assert.equal(byId(result, "id-bowler").stats.wickets, 2);
    assert.equal(byId(result, "id-bowler").stats.catches, 1);
    assert.equal(byId(result, "id-bowler").stats.maidens, 1);
    assert.equal(byId(result, "id-fielder1").stats.stumpings, 1);
  });
  it("does not award a completed maiden to the final bowler in a shared over", () => {
    const deliveries = Array.from({ length: 6 }, (_, index) => ({
      ...delivery(0),
      bowler: index === 5 ? "fielder1" : "bowler",
    }));
    const result = normalizeCricsheetMatch(
      match([{ team: "A", overs: [over(0, deliveries)] }]),
      "shared-over",
    );
    assert.equal(byId(result, "id-bowler").stats.maidens, 0);
    assert.equal(byId(result, "id-fielder1").stats.maidens, 0);
  });
  it("distinguishes a tactical retirement dismissal from retirement through injury", () => {
    const result = normalizeCricsheetMatch(
      match([
        {
          team: "A",
          overs: [
            over(0, [
              delivery(0, "bat", {}, 0, [
                { kind: "retired out", player_out: "bat" },
              ]),
              delivery(0, "non", {}, 0, [
                { kind: "retired hurt", player_out: "non" },
              ]),
            ]),
          ],
        },
      ]),
      "retirement",
    );
    assert.equal(byId(result, "id-bat").stats.dismissed, true);
    assert.equal(byId(result, "id-non").stats.dismissed, false);
    assert.equal(byId(result, "id-bowler").stats.wickets, 0);
  });
  it("rejects missing stable identities and unsupported dismissal kinds", () => {
    const base = match([
      {
        team: "A",
        overs: [
          over(0, [
            delivery(0, "bat", {}, 0, [
              { kind: "unknown dismissal", player_out: "bat" },
            ]),
          ]),
        ],
      },
    ]);
    assert.throws(
      () => normalizeCricsheetMatch(base, "game-4"),
      /Unsupported Cricsheet dismissal/,
    );
    const broken = match([]);
    delete (broken.info.registry.people as Record<string, string>)["bat"];
    assert.throws(
      () => normalizeCricsheetMatch(broken, "game-5"),
      /Missing stable registry ID/,
    );
  });
});
