# UX and visual direction

## Positioning

Original brand / working title: Cricket Fantasy. Do not copy Sleeper marks, screens, or assets. Take inspiration from the *experience*: fast draft rooms, readable player cards, friendly matchups and league rivalries.

## Visual tokens

- Background: midnight navy / charcoal.
- Foreground: warm off-white.
- Highlight: fresh lime-green for action and live states.
- Cards: deep slate with subtle strokes.
- Type: system sans-serif to avoid external-font dependence.
- Data labels: compact uppercase; numbers easy to scan.

## Navigation

Marketing: Features / How it works / Prototype / My leagues / Sign in. Implemented app: Dashboard / My Leagues / Account, with create/join and private league overview/lobby routes. Matchups, players and multiplayer draft navigation are intentionally absent until those features exist. Mobile keeps working actions reachable without deep menus.

## Screen sequence

1. Marketing hero explaining exclusive drafting and private leagues.
2. Implemented league lobby with six manager slots, team names, commissioner identity, invitation lifecycle and explicit draft-not-implemented notice.
3. Draft room with pick clock, available players, filters, pick history and on-clock manager.
4. Roster with starter roles and bench.
5. Matchup with score breakdown per player and provisional/final status.
6. Standings with playoff qualification.
7. Commissioner settings, league invitations and round calendar.

## Accessibility and trust

Ensure keyboard access, visible focus, contrast, touch targets and descriptive icons. Never label example data as live. Clear loading, no-data and failed-sync states are required for data-integrated screens.

M1 desktop/mobile flows were exercised against real local authentication/database services. Unconfigured auth shows setup guidance, invalid credentials/invites show actionable errors, unauthorized league URLs share the same not-found screen, and async forms expose pending states. Joined users see only their own leagues; invitation recipients see no private league details before membership.
