# Product requirements — Cricket Fantasy

## Product

A free, social, season-long fantasy cricket app: friends draft exclusive players, choose an XI, compete head-to-head and finish with a league champion. MLC first, with competition/season entities kept separate for future tournaments.

The private league is the product: draft night, club identity, rivalries, roster decisions and a title run. [Sleeper fantasy football](https://sleeper.com/fantasy-football) is an experience reference, not an asset/layout source. Draft fantasy cricket already exists; demand and retention are hypotheses to validate, not claims of invention.

## People

- Commissioner: create a private league, invite the group, start drafting and explicitly replay historical rounds.
- Manager: draft real cricket players, save an eligible starting XI and inspect transparent head-to-head scoring.
- New fantasy player: learn snake order, roles, bench behavior, appearances and playoff qualification without a spreadsheet.

## Implemented core journey

1. Understand the free historical format; register/confirm email, sign in, recover a password and edit the account profile.
2. Create an MLC 2026 league. Share an expiring invitation; six genuine accounts join/name their teams. Private names/data are not previewed to outsiders.
3. Inspect real player histories and the published seven-window fixture calendar before drafting.
4. Commissioner starts a **90-pick snake draft**: six managers draft **15 players each**. The server validates turns/deadlines, reserves eligible roles, enforces per-league exclusivity and preserves picks on reconnect.
5. Choose **11 starters and 4 bench**: 1 WK, 2 BAT, 2 BOWL, 2 ALL, 4 FLEX. Review the generated initial XI, then save changes in an open round; selections carry forward.
6. Commissioner locks/replays the recorded window. The server averages each starter's actual appearances, persists contributions and settles matchups/standings.
7. After five regular round-robin rounds, the top four play semifinals and a final. The champion and frozen XIs persist. Commissioners can recalculate scored rounds after approved source corrections.

## Core requirements and boundaries

- Six managers, one team per manager in a league. Unique ownership is **within a fantasy league**, not global.
- Genuine Auth/session/RLS boundaries and transactional join/pick/lock writes; no privileged browser keys or pretend local-storage multiplayer.
- Current source: 102 real 2026 MLC players, 34 finalized matches and auditable `mlc-v0.1` points. Eligibility is explicitly fantasy-derived except the corroborated keeper classifications; it is not a complete official-role dataset.
- Source fixture windows are fixed/published, date-only and historical. **Lock & replay** is an explicit historical operation, not a live-feed claim.
- Compact dark consumer UI: league hub, lobby, player directory/detail, drafting, XIs, matchups, standings, bracket, manager identities and useful loading/empty/error/success behavior.
- Mobile and desktop get deliberate navigation/layouts. Short role badges retain full accessible labels. No inert fake chat, score, projection or live controls.
- `/practice` explains the real 15/11/4 format. `/demo` is separately labeled fictional browser-only three-round practice; its state resets on reload and its ratings are not real match statistics.

## Hosted acceptance is separate

Existing Supabase/Vercel projects are configured; new source/gameplay tables are deployed with RLS and source counts verified. CLI project access and public environment targets do not confer an app user's session or verify SMTP delivery.

The complete multiplayer journey was exercised against real local Supabase Auth/PostgREST/PostgreSQL/Mailpit with normal email confirmation, not admin-confirmed accounts. A full hosted six-manager rehearsal and ordinary-recipient production email remain external acceptance gates. Do not disable confirmation or impersonate users to manufacture a pass.

## Later, not disguised as current features

Trades/waivers, chat/notifications, custom scoring, dynasty, auction/salary drafts, licensed live ingestion, injury services, projections, native apps, public leagues and another tournament release. Competition support is modeled cleanly, not force-completed early.

Real-money wagers, entry fees/prizes, betting markets, proprietary scraped feeds and copied competitor assets remain out of scope.

## Alpha success targets — not evidence

- Five independently organized groups complete a real season replay.
- At least 70% of invited managers finish the draft; at least 60% return after the first round.
- No duplicate ownership, unauthorized picks or unexplained scoring differences.
- Validate availability/franchise-exposure fairness and the experimental role/averaging policy with actual groups before freezing competition rules.
- Verify a production sender, approved quotas, privacy/age policies and timely-data rights before broad release.
