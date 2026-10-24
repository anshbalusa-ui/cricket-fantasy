# Roadmap

Keep milestones independently demonstrable. An unchecked box is **not implemented**.

## M0 — Foundation and product decisions
- [x] Clear product direction: free, season-long private leagues, Sleeper-inspired, original branding
- [x] MLC first, extensible tournament model
- [x] Initial draft rules and explainable scoring specification
- [x] Catalog, league, draft, matchup and ingestion architectural plan
- [ ] Validate fantasy round boundaries on the real 2026 fixture list
- [ ] Interview prospective commissioners/managers

## M1 — Web + identity + league creation
- [ ] Responsive shell and deployment
- [ ] Supabase project and local migrations
- [ ] Auth, user profiles and session management
- [ ] Create league, invite link, join/leave, six-person capacity
- [ ] Authorization/RLS tests on all private tables

**Acceptance:** 6 distinct users can join one private league; uninvited users cannot view it.

## M2 — Draft night
- [ ] Normalized MLC player pool with vetted roles/identifiers
- [ ] Snake order, room state, reconnect, draft clock, autodraft policy
- [ ] Atomic pick action and database unique ownership
- [ ] Rosters and slot assignment

**Acceptance:** 6 users complete a 60-pick draft; concurrent picks cannot duplicate a player and reconnections preserve the same state.

## M3 — Historical scoring and matchups
- [ ] Cricsheet import adapter with attribution and fixture mapping
- [ ] Reliable stat derivation and scoring audit ledger
- [ ] Historical 2026 season replay with correction-safe imports
- [ ] Fantasy rounds and averaging policy, lineup locks
- [ ] Head-to-head matchups, standings, playoff bracket

**Acceptance:** A replay is deterministic, key matches can be manually audited, and second replay creates no duplicates.

## M4 — Alpha
- [ ] Original visual identity and mobile UX pass
- [ ] Accessibility / keyboard / screen-reader tests
- [ ] Performance, monitoring, security and privacy review
- [ ] Invite at least five genuine groups to test
- [ ] Resolve feedback on fairness, drafting and rules

**Acceptance:** Real groups can finish a season replay without admin intervention.

## M5 — Real season readiness (2027 target, schedule-dependent)
- [ ] Licensed timely data provider and production SLA
- [ ] Current-season player/schedule update plan
- [ ] Clear provisional/live/final score status
- [ ] Data correction workflow, monitored live ingest
- [ ] Production launch checklist and support channel

## Expansion, only after MLC alpha
- [ ] IPL adapter and league configuration
- [ ] Trades/waivers
- [ ] League chat and notifications
- [ ] More competitions and customizable scoring

## Engineering definition of done

Feature passes types/tests; auth and ownership enforced server-side; scoring traceable; mobile tested; errors and loading/empty states present; docs updated; no secrets or unlicensed assets committed.
