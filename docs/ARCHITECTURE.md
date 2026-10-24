# Technical architecture — M1 implemented, later modules planned

## Focus

Ship **one mobile-first web application**, not a microservice fleet. Separate cricket reality (competitions, fixtures, players, stats) from fantasy reality (leagues, draft, rosters, lineups, matchups).

## Intended stack

- Frontend: Next.js App Router + React + TypeScript, custom responsive CSS.
- Auth/database: Supabase Auth + Postgres with row-level security; M1 implemented and verified against local native services. No hosted project connected.
- Deployment: Vercel-ready Next.js build; no deployment connected or verified.
- Tests: deterministic domain/validation tests and PostgreSQL constraint/RLS/concurrency scenarios; real local auth/browser smoke. End-to-end draft-room tests belong to M2.
- Data: historical Cricsheet match records for replay; separately contracted/reviewed live provider when feasible.

## Logical modules

- **Catalog:** competition, season, franchise, player identity and fixtures.
- **Fantasy engine:** rules version, stat-to-points calculation, fantasy rounds and playoff results.
- **League:** commissioners, invitations, memberships, teams and roles.
- **Draft:** turn order, serialized picks, timer policy and reconnect snapshots.
- **Lineups:** position checks, lock timestamps and ownership validation.
- **Data ingestion:** canonical match IDs, normalized player identity, provider adapters and idempotent updates.
- **Read models:** roster, matchup, standings and draft-board queries.

### M1 implementation boundaries

- `src/lib/auth` owns auth validation/actions and session checks; `src/lib/supabase` owns configuration and the typed server-only user client.
- `src/proxy.ts` refreshes/validates claims and forwards refresh cookies/cache-control headers. Protected redirects preserve the original path/query. Server queries/actions independently validate the user with `getUser()` and database RLS remains authoritative.
- `src/lib/users`, `src/lib/competitions`, and `src/lib/leagues` hold persistent profile/catalogue/league reads and league RPC actions. The existing `src/lib/fantasy` remains the pure draft/scoring engine.
- All seven public tables have RLS. Catalogue reads require authentication. Profiles expose only the user's own/co-league display names. Invitations are commissioner-readable; raw secrets exist only in the creation response.
- League mutations use narrowly granted, fixed-search-path security-definer RPCs with explicit identity/permission checks. The server never uses a service-role key.
- Create atomically inserts the league, commissioner membership and team. Join/leave/invite mutations lock the league row. A join rechecks invitation state and expiry after locking and cannot exceed capacity.
- Tokens contain 256 random bits, are stored only as SHA-256 hashes, expire after seven days and rotate by revoking older links. UUIDs identify competitions, seasons, users, leagues, memberships and teams separately.
- Draft, ingestion, lineup and matchup modules below remain planned, not simulated.


## Import and scoring pipeline

1. Acquire historical match JSON from the permitted source with attribution.
2. Import source identifiers and team/player metadata into a normalized staging representation.
3. Map external player IDs into canonical internal player IDs; manually resolve uncertain collisions.
4. Derive a finalized **per-player, per-match stat line**. Verify wicket mode, catches, boundaries and maidens.
5. Calculate points using an explicitly versioned scoring policy.
6. Generate each fantasy team’s round score from locked starters and real match appearances.
7. Recalculate matchup results and standings deterministically.
8. Keep the raw source reference, ingest version/checksum, corrections log and calculation breakdown for audit.

The UI must never use a player-name string as an identity key. Source feeds can change names, aliases, capitalization and franchises over time.

## Important transactional boundaries

- Drafting must make pick number, on-clock team, time limit, valid role pool and undrafted ownership atomic inside a database transaction. Do not implement a client-only lock.
- An active-player ownership uniqueness constraint per fantasy league prevents duplicate drafting across two simultaneous requests.
- Joining enforces roster cap in the database transaction, not only UI.
- Locking lineups enforces published round lock time on the server, even if client clocks differ.
- Score imports/replays must be re-runnable with no duplicate points.

## Security

- Enable RLS on each exposed Supabase table; use membership checks, not just authenticated-role checks.
- Service-role credentials are server-only and must never appear in NEXT_PUBLIC variables, browser code or repo commits.
- League membership gates private reads; commissioner membership gates league mutations.
- Draft picks, roster changes and scoring mutations happen through verified server pathways with consistent authorization.
- Secrets come from hosting environment variables only.
- Supabase handles auth rate limits; production SMTP/rate-limit settings and further invitation/draft abuse controls require deployment/alpha review. Invitation secrets resist enumeration.
- No money, wagers or prizes.

## MVP deployment phases

1. Static but clear prototype with fictional/demo data and a tested pure scoring library.
2. Auth, DB migrations, RLS and real private league persistence.
3. Transactional draft + roster/lineup validation.
4. Historical import/replay + fantasy round scoring, matchups and standings.
5. Alpha testing and mobile QA; only then investigate a production live feed.

## Boundaries

Data-source rights, logo rights, live scores, and real-time sync are **not solved** by a good frontend. See DATA_SOURCES.md. The current repository does not claim any provider partnership or production integration.
