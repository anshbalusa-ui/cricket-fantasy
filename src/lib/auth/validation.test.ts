import assert from "node:assert/strict";
import test from "node:test";
import { safeNextPath } from "./validation";

test("safeNextPath preserves a relative invite route and token query", () => {
  assert.equal(safeNextPath("/join?token=abc123"), "/join?token=abc123");
});

test("safeNextPath falls back for external, protocol-relative, and malformed paths", () => {
  for (const value of ["https://attacker.invalid", "//attacker.invalid", "/\\attacker.invalid", "not-a-path", "/path\nheader"]) {
    assert.equal(safeNextPath(value), "/dashboard");
  }
});

test("safeNextPath supports a custom fallback for absent or invalid input", () => {
  assert.equal(safeNextPath(null, "/leagues"), "/leagues");
  assert.equal(safeNextPath("//attacker.invalid", "/leagues"), "/leagues");
});
