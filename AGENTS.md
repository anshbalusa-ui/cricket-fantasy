# Coding Agent Instructions — Cricket Fantasy

You are working in `anshbalusa-ui/cricket-fantasy`, a public GitHub repository for a free, season-long, draft-based fantasy cricket product. Treat this repository as the source of truth and inspect existing code **before** editing. Follow the current milestone and acceptance criteria from the user's task.

## Product and scope
- Product goal: the social private-league fantasy experience of traditional fantasy football, designed originally for cricket. MLC first; IPL and other T20 competitions later.
- First MVP: 6 managers per private league, 10 players drafted per manager (8 starter slots, 2 bench), exclusive ownership **within each league**, snake draft, historical replay scoring, head-to-head rounds, standings and playoffs.
- This is free-to-play only. Do not implement real-money betting, contests, entry fees, or prizes.
- Use an original aesthetic. The Sleeper product is an experience reference, **not** an asset source. Do not copy its UI, brand, text, icons or graphics.
- Existing `/demo` and `src/lib/demo/fixtures.ts` are **fictional** demonstrations. Do not present them as real cricket data or real multiplayer.

## Read first
1. `README.md`
2. `docs/PRODUCT.md`
3. `docs/ROADMAP.md`
4. `docs/ARCHITECTURE.md`
5. `docs/DATA_MODEL.md`
6. `docs/GAME_RULES.md`
7. `docs/UX.md`, `docs/DECISIONS.md`, `docs/DATA_SOURCES.md`
8. Existing components, `src/lib/fantasy/`, tests, and relevant GitHub issues.

Docs describe intent, not necessarily implemented behavior. Do not claim a feature works unless it actually works and has been checked.

## Technical priorities
- Preserve the Next.js App Router / TypeScript foundation and mobile-responsive dark UI unless a change is required.
- Domain logic belongs in tested TypeScript modules; keep provider ingestion separate from fantasy scoring and user league state.
- Intended backend is Supabase Auth + Postgres, with Vercel as a future deployment target. No existing Supabase project or live-score provider should be assumed.
- For Supabase: consult current official docs; enable and test row-level security on every table exposed to the Data API, enforce commissioner/member boundaries, validate on the server, and use transactions/unique constraints for concurrent joins and draft picks.
- Never put service-role keys, secrets, or privileged feed tokens in browser code, public env vars, git history or client-accessible API responses.
- Competition, season, real-world player, real match, fantasy league, membership, lineup, draft and fantasy-round entities must be separated. Use stable IDs, not player names as identity keys.
- Historical Cricsheet data requires source attribution and license verification; it is not a real-time data source.
- Use explicit score-rule versions. Keep imports idempotent and scoring auditable. Do not silently alter the experimental scoring policy in `docs/GAME_RULES.md`.
- Support legitimate loading, failure, empty, auth and authorization states. No inert buttons that pretend to work.

## Implementation workflow
1. Inspect the repository and existing GitHub issues; briefly identify current status and the requested milestone.
2. Implement actual end-to-end features, not another plan or superficial mockup.
3. Prefer incremental commits on a dedicated branch and a reviewable PR; do not force-push or rewrite published history.
4. Verify locally: `npm run typecheck`, `npm test`, `npm run build` (and relevant database/integration/e2e tests when added).
5. Update docs and issue checkboxes **only for verified functionality**. If blocked by missing external account credentials, do all independent work and document concrete setup steps; do not invent success.
6. Final delivery: changed files, tests and exact results, branch/PR/commit links, verified working behaviors, known limits, and user-only actions needed next.

## Feature-specific quality bar
- A private league must only be visible to authorized users.
- Commissioner-specific writes must be restricted server-side.
- Joining a full league must fail atomically; simultaneous joins must not exceed league capacity.
- Fantasy player ownership is exclusive per fantasy league, not globally.
- Demo-only behavior must be labeled clearly.
- Future tournament support should be modeled cleanly, not force-completed early.
