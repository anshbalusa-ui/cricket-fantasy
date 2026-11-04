# Data model — playable historical leagues

All application IDs are UUIDs. Real cricket and fantasy league state are separate. The five migrations in `supabase/migrations/` are authoritative; typed clients and RPC/view interfaces are in `src/lib/supabase/database.types.ts`, with explicit gameplay DTOs in `src/lib/gameplay/types.ts`.

## Cricket domain

| Entity                                  | Identity and responsibility                                                                                                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `competitions`, `seasons`               | Separate tournament and year; unique competition/year. Existing MLC 2026 identity is preserved by ingestion.                                                                  |
| `franchises`                            | Competition-scoped name/code, stable deterministic UUID.                                                                                                                      |
| `cricket_players`                       | Stable Cricsheet registry ID, display name, fantasy role and eligibility provenance. Names are not identity keys.                                                             |
| `season_players`                        | Season/player membership and franchise, primary key `(season_id, player_id)`.                                                                                                 |
| `cricket_matches`                       | Stable source match ID, season, date-only source date, team A/B, venue, finalized status, URL and SHA-256. A/B do not imply venue home/away.                                  |
| `player_match_stats`                    | One normalized appearance per `(match_id, player_id)`, source franchise, stat JSON and raw checksum.                                                                          |
| `player_match_points`                   | Primary key `(match_id, player_id, scoring_version)`, authoritative total and category breakdown.                                                                             |
| `season_rounds`, `season_round_matches` | Seven fixed historical windows and source match membership; a source match belongs to only one window.                                                                        |
| `season_pairings`                       | Five-round, six-seat round-robin pairing template, resolved to fantasy teams after the draft.                                                                                 |
| `cricket_ingest_runs`                   | Source archive checksum/version, attribution, license, role policy and import timestamp.                                                                                      |
| `season_player_summaries`               | Authenticated read-only, `security_invoker` view of recorded appearances, runs, wickets and versioned points. Missing appearance-point coverage is an error in catalog reads. |

The current committed snapshot has 6 franchises, 102 season players, 34 matches, 754 appearances/point rows, 7 windows and 15 regular pairing templates. Source files and the exact map are committed in `data/cricket/mlc-2026/`.

## Fantasy domain

- `profiles`: Auth user ID, display name and creation time. Signup trigger/backfill initialize profiles; no passwords or user email addresses are copied into league snapshots.
- `fantasy_leagues`: season, commissioner, name, six-manager capacity, status, settings/scoring versions and champion team. Settings v2 is 15 drafted / 11 starters / 4 bench; scoring remains `mlc-v0.1`.
- `league_memberships`: unique league/user, commissioner/member role, join timestamp and immutable-at-start draft seat. A partial unique index prevents duplicate seats and commissioners.
- `fantasy_teams`: unique league/manager; composite foreign key to that league membership.
- `league_invitations`: SHA-256 token hash, creator, expiry and revocation. Raw 256-bit secrets exist only in the creation response.
- `league_drafts`: one per league, current pick, 15 rounds, 90 total picks, deadline, clock duration, status and revision.
- `league_draft_picks`: unique `(league_id, pick_number)` and `(league_id, player_id)`, team, source player, round, auto/manual flag and timestamp. These immutable picks are the owned roster; no second conflicting ownership table is maintained.
- `league_game_rounds`: league-specific counterpart to a source window, stage, status and lock/completion timestamps. Source windows are published before drafting; league rounds are instantiated after pick 90.
- `league_lineups`: primary key `(round_id, team_id)`, eleven slot/player selections, submitted/locked timestamps. RPCs validate exact slots, distinct owned players and role eligibility.
- `league_matchups`: paired fantasy teams, frozen playoff seeds, full-precision numeric scores and server-computed result.
- `league_round_contributions`: unique round/team/player and round/team/slot, counted appearances and full-precision average score.
- `league_standings`: unique league/team, regular wins/losses/draws, numeric points for/against and frozen playoff seed. Rank is deterministic in the read model.

## Transactional invariants

1. Join, leave, invitation changes, draft picks, lineup saves and round locks serialize on the target league. Six concurrent seats cannot become seven.
2. Pick number and ownership are league-scoped. Expected-pick compare-and-set, server deadline/current manager and unique constraints prevent duplicate/stale picks. The same real player can be owned in different leagues.
3. Role feasibility reserves enough eligible players and remaining picks for every manager's valid XI, not just the current picker.
4. Only the caller's team can save an XI, only for a participating open round. Commissioner locks and saves cannot race past each other.
5. Historical source ingestion upserts stable match/player/version keys in a transaction. Stored category points trace back to normalized stats and raw checksums.
6. Round scoring uses locked XIs and actual appearances, not browser totals. No contribution is duplicated on recompute; authoritative numeric values are not rounded before display.
7. Regular pairings are 15 unique pairs; the top-four semifinal/final bracket and champion persist across reload and recompute. Advanced bracket identities are frozen, not silently redrawn by corrections.

## RLS and mutation boundaries

All **24 public tables** have RLS. Real source catalog reads require authentication; only authorized co-league members can read fantasy data. Open XIs are owner-only, locked XIs are league-readable. Profiles expose only own/co-league display names, and only an owner's display-name column is directly writable. Invitation rows are commissioner-readable.

Direct client writes to catalog and gameplay tables are revoked. Fifteen narrowly granted public transactional/read RPCs check authenticated identity and required membership/commissioner authority; all have an empty fixed search path and deny anonymous/PUBLIC execution. Private mutation helpers and the profile trigger are not client-executable. See the [security matrix](ARCHITECTURE.md#rpc-security-matrix).

A commissioner cannot leave an owned league; membership changes are lobby-only. No commissioner transfer, account deletion, trades, waivers or live-feed entity is claimed implemented.

## Verification and hosted boundary

The same migrations run in disposable PostgreSQL 17 tests and the dedicated existing hosted project `irdolhsdemjugrsgfuuc`. The hosted schema now contains all five source migration versions; 24-table RLS, invoker-view options, source counts and fifteen RPC execution/identity checks were inspected directly. Anonymous hosted table/view reads and draft mutation return HTTP 401/`42501`.

The destructive DB harness is allowed only on a disposable loopback database named `cricket_fantasy_test`. Actual browser acceptance separately used real native Supabase Auth, PostgREST and Mailpit, not its minimal SQL auth fixtures. Hosted multi-manager email acceptance is not inferred from schema inspection; SMTP and a usable ordinary app session remain separately recorded in README.
