# Data sourcing, licensing and competitive reality

## Historical match data

Cricsheet provides structured ball-by-ball data including Major League Cricket and the IPL, with JSON and CSV downloads:

- https://cricsheet.org/
- https://cricsheet.org/downloads/
- https://cricsheet.org/format/json/
- https://cricsheet.org/matches/

Cricsheet states its JSON/YAML/CSV match data is licensed under the **Open Data Commons Attribution License**. Check source-file metadata and attribution terms before importing/redistributing. Keep attribution visible in docs and UI where needed.

Historical coverage is **not** a live data service. For the first demo, reproduce selected 2026 MLC matches with an offline deterministic ingestion process, preserving source references and import checksums. Do not hardcode invented real player statistics.

## Live data unresolved

Before promising live scoring:
- Confirm provider's right to distribute ball-by-ball stats, rate limits and commercial terms.
- Check how it treats rain interruptions, score corrections, delayed stats, lineup confirmations and rescheduled matches.
- Budget for API usage and robust retries. Keep UI honest about provisional scores.
- Never scrape third-party score sites in violation of terms.

## Player and tournament rights

Stats availability is not permission to copy logos, photos, brand trademarks, broadcast footage or app designs. Start with original icons, text and authorized/placeholder imagery until rights are clear.

## Competitive reality

Season-long, draft-based and private-league fantasy cricket experiences already exist. We should **not** claim this is the first such concept. Our differentiation hypothesis is a streamlined original interface, easy private league setup, exclusive draft-night ownership, clear matchup scoring and lasting social rivalries. This is a UX/community bet, not a claim that alternatives do not exist.

## Research checklist

- Interview at least 10 commissioners or avid cricket fans.
- Test whether they will invite friends and complete a mock draft.
- Review how existing products structure the experience without copying their IP.
- Validate lineup/round fairness via real historical fixtures.
- Verify privacy requirements, appropriate audience safety and platform age rules before launching accounts.
