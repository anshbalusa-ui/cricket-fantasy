# Game rules — provisional v0.1

These rules are initial defaults, **not finalized or deployed**. Validate with 2026 match replay and a group of cricket fans before shipping.

## League format

- Free private league, 6 managers for the first playable version.
- 10 players drafted per manager. 8 starters, 2 bench.
- Starter slots: 2 BAT (specialist batters), 2 BOWL (bowlers), 2 ALL (all-rounders), 1 WK (wicketkeeper), 1 FLEX (any eligible role).
- Real player ownership is exclusive **within a fantasy league**, independent across leagues.
- Snake draft: odd-numbered rounds follow original order; even-numbered rounds reverse it.
- Commissioner publishes draft and fantasy-round schedules before the season.
- No captain multiplier, player salary, waivers, trades or custom scoring in v0.1.

## Fantasy rounds and lineup locking

MLC fixtures do not follow one-match-per-team weekly football scheduling.

- Fantasy rounds group consecutive **real match IDs**, set before the league draft and published to managers.
- Entire starting lineup locks when the first real match in that fantasy round starts. No retroactive changes or late substitutions.
- Each starter gets their **average fantasy points per eligible appearance during the round**, rather than simply more points for playing twice. A player with no appearance receives 0.
- Round team total = sum of eight starter values, rounded to one decimal place at display. Keep precise values internally.
- Example: 58 points and 22 points in two appearances => 40 points in that round.
- Caveat: averaging addresses match-volume imbalance, but does not fully equalize schedule quality, variance or missing appearances. Test on historical fixture windows before freezing this design.
- Historical data corrections must recalculate the affected match, player, round and matchup idempotently.

## Per-match fantasy scoring (default)

| Action | Points |
| --- | ---: |
| Run scored by batter | +1 |
| Four hit (on top of four runs) | +1 |
| Six hit (on top of six runs) | +2 |
| Batter reaches 30 / 50 / 100 runs | +5 / +10 / +20 (highest one only) |
| Duck: out for zero after facing a ball, except BOWL role | -5 |
| Bowler-credited wicket | +25 |
| Bowler takes 3 / 4 / 5+ wickets | +5 / +10 / +20 (highest one only) |
| Maiden over | +12 |
| Catch | +8 |
| Stumping | +12 |
| Direct-hit run-out | +12 |
| Run-out assist | +6 |

Boundary bonus is **additional** to runs; wicket bonus excludes run-outs credited to fielders. Exclude leg-byes/byes/wides from batter runs. Non-bowler wicket modes and complex dismissal attribution need explicit importer tests.

Scoring deliberately omits strike-rate and economy-rate adjustments until data quality and balanced incentives are verified.

## Matchups, standings and playoffs

- Each fantasy round pairs managers head-to-head; winner earns 1 win, loser 1 loss; exact tied total is a draw (0.5 standings win for each).
- Rank regular-season teams by standings win points, then total fantasy points, then head-to-head record if available. Remaining tie -> prepublished deterministic team-id ordering until commissioner-approved tiebreaker replaces it.
- Target top-4 playoffs if the real fixture schedule supports enough fantasy rounds: semifinals 1 vs 4 and 2 vs 3, then final.
- For an exactly tied playoff matchup, higher regular-season seed advances.
- 2027 fixture-based round mapping and playoff round count **must be validated** before real leagues open. Do not promise a full round robin or a specific number of weeks yet.

## Sources of truth and disputes

Store the immutable source match reference, per-match player stat line, scoring rule version and points breakdown. Mark historical replay scores as historical; live provisional scores (when available later) must be visibly provisional. League administrators cannot manually modify official match statistics.
