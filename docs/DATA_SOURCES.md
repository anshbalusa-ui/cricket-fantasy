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

## Competitors to study, not copy

There are already fantasy cricket products with private leagues, auctions or drafts, including:

- CricBattle — https://rms.cricbattle.com/
- DraftMates — https://draftmates.vercel.app/
- The Cricket Draft — https://thecricketdraft.com/
- Traditional per-match fantasy formats (e.g. Dream11)

**Differentiation hypothesis:** a streamlined end-to-end experience emphasizing private leagues, exclusive ownership, simple onboarding, draft night, transparent matchup scoring, chat and season-long rivalries. This is a UX/community bet, **not** a claim that we are the first draft-based cricket fantasy app.

## Research checklist

- Interview at least 10 commissioners or avid cricket fans.
- Test whether they will invite friends and complete a mock draft.
- Compare competitor user journeys, pricing/regions, app availability and retention, while respecting their intellectual property.
- Validate lineup/round fairness via real historical fixtures.
- Verify privacy requirements, appropriate audience safety and platform age rules before launching accounts.
