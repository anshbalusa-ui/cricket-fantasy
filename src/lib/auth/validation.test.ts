import assert from "node:assert/strict";
import test from "node:test";
import { confirmationCredential, safeNextPath } from "./validation";

test("safeNextPath preserves a relative invite route and token query", () => {
  assert.equal(safeNextPath("/join?token=abc123"), "/join?token=abc123");
});

test("safeNextPath falls back for external, protocol-relative, and malformed paths", () => {
  for (const value of [
    "https://attacker.invalid",
    "//attacker.invalid",
    "/\\attacker.invalid",
    "not-a-path",
    "/path\nheader",
  ]) {
    assert.equal(safeNextPath(value), "/dashboard");
  }
});

test("safeNextPath supports a custom fallback for absent or invalid input", () => {
  assert.equal(safeNextPath(null, "/leagues"), "/leagues");
  assert.equal(safeNextPath("//attacker.invalid", "/leagues"), "/leagues");
});

test("email confirmation recognizes standard PKCE and direct token-hash protocols", () => {
  assert.equal(
    confirmationCredential("provider-issued-code", null)?.kind,
    "pkce",
  );
  assert.equal(
    confirmationCredential(null, "pkce_provider-issued-hash")?.kind,
    "token_hash",
  );
});

test("email confirmation rejects ambiguous credentials rather than selecting an identity", () => {
  assert.equal(
    confirmationCredential("one-account-code", "another-account-hash"),
    null,
  );
  assert.equal(confirmationCredential("", "valid-hash"), null);
  assert.equal(confirmationCredential("valid-code", ""), null);
});

test("email confirmation rejects absent, blank, control-containing and excessive credentials", () => {
  assert.equal(confirmationCredential(null, null), null);
  for (const invalid of [
    "",
    " ",
    "code\nheader",
    "code\u0000",
    "x".repeat(1025),
  ]) {
    assert.equal(confirmationCredential(invalid, null), null);
    assert.equal(confirmationCredential(null, invalid), null);
  }
});
