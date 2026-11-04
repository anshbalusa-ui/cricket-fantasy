# Roadmap

Checked items are exercised functionality, not mockups. Current release is the **2026 historical season**, settings v2 (6 managers, 15 drafted, 11 starters, 4 bench), scoring `mlc-v0.1` unchanged.

## M0 — Foundation and rules — #3

- [x] Free private season-long product, original branding, separate cricket/fantasy entities
- [x] Actual 2026 fixture import and published seven-window map; no same-day split
- [x] Six complete role-eligible 15-player squads and 90-pick season exercised
- [x] Deterministic standings/playoff tiebreak behavior and explicit historical locking policy
- [ ] Full franchise-exposure, availability/variance and alternative-scoring fairness study
- [ ] Prospective commissioner/manager interviews and explicit competitive-rule signoff

The map and implementation are available; they are not proof of no strategic/schedule exploit. #3 retains the deeper fairness research gate. A future 2027 season is not assumed to have the same fixtures or balance.

## M1 — Identity and private leagues — #1

- [x] Genuine Auth/signup/confirmation/password sign-in/out, profiles and sessions
- [x] Self-service delivered-email recovery and new-password login, without admin reset
- [x] Private create/invite/join/leave/rename, six-seat atomic capacity and RLS
- [x] Invitation destination preserved across normal sign-in/confirmation
- [x] Existing Free Supabase and Hobby Vercel projects, scoped public variables and canonical/preview callbacks
- [x] Hosted 24-table RLS and actual anonymous API/RPC denial; fifteen exposed RPC identity/grant review
- [ ] Verified production SMTP sender/ordinary-recipient delivery
- [ ] Full hosted six-manager email/signup/private-league rehearsal with normal app sessions

Local acceptance used seven normally registered/confirmed real Auth accounts, not SQL-created confirmations. Hosted schema/CLI access does not prove the remaining email/session acceptance.

## M2 — Multiplayer draft — #2

- [x] Real normalized MLC pool and explicit fantasy-eligibility provenance
- [x] Server-authoritative 90-pick, 15-round snake order and deadline
- [x] Expected-pick compare-and-set, unique per-league ownership, global role feasibility
- [x] Saved room/rosters, reconnect snapshots, visible-room polling and actual clock expiry
- [x] Real search/role filters, board, pick history, player detail and roster composition
- [x] Persistent owned XIs with 11 starters/4 bench and opponent privacy until lock

**Verified:** two actual HTTP six-manager drafts reached 90 picks/15 each; competing same-turn requests admitted one and rejected one stale pick; another league could independently own the same real player. A genuine 15-second expiry saved a server auto-pick, observed across clients and retained on reload. Unattended-room progression remains member-triggered, not a hidden timer worker.

## M3 — Historical ingestion, scoring and title run — #4, #5

- [x] Cricsheet ODC-BY license/attribution, raw files, checksums and stable source mappings
- [x] Extras/dismissal/fielding/maiden normalization and meaningful edge fixtures
- [x] 34 real matches, 102 players, 754 appearance/breakdown rows, seven windows
- [x] Twelve player stat lines/manually calculated totals audited across two independent scorecards
- [x] Identical imports leave all normalized row counts/fingerprints unchanged
- [x] Server-locked XIs, average-per-appearance contributions and full-precision stored scores
- [x] Five-round round robin, regular standings, top-four bracket and persisted champion
- [x] Idempotent scored-round recalculation from frozen XIs, including fractional-score regression

**Verified:** the real HTTP season completed seven rounds, 15 regular matchups + two semifinals + one final and 396 XI contributions. Recalculation retained every score and the champion. Corrections retain advanced bracket identities; structural remaps require reviewed forward migrations, not invisible participant replacement.

## M4 — Consumer polish and genuine alpha — #6

- [x] Original cohesive desktop/mobile hub, auth, lobby, draft, roster, matchup, standings and player UI
- [x] Twelve real surfaces at 320/390/768/1440px, 48 overflow checks
- [x] WCAG-tagged axe scans, keyboard tab reveal, source-detail expansion and dense-role overlap correction
- [x] Loading/empty/error/permission/reconnect states; real password recovery
- [ ] Real assistive-technology usability study and broader device/browser coverage
- [ ] Production monitoring/privacy/age-policy review
- [ ] At least five independently organized groups complete a replay
- [ ] Resolve actual feedback on roles, availability, draft order and scoring fairness

## M5 — Timely/current-season readiness — #7

- [ ] Licensed provider, contractual redistribution rights, quotas and SLA
- [ ] Current fixture/player/role updates and verified match timestamps
- [ ] Real provisional/live/final transitions and monitored ingest/corrections
- [ ] Live lineup-lock policy, support/abuse operations and launch readiness

No live data, projections, salary/auction drafting, trades, waivers, chat, push notifications, native apps or other-tournament release is claimed implemented. Those are separate work, not inert current controls.

## Delivery/tooling — #8

- [x] Locked dependencies, Node 22, unit and isolated PostgreSQL CI jobs
- [x] Existing Git-linked Vercel project and automatic protected branch previews
- [x] Five source migrations applied to the same hosted Supabase project; version metadata aligned
- [x] Actual native Auth/PostgREST/PostgreSQL/Mailpit browser/API smoke
- [ ] Production mail and full hosted real-group acceptance above

No new cloud project, purchase, plan change or unrelated-project mutation is authorized by this roadmap. See README for the exact exercised verification and live deployment boundary.
