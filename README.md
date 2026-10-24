# Cricket Fantasy

**Working title:** Cricket Fantasy  
**Product thesis:** The private-league, draft-night, head-to-head experience of fantasy football — built for cricket.

**Status (October 2026):** Product foundation and prototype. No live stats, real accounts, drafts, or deployed service yet. Our first playable target is an MLC historical-season replay; the architecture will later support IPL and other T20 competitions.

## The experience

Friends form a free private league, draft **exclusive** real-world players, set starting lineups, and face one another in season-long fantasy matchups. Rosters, waivers, league chat, standings and playoffs make managing a team as compelling as choosing one.

**This is not a real-money or betting product.**

## MVP boundaries

- First tournament: Major League Cricket (MLC), with a 2026 replay as the testing environment.
- Six-manager private leagues, 10-player rosters (8 starters and 2 bench).
- Snake draft with unique ownership per fantasy league.
- Transparent fantasy scoring, fantasy rounds, matchups, standings and playoffs.
- Mobile-first responsive web app.
- IPL and other tournaments supported by the underlying season and competition model, **not** shipped on day one.

## Repository map

- [Product requirements](docs/PRODUCT.md) — audience, MVP, UX and success criteria.
- [Game rules](docs/GAME_RULES.md) — first-pass scoring and league format.
- [Architecture](docs/ARCHITECTURE.md) — product boundaries, technical choices and data flow.
- [Data model](docs/DATA_MODEL.md) — planned tables, invariants and permissions.
- [Data sources and competition](docs/DATA_SOURCES.md) — historical match data, rights and competitive reality.
- [Roadmap](docs/ROADMAP.md) — milestones and acceptance criteria.
- [Decision log](docs/DECISIONS.md) — why we're making these decisions.

## Local development

Once the scaffold is committed, install dependencies with npm and run the local development server. See the scripts in package.json. The UI will clearly label simulated/demo data.

No Supabase project, live feed or production credentials should be assumed from the presence of this repository. See docs/ROADMAP.md for the remaining work.

## Guiding principles

1. Be as social and easy to use as the best traditional fantasy apps, while designing *original* UI and branding.
2. Prioritize draft and league quality over daily fantasy contests.
3. Score cricket accurately, document edge cases and allow historical replay before claiming live support.
4. Build multi-tournament data boundaries from day one, without trying to ship every league immediately.
5. Protect private league data and never expose privileged data-provider or database credentials in client code.
