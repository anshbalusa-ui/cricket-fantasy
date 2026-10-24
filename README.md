# Cricket Fantasy

**Working title:** Cricket Fantasy  
**Product thesis:** The private-league, draft-night, head-to-head experience of fantasy football — built for cricket.

**Status (October 2026):** Product foundation and an interactive, **fictional-data** prototype. No real accounts, persistent drafts, imported MLC stats, or live scoring yet. The first playable target is an MLC historical-season replay; the architecture is designed to support IPL and other T20 competitions later.

## The experience

Friends form a free private league, draft **exclusive** real-world players, set starting lineups, and face one another in season-long fantasy matchups. Rosters, trades (later), league chat (later), standings and playoffs make managing a team part of following the game.

**This is not a real-money or betting product.**

## Run the prototype

Node.js 20.9+ and npm are required.

```bash
npm install
npm run dev
```

Open http://localhost:3000 for the landing page and http://localhost:3000/demo for:
- An **interactive local-only three-round, six-manager snake draft**, using 18 fictional sample players. Picks are not persisted.
- A cricket scoring playground based on the tested provisional v0.1 rules.

Check locally with:

```bash
npm run typecheck
npm test
npm run build
```

A dependency lockfile has not been committed yet. Generate and commit one before production deployment; [tracking issue #8](https://github.com/anshbalusa-ui/cricket-fantasy/issues/8).

## MVP boundaries

- First tournament: Major League Cricket (MLC); historical 2026 replay for development.
- Six-manager private leagues, ten-player rosters (eight starters and two bench).
- Snake draft with unique ownership per fantasy league.
- Transparent fantasy scoring, fantasy rounds, matchups, standings and playoffs.
- Mobile-first responsive web application.
- IPL and other tournaments modeled from day one, **not** shipped on day one.

## Repository map

- [Product requirements](docs/PRODUCT.md)
- [Game rules](docs/GAME_RULES.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Planned database and security](docs/DATA_MODEL.md)
- [Historical match data and licensing](docs/DATA_SOURCES.md)
- [Design direction](docs/UX.md)
- [Roadmap](docs/ROADMAP.md)
- [Decision log](docs/DECISIONS.md)
- [GitHub implementation issues](https://github.com/anshbalusa-ui/cricket-fantasy/issues)

## Current code map

- src/app/ — responsive marketing page and prototype.
- src/components/demo/ — interactive local draft and scoring playground.
- src/lib/fantasy/ — pure snake order and points/round scoring logic with unit tests.
- src/lib/demo/fixtures.ts — **entirely fictional** demo identities and teams.
- .github/workflows/ci.yml — checks types, unit tests and Next.js build.

## Engineering principles

1. Create original branding and UI, inspired by great social fantasy experiences, not copied assets.
2. Prioritize private league and draft quality over day-to-day contests.
3. Score cricket accurately, audit edge cases and replay history before claiming live support.
4. Keep competitions and fantasy leagues separate in the data model.
5. Never expose privileged database/provider credentials in browser code.
6. Show whether data is demo, historical, provisional or final.

Not affiliated with MLC, IPL or any fantasy sports platform.
