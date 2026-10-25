# Roadmap

Keep milestones independently demonstrable. An unchecked box is **not implemented**.

## M0 — Foundation and product decisions
- [x] Clear product direction: free, season-long private leagues with original branding
- [x] MLC first, extensible tournament model
- [x] Initial draft rules and explainable scoring specification
- [x] Catalog, league, draft, matchup and ingestion architectural plan
- [x] Responsive concept homepage and fictional-data interactive draft/scoring prototype
- [x] Pure TypeScript score engine and snake draft unit tests, automated build workflow
- [ ] Validate fantasy round boundaries on the real 2026 fixture list — #3
- [ ] Interview prospective commissioners/managers

## M1 — Web + identity + league creation — #1
- [x] Supabase migrations, typed clients and server-side cookie session management
- [x] Auth, user profiles and league/team persistence
- [x] Create league, invite link, join/leave, six-person capacity
- [x] Authorization/RLS tests on all private tables and concurrent final-seat joins
- [x] Dashboard, My Leagues, create/join, private overview/lobby and account screens
- [x] Preview-origin confirmation handling, existing-account profile backfill, and explicit Node 22.x/Vercel build configuration
- [ ] Connect a hosted Supabase project and configure production email delivery

**Acceptance:** 6 distinct users can join one private league; uninvited users cannot view it.

**Verified locally:** seven email-confirmed Supabase Auth accounts; six joined, seventh rejected; nonmember private reads denied. Browser flows ran against real native Auth/PostgREST/Postgres services. Hosted Supabase and Vercel are not provisioned. See README for setup and verification details.

**Infrastructure gate:** Supabase and Vercel CLIs/dashboards are unauthenticated. Organization/workspace choice, free-tier eligibility, hosted migrations/advisors, SMTP, actual environment values and a READY preview cannot be verified until normal provider access is authorized. No unrelated project or paid resource has been touched. Local follow-up passed 16 unit tests, four DB scenarios, builds, audit and security advisors; actual Auth/browser smoke proved the two deployment compatibility fixes.

## M2 — Draft night — #2
- [ ] Normalized MLC player pool with vetted roles/identifiers
- [ ] Server-authoritative snake order, room state, reconnect, draft clock
- [ ] Atomic pick action and database unique ownership
- [ ] Persistent rosters and slot assignment

**Acceptance:** 6 users complete a 60-pick draft; concurrent picks cannot duplicate a player and reconnections preserve state.

## M3 — Historical scoring and matchups — #4, #5
- [ ] Cricsheet import adapter with attribution and fixture mapping
- [ ] Reliable stat derivation and scoring audit ledger
- [ ] Historical 2026 season replay with correction-safe imports
- [ ] Fantasy rounds and averaging policy, lineup locks
- [ ] Head-to-head matchups, standings, playoff bracket

**Acceptance:** A replay is deterministic, key matches can be manually audited, and second replay creates no duplicates.

## M4 — Alpha — #6
- [ ] Mobile UX, accessibility and error/empty-state polish
- [ ] Performance, monitoring, security and privacy review
- [ ] Invite at least five genuine groups to test
- [ ] Resolve feedback on fairness, drafting and rules

**Acceptance:** Real groups can finish a season replay without admin intervention.

## M5 — Real season readiness (2027 target, schedule-dependent) — #7
- [ ] Licensed timely data provider and production SLA
- [ ] Current-season player/schedule update plan
- [ ] Clear provisional/live/final score status
- [ ] Data correction workflow, monitored live ingest
- [ ] Production launch checklist and support channel

## Tooling — #8
- [x] Commit npm lockfile; CI uses npm ci
- [x] Local desktop/mobile browser smoke with actual authentication and database
- [x] PostgreSQL RLS/concurrency test job in CI configuration (local command verified)
- [ ] Live hosted preview

## Expansion, only after MLC alpha
- [ ] IPL adapter and league configuration
- [ ] Trades/waivers
- [ ] League chat and notifications
- [ ] More competitions and customizable scoring

## Engineering definition of done

Feature passes types/tests; auth and ownership enforced server-side; scoring traceable; mobile tested; errors and loading/empty states present; docs updated; no secrets or unlicensed assets committed.
