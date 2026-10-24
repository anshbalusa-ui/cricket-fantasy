# Data model — planned, not yet migrated

All IDs should be UUIDs except explicit source-specific IDs. Model actual cricket competitions separately from each user's fantasy league.

## Cricket domain

- competitions(id, slug unique, name, format)
- seasons(id, competition_id, year, status, start_at, end_at)
- franchises(id, competition_id, name, canonical_slug)
- players(id, preferred_name, role, external_ids)
- season_player_teams(season_id, player_id, franchise_id, valid_from, valid_to)
- matches(id, season_id, home_franchise_id, away_franchise_id, starts_at, status, source_ref unique)
- player_match_stats(match_id, player_id, ...normalized stat fields, source_version)
- player_match_points(match_id, player_id, scoring_version, total_points, breakdown_json, updated_at)

## Fantasy domain

- profiles(id = auth.users.id, display_name, created_at)
- fantasy_leagues(id, season_id, name, commissioner_user_id, status, settings_version, invite_token_hash)
- league_memberships(id, league_id, user_id, fantasy_team_id, role, joined_at)
- fantasy_teams(id, league_id, name, manager_user_id)
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

## RLS policy intent

- Public read: approved competition, season, player and match metadata only.
- Private read: commissioner and members can read their league, league teams, rosters and standings.
- Limited writes: a member can propose their own lineup while unlocked; only commissioner can change settings/invitations; both must pass server validation.
- Draft and scoring tables: do **not** allow arbitrary client insert/update. Use authorized server operations with verified membership; keep source ingestion in a server-only environment.
- Profiles: users can read permitted public display names; only edit their own mutable profile fields.

## Implementation gate

Before adding migrations, create or connect a Supabase project, check current official docs and create/test a migration with database tooling. Run RLS and permissions tests (including unjoined users, cross-league reads and concurrent picks). A design file is not a secure database.
