import assert from "node:assert/strict";
import test from "node:test";
import {
  LEAGUE_NAME_MAX_LENGTH,
  TEAM_NAME_MAX_LENGTH,
  validateInvitationToken,
  validateLeagueName,
  validateTeamName,
} from "./validation";

test("league and team names are trimmed and internal whitespace normalized", () => {
  assert.deepEqual(validateLeagueName("  Friends   League "), { value: "Friends League" });
  assert.deepEqual(validateTeamName(" The   Yorkers "), { value: "The Yorkers" });
});

test("league and team names enforce required and maximum length constraints", () => {
  assert.deepEqual(validateLeagueName("  "), { error: "League name is required." });
  assert.deepEqual(validateTeamName(null), { error: "Team name is required." });
  assert.equal("error" in validateLeagueName("x".repeat(LEAGUE_NAME_MAX_LENGTH + 1)), true);
  assert.equal("error" in validateTeamName("x".repeat(TEAM_NAME_MAX_LENGTH + 1)), true);
  assert.deepEqual(validateLeagueName("x".repeat(LEAGUE_NAME_MAX_LENGTH)), { value: "x".repeat(LEAGUE_NAME_MAX_LENGTH) });
});

test("names reject markup and control characters", () => {
  assert.equal("error" in validateLeagueName("<script>"), true);
  assert.equal("error" in validateTeamName("Yorkers\nUnited"), true);
});

test("invitation tokens must be exactly 64 lowercase hexadecimal characters", () => {
  const token = "a1".repeat(32);
  assert.deepEqual(validateInvitationToken(token), { value: token });
  for (const invalid of ["", "A".repeat(64), "a".repeat(63), "a".repeat(65), "z".repeat(64), null]) {
    assert.deepEqual(validateInvitationToken(invalid), { error: "Enter a valid invitation link." });
  }
});
