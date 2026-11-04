# Data sourcing, licensing and verified coverage

## Committed historical source

The application imports **2026 Major League Cricket historical data**, not a live feed. Original JSON files and per-file SHA-256 values are committed under [`data/cricket/mlc-2026/`](../data/cricket/mlc-2026/).

- Provider: [Cricsheet](https://cricsheet.org/).
- Archive: [MLC JSON ZIP](https://cricsheet.org/downloads/mlc_json.zip), 109 archive matches at acquisition; 34 belong to the selected 2026 season.
- Archive SHA-256: `0e54cad247f1f26e7ee803f6e69ce6100166e66022f3ac5818e227855502db0b`.
- Format: [Cricsheet JSON](https://cricsheet.org/format/json/), declared version 1.3.0.
- License: [Open Data Commons Attribution 1.0](https://opendatacommons.org/licenses/by/1.0/), per [Cricsheet licensing](https://cricsheet.org/licensing/). JSON is ODC-BY; the separate XML CC-BY terms are not substituted for this dataset.
- A license copy ships at `/licenses/cricsheet-odc-by-1.0.txt`. Attribution, source links, eligibility notes and historical labels appear in the player/league UI.

| Imported entity                  | Verified rows |
| -------------------------------- | ------------: |
| Franchises                       |             6 |
| Season players                   |           102 |
| Final source matches             |            34 |
| Recorded dates                   |            22 |
| Player appearances               |           754 |
| `mlc-v0.1` appearance breakdowns |           754 |
| Fantasy source windows           |             7 |
| Regular pairing templates        |            15 |

Canonical UUIDs derive from source identifiers. Team A/B follow source order and do not claim venue home/away. Dates remain dates: no invented match start times. Starting-XI zero-contribution appearances count; credited substitute-fielding appearances also count.

## Eligibility provenance

Cricsheet does not supply a complete official fantasy-role dataset. This adapter declares **fantasy eligibility**, not verified official positions for every player.

Seven keeper source IDs are corroborated by official franchise roster pages: Tim Seifert/Shayan Jahangir ([Seattle](https://www.seattleorcas.com/players)); Andries Gous/Lahiru Milantha ([Washington](https://www.washingtonfreedom.com/squad)); Andre Fletcher/Unmukt Chand ([Los Angeles](https://www.lakriders.us/)); Saideep Ganesh ([San Francisco](https://www.sfunicorns.com/squad/)). The source URL is retained on each eligible player.

Other roles use versioned policy `mlc-2026-v2`: ALL if both batting evidence (20 season runs or 15 balls faced) and bowling evidence (a credited wicket or maiden); BOWL for bowling evidence alone; otherwise BAT. Current counts are WK 7, BAT 37, BOWL 20, ALL 38. This is transparent derived eligibility, not an assertion that all real specialist roles are covered. Six complete 15-player squads/eligible XIs were exercised. Real role coverage and competitive balance remain alpha-review topics.

## Normalization and attribution

The adapter separates batter runs from extras, actual boundaries from non-boundary fours/sixes, and credited bowler wickets from run-outs/other dismissals. Catches, caught-and-bowled, stumpings, run-out participants, maidens, legal balls, tactical retirements and super-over exclusion have behavioral fixtures.

A sole named run-out fielder receives direct credit under the declared adapter policy. With multiple fielders, each receives assisted credit, no direct hit is guessed, and normalization reports ambiguity. The raw source and normalized stat line make this auditable. Shared-bowler overs cannot award a maiden to only the final bowler.

## Independent scorecard audit

The implementation audited **12 player stat lines and manually calculated fantasy totals across two actual matches**:

- Source `1528557`, Seattle v Texas, recorded June 18: [independent full scorecard](https://cricketaddictor.com/livescore/texas-super-kings-vs-seattle-orcas-match-1-major-league-cricket-2026/scorecard/). F du Plessis 113 from 52, nine fours/seven sixes → 156 FP; TL Seifert 104 from 66 plus catch → 152; SR Mukkamalla duck plus catch → 3; AF Milne wicket/catch → 33; RR Rossouw 49 with boundaries → 65. The source has 23 credited appearances because a substitute fielder contributed. External local-date presentation can differ; the source match ID, teams and scorecard identify the game.
- Source `1528558`, SF v Los Angeles, recorded June 19: [ESPN full scorecard](https://www.espn.in/cricket/series/21266/scorecard/1528558/los-angeles-knight-riders-vs-san-francisco-unicorns-2nd-match-21266). A rain-shortened 14-over match; MW Short run out, with Tromp/Fletcher assisted attribution. Checked Short 65 FP, Fletcher 60, Tromp 6, Munro 96, Narine 50, Chand 16 and Siddle 50. The run-out is not a seventh credited bowler wicket.

Two complete identical operator imports left all nine normalized-table row counts and full-row fingerprints unchanged, with one source audit row. Recomputing all seven locked fantasy rounds retained every score and the champion. These are repeatability/attribution results, not proof that every source event is error-free or the scoring policy is competitively balanced.

## Operator workflow

```sh
# Validate committed raw files/checksums; print manifest without DB writes
npx tsx scripts/import-cricket.ts

# Explicit source refresh from a locally obtained official archive
npx tsx scripts/import-cricket.ts --archive=/secure/path/mlc_json.zip

# Authorized operator only; use a private server-side connection
DATABASE_URL=... npx tsx scripts/import-cricket.ts --apply
```

Review source/license/role-policy differences before applying a refreshed snapshot. Import upserts stable identities and point versions transactionally; it refuses identity/name conflicts rather than guessing. It does not automatically delete absent source identities or redesign the published fixture map. Structural identity/eligibility/window changes require a reviewed forward migration. After approved stat-value corrections, commissioners recalculate affected leagues from frozen XIs; advanced playoff identities remain frozen.

`--write-migration` generated the initial seed before publication. **Do not regenerate or edit an already deployed migration.** Subsequent changes need new version-controlled migrations and updated source provenance. Never put `DATABASE_URL`, management tokens, SMTP passwords or service-role keys in public variables, client code or committed files.

## Live data and rights still unresolved

Historical coverage is not live service availability. Before releasing another/current season, verify redistribution rights, contractual rate limits/SLA, fixture times, rain/reschedule/lineup handling and monitored correction operations. There is no live-provider credential or partnership assumed here.

Statistics licenses do not authorize copying franchise logos, player photos, broadcasts or competitors' interfaces. Cricket Fantasy uses original branding/avatars and licensed local fonts/icons, not Sleeper assets. Draft-based fantasy cricket already exists; differentiation is an experience/community hypothesis, not a claim to invent the category.

Further validation: prospective commissioner interviews, genuine group participation, franchise-exposure/availability/fairness analysis, data-provider rights, privacy/age policies and production email delivery. Do not turn those research targets into verified claims.
