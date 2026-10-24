# Product requirements document (PRD)

## One sentence

A social, season-long fantasy cricket app where groups of friends draft exclusive players, compete head-to-head, and run their own league — starting with Major League Cricket.

## Opportunity and assumptions

Traditional fantasy sports succeed because the shared league is the product: draft night, rivalry, trading, standings and championships. Much fantasy cricket focuses on per-match team selection and giant points leaderboards. Our bet is that a Sleeper-like social private-league workflow will be more engaging for a segment of cricket fans.

This is a hypothesis, not an assertion that draft fantasy cricket does not exist. Similar offerings already exist; see DATA_SOURCES.md.

## Who it is for

- **Commissioner:** wants to organize a league of friends without spreadsheets or manual scorekeeping.
- **Manager:** wants to draft favorite players, manage starters and follow head-to-head scores.
- **Cricket fan new to fantasy:** understands cricket and needs draft rules and scoring explained in plain language.

## Core user journey

1. Visitor understands the rules and sees an example matchup.
2. Commissioner signs in, selects an MLC season and creates a private league.
3. Commissioner shares an invite link; six managers join and name their fantasy teams.
4. Managers enter a live snake-draft room and draft ten players each.
5. Before each fantasy round, managers set eight starters.
6. Real match data is converted to fantasy points; players see their matchup and standings.
7. Top teams enter playoffs and a league champion is declared.

## Must-have MVP

- Auth and accounts; private leagues and one-use or shareable invites.
- Six managers, exactly one owned copy of each real player **per league**.
- Snake draft with turn validation, pick history and reconnection support.
- MLC season/player pool with verified identities and teams.
- Eight lineup slots: 2 BAT, 2 BOWL, 2 ALL, 1 WK, 1 FLEX; 2 bench.
- Per-match points ledger and documented scoring policy; replay of 2026 historical data.
- Pre-published fantasy rounds; whole-round lineup lock; head-to-head and standings.
- Commissioner-managed draft start, league invites and basic membership controls.
- Mobile-responsive UX and accessibility fundamentals.

## Later (not MVP)

Waivers and trades, custom scoring, chat, notifications, live feed, automated injury detection, predictions, dynasty, auction drafts, other tournament releases, public leagues, mobile native apps.

## Explicitly out of scope

Real-money wagers, entry fees/prizes, betting markets, copied Sleeper assets or branding, scraped proprietary score feeds, pretending mock stats are live.

## Screens

Home/marketing; sign-in; leagues overview; create/join league; league lobby; draft room; roster/lineup; matchup; league standings; player directory/detail; commissioner settings; historical replay demo.

## UX principles

Fast mobile interaction; visible draft clock and whose turn it is; scoring explainability; clear status of all data (live, finalized, historical, demo); accessible color contrast and keyboard support. Cricket terminology should be familiar but not unexplained.

## MVP product success criteria (targets, not evidence)

- Five independently organized alpha leagues with real group participation.
- >=70% of invited managers complete the draft.
- >=60% of drafted managers return after the first fantasy round.
- No duplicate ownership, unauthorized picks or silent score differences in test/replay.
- Users can create a league, complete a draft and view scored matchups without manual operator intervention.

## Biggest unknowns to validate

Demand for *season-long* cricket leagues; team/player pool depth for six-manager drafts; fairness of fantasy rounds across an uneven match schedule; legal access to timely real-world data; player/brand imagery permissions; returning activity after matchday.
