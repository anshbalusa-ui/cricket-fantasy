import assert from "node:assert/strict";
import test from "node:test";
import { getPreviewSiteOrigin } from "./env";

test("preview auth origin comes only from the generated Vercel deployment URL", () => {
  assert.equal(getPreviewSiteOrigin("preview", "cricket-git-feature-team.vercel.app"), "https://cricket-git-feature-team.vercel.app");
});

test("preview auth origin rejects request-like and non-preview hosts", () => {
  for (const value of [
    "cricket.example.com",
    "vercel.app",
    "cricket.evilvercel.app",
    "cricket.vercel.app.evil.test",
    "cricket.vercel.app/path",
    "https://cricket.vercel.app",
    "cricket.vercel.app@evil.test",
  ]) {
    assert.equal(getPreviewSiteOrigin("preview", value), null);
  }
  assert.equal(getPreviewSiteOrigin("production", "cricket.vercel.app"), null);
});
