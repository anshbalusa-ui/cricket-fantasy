# Game rules — settings v2 / scoring `mlc-v0.1`

The playable application uses the user-approved **six-manager, 15-player squad, 11 starters + 4 bench** format. Settings v2 replaces the original ten-player/eight-starter proposal. The experimental `mlc-v0.1` point coefficients below are unchanged; season replay and deterministic calculations do not establish competitive fairness or production live-score readiness.

## League and draft

- Free private leagues with six managers. No entry fees, monetary prizes or wagering.
- Fifteen picks each: **90 total picks**, with exclusive player ownership within a fantasy league, not globally.
- Snake order: odd rounds follow seats 1–6; even rounds reverse. Seats are assigned by membership join time, then user ID, at commissioner start. This is deterministic, not a claimed random draw.
- All six managers and a complete imported season are required to start. Membership locks when drafting starts.
- The app uses a 90-second pick clock. The server accepts 15–300 seconds through the draft API. The database owns deadlines and validates expected pick number, current manager, season eligibility and ownership atomically.
- Expired turns receive a deterministic, role-safe server auto-pick when a member checks the room/clock. Visible draft rooms poll every five seconds. There is no always-on offline timer worker; a wholly unattended room resolves an expired turn when a member reconnects.
- Picks cannot exhaust the roles or remaining squad slots needed for any of the six managers to finish a valid XI.

## Starting XI and bench

Eleven distinct owned players: **1 WK, 2 BAT, 2 BOWL, 2 ALL and 4 FLEX**. A flex slot accepts any eligible role. The other four owned players are benched and contribute zero to the fantasy team.

Roles are fantasy eligibility, not a complete official-position dataset. Seven wicketkeepers have explicit official franchise source URLs; other roles follow the published contribution-derived policy. Inspect a player's eligibility source before interpreting the label as an official cricket role. See [DATA_SOURCES.md](DATA_SOURCES.md).

After pick 90, a valid initial XI is generated from draft order. A manager can review/save changes for the current open round. Saved selections carry forward to the next round in which the team participates. Other managers' open XIs are private; all participating XIs become readable when the round locks. Eliminated teams do not submit playoff XIs.

## Historical round windows and locking

- Current playable season: **2026 MLC historical replay**, not live cricket.
- Thirty-four source matches over 22 recorded dates form seven chronological windows: five regular fantasy rounds, a semifinal and a final. Same-day source fixtures are never split. The fixed map is in [`data/cricket/mlc-2026/manifest.json`](../data/cricket/mlc-2026/manifest.json) and the pre-draft fixture calendar.
- Window match counts are **5, 4, 4, 5, 5, 5, 6**. Fantasy playoff windows are not a claim that these are the real MLC semifinal/final fixtures alone.
- Historical dates have already passed. The commissioner explicitly chooses **Lock & replay** after managers are ready; that single transaction freezes the participating XIs and scores the window. It does not use a fabricated kickoff time or pretend the historical fixtures are live.
- Managers cannot edit a locked or future unopened XI. Lineup saves and round locks serialize on the league row.
- Each starter contributes their **average fantasy points per actual eligible appearance in the window**. Playing-XI appearances with zero contribution count; credited substitute-fielding appearances also count. No appearance gives zero. Only starting players contribute.
- Team total is the sum of **eleven** starter averages. Store full PostgreSQL numeric precision; round to one decimal only for display. For example, 58 and 22 in two appearances give 40 for that starter, not 80.
- Averaging reduces extra-match volume advantage. It does not remove differences in opponents, availability, rain-shortened matches, rotation or real-franchise playoff exposure. Further fairness validation remains an alpha requirement; the coefficients are experimental.

A future live mode would need verified fixture timestamps and server-enforced first-match locks. It is not implemented by this historical workflow.

## Per-match fantasy scoring

| Action                                                          |                       Points |
| --------------------------------------------------------------- | ---------------------------: |
| Batter run                                                      |                           +1 |
| Four, additional to runs                                        |                           +1 |
| Six, additional to runs                                         |                           +2 |
| 30 / 50 / 100 batting milestone                                 | +5 / +10 / +20, highest only |
| Dismissed for zero after facing a ball, except BOWL eligibility |                           -5 |
| Bowler-credited wicket                                          |                          +25 |
| 3 / 4 / 5+ wicket haul                                          | +5 / +10 / +20, highest only |
| Maiden over                                                     |                          +12 |
| Catch                                                           |                           +8 |
| Stumping                                                        |                          +12 |
| Direct run-out credit                                           |                          +12 |
| Run-out assist                                                  |                           +6 |

Byes, leg-byes and wides are not batter runs. Run-outs, retired-hurt and other non-bowler dismissals do not become bowler wickets. Super overs are excluded. A full maiden must belong to one bowler; a shared over cannot award a maiden to its final bowler. Tactical retired-out is a dismissal, retired-hurt is not.

Cricsheet fielders do not provide a universal direct-hit flag. The declared adapter policy gives a sole credited run-out fielder direct credit; multiple named fielders receive assisted credit, no guessed direct credit, and a normalization warning. This is an explicit scoring attribution policy, not a claim of independently verified direct-hit technique.

No captain multiplier, salaries, strike/economy-rate adjustments, waivers, trades or custom coefficients are included.

## Head-to-head, standings and playoffs

- Five regular rounds pair each manager with every other exactly once: 15 head-to-head matchups.
- Win earns one win, exact tied stored totals earn a draw. The UI expresses standings equivalently as **2 league points per win, 1 per draw, 0 per loss**.
- Rank by league points, regular-season fantasy points for, head-to-head points among teams tied on both, then stable team ID. Displayed rounded equality alone is not a draw.
- Freeze the top four seeds after Round 5. Semifinals are 1 vs 4 and 2 vs 3; winners meet in the final. An exact playoff tie advances the higher regular-season seed.
- Only participants receive the next playoff lineup. Round 7 records the champion and completes the league.
- The regular table excludes playoff scores. Playoff seed/participant identities remain frozen once the bracket has been created; corrections do not silently redraw an already advanced bracket.

## Corrections and audit

Raw source files, SHA-256 checksums, stable source IDs, normalized statistics, scoring version and each point category remain inspectable. Ordinary managers and commissioners cannot edit source cricket statistics through the application.

An authorized operator can re-import corrected stat values with stable identities, then the commissioner can **Recalculate league** from locked XIs. Repeated imports/recalculations must not duplicate ownership, appearances or contributions. Recalculation updates scored results, regular standings and the champion within the frozen bracket; it does not reopen XIs or retrospectively replace playoff participants. Structural identity, eligibility or window changes require explicit version-controlled review/migrations rather than an invisible live-data edit.
