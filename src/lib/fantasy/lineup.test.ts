import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canCompleteRoster, LINEUP_SLOTS, validateLineup } from "./lineup";
import type { PlayerRole } from "./types";

const roster: { id: string; role: PlayerRole }[] = [
  { id: "wk", role: "WK" },
  { id: "bat1", role: "BAT" },
  { id: "bat2", role: "BAT" },
  { id: "bowl1", role: "BOWL" },
  { id: "bowl2", role: "BOWL" },
  { id: "all1", role: "ALL" },
  { id: "all2", role: "ALL" },
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `flex${i}`,
    role: (["BAT", "BOWL", "ALL", "WK"] as PlayerRole[])[i % 4],
  })),
];
const complete = () =>
  LINEUP_SLOTS.map((slot, index) => ({
    slotId: slot.id,
    playerId: roster[index].id,
  }));

describe("lineup ownership and feasibility", () => {
  it("accepts a complete eligible XI and rejects duplicate player assignment", () => {
    assert.equal(validateLineup(complete(), roster).valid, true);
    const duplicate = complete();
    duplicate[10].playerId = duplicate[9].playerId;
    const result = validateLineup(duplicate, roster);
    assert.equal(result.valid, false);
    assert.ok(
      result.errors.some((error) => error.includes("Duplicate lineup player")),
    );
  });
  it("rejects wrong-role and unowned starters even when all slots are filled", () => {
    const wrongRole = complete();
    wrongRole[0].playerId = "bat1";
    assert.equal(validateLineup(wrongRole, roster).valid, false);
    const unowned = complete();
    unowned[10].playerId = "not-owned";
    assert.equal(validateLineup(unowned, roster).valid, false);
  });
  it("only permits completion when remaining picks can cover every typed minimum and squad size", () => {
    assert.equal(
      canCompleteRoster(
        ["WK", "BAT", "BOWL", "ALL"],
        ["WK", "BAT", "BOWL", "ALL", ...Array<PlayerRole>(7).fill("BAT")],
      ),
      true,
    );
    assert.equal(
      canCompleteRoster(
        ["WK", "BAT", "BOWL", "ALL"],
        [...Array<PlayerRole>(11).fill("BAT")],
      ),
      false,
    );
    assert.equal(
      canCompleteRoster(
        ["WK", "BAT", "BOWL", "ALL"],
        ["WK", "BAT", "BOWL", "ALL"],
        15,
      ),
      false,
    );
    assert.equal(
      canCompleteRoster(
        [...Array<PlayerRole>(14).fill("BAT")],
        ["WK", "BOWL", "BOWL", "ALL", "ALL"],
      ),
      false,
    );
  });
});
