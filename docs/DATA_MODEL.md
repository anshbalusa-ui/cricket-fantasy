# Data model — M1 migrated, draft/scoring entities planned

All application entity IDs are UUIDs. Actual cricket competitions remain separate from each user's fantasy league. The authoritative M1 schema is `supabase/migrations/20261024000000_m1_private_leagues.sql`; `20261024000001_backfill_existing_profiles.sql` initializes missing profiles for pre-M1 Auth accounts without overwriting existing profiles. Typed interfaces track the schema in `src/lib/supabase/database.types.ts`.

## Cricket domain

`competitions` and `seasons` are implemented. Remaining cricket entities below are planned.

- competitions(id, slug unique, name, format)
- seasons(id, competition_id, year, name, status, start_at, end_at), unique (competition_id, year)
- franchises(id, competition_id, name, canonical_slug)
- players(id, preferred_name, role, external_ids)
- season_player_teams(season_id, player_id, franchise_id, valid_from, valid_to)
- matches(id, season_id, home_franchise_id, away_franchise_id, starts_at, status, source_ref unique)
- player_match_stats(match_id, player_id, ...normalized stat fields, source_version)
- player_match_points(match_id, player_id, scoring_version, total_points, breakdown_json, updated_at)

## Fantasy domain

Implemented M1:

- profiles(id = auth.users.id, display_name, created_at), initialized by Auth signup trigger or forward backfill for pre-M1 accounts
- fantasy_leagues(id, season_id, name, commissioner_user_id, capacity, status, settings_version, scoring_version, created_at)
- league_memberships(id, league_id, user_id, role, joined_at), unique (league_id, user_id), at most one commissioner
- fantasy_teams(id, league_id, name, manager_user_id, created_at), unique (league_id, manager_user_id), composite FK to that membership
- league_invitations(id, league_id, token_hash, created_by, expires_at, revoked_at, created_at), unique token hash

Create fixes capacity at six; the schema permits 2–20 for future validated settings. League status is `lobby`, `drafting`, `active`, or `completed`; only lobby membership/settings changes are enabled. Scoring version defaults to the existing `mlc-v0.1`; no scoring computation/persistence is implied.

Planned for M2 and later:
- drafts(id, league_id, status, started_at, current_pick, settings_json)
- draft_picks(id, draft_id, league_id, pick_number, player_id, fantasy_team_id, selected_at)
- roster_assignments(id, league_id, fantasy_team_id, player_id, acquired_at, released_at)
- fantasy_rounds(id, league_id, round_number, lock_at, status)
- fantasy_round_matches(round_id, match_id)
- lineups(id, team_id, round_id, submitted_at, locked_at)
- lineup_slots(lineup_id, slot_name, player_id)
- round_player_scores(round_id, fantasy_team_id, player_id, counted_appearances, score)
- fantasy_matchups(id, round_id, home_fantasy_team_id, away_fantasy_team_id, home_score, away_score, result)
- ingest_runs(id, provider, season_id, source_version, checksum, status, created_at)

## Database-level invariants

1. One real player may be actively owned by only one fantasy team **in the same league**. Use a partial unique index on (league_id, player_id) WHERE released_at IS NULL.
2. A draft has unique (draft_id, pick_number); no player appears twice in the same draft. Pick action is a serialized DB transaction.
3. One profile joins a league only once; one manager owns no more than one fantasy team per league.
4. Exactly one slot per lineup position; each chosen player is unique in that lineup, is on the fantasy roster and is eligible for the slot.
5. Only matches in the same cricket season as the league may be added to its fantasy rounds.
6. A specific real match is assigned to at most one round per fantasy league.
7. Unique (match_id, player_id, scoring_version) makes recomputation and audits deterministic.
8. Points always derive from recorded stats and an explicit rule version; never authoritative browser-calculated totals.

## Implemented RLS and mutation boundaries

- Authenticated users can read competition/season catalogue metadata; anonymous users have no table access.
- Members alone can read their league, memberships and teams. Nonmembers cannot preview a private league through an invitation.
- Profiles can be read by their owner and co-league members; users can update only their own `display_name` column. Auth identity is immutable.
- Only the commissioner can read invitation rows; raw invitation secrets are never stored. Only one unrevoked link is retained after generation.
- No direct client league/membership/team/invitation writes. Seven authenticated RPCs handle create/join/invite/revoke/rename-team/rename-league/leave, with authorization and league row locks.
- Commissioner departure is blocked; manager leave cascades their team. Deleting a commissioner Auth account is restricted while owned leagues exist. No account deletion UI or commissioner transfer is implemented.
- Lineup, draft, scoring, ownership and ingestion rules above remain planned; their migrations and policy tests must ship with those milestones.

## Implementation gate

M1 migrations and RLS/constraint/concurrency tests have run on PostgreSQL 17, and actual Auth/PostgREST/browser flows ran against a separate local database. For future migrations, consult current official docs and run the security tests before claiming readiness. A design file alone is not a secure database. Hosted setup remains an explicit deployment prerequisite.
