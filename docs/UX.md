# UX and visual direction

## Positioning

Cricket Fantasy is a private fantasy-cricket league room, not a generic analytics dashboard. The experience takes principles from [Sleeper fantasy football](https://sleeper.com/fantasy-football): league identity first, persistent navigation, readable player information, obvious draft ownership and contextual next actions. Branding, stumps mark, copy, components and layouts are original; no Sleeper assets are used.

## Implemented design system

- Charcoal/navy canvas with separate soft, regular and raised surfaces; mint primary actions, blue/violet secondary accents and explicit amber/error states. Cricket roles have consistent named color badges; color never replaces a label.
- Locally bundled variable Manrope for interface text; system monospace and tabular numerals for pick numbers and statistics. There is no external font request.
- Shared `Brand`, deterministic ID-seeded `Avatar`, `Badge`, `Panel`, `PageHeading`, `Stat` and `EmptyState` components in `src/components/ui/`; Lucide supplies consistent icons.
- `src/app/globals.css` owns typography, spacing, surfaces, semantic colors, control boundaries, focus, buttons, forms, notices, skeletons and reduced-motion behavior. Route styles build on those foundations.
- Compact hierarchy and contextual panels rather than repeated KPI dashboards. Controls have descriptive accessible names; mobile actions and bottom-navigation targets are at least 44px high.

## Navigation and current surfaces

- Public header: brand, practice, leagues, sign-in and account creation. The landing illustration explicitly labels its fictional names and planned lineup format.
- Desktop application: season context, Home / Leagues / Practice / Account sidebar, manager identity and sign-out. Mobile uses a separate fixed bottom navigation, compact brand/context header and account shortcut; it is not a shrunken sidebar.
- Home shows actual memberships, team identities, catalogue metadata, open commissioner seats and actionable links. Catalogue metadata is not a schedule or live-data feed.
- League creation and join screens retain server validation and pending/error states. Create/join/rename/profile inputs survive rejected submissions; the controlled season selector explicitly avoids React's native post-action reset. Private league overview/lobby show actual manager names, team identities, commissioner status, invitation lifecycle and membership-derived activity.
- League tabs expose clearly labeled upcoming roster, matchup and draft views rather than fake scores, a fake clock, inert draft controls or fabricated standings. Active and keyboard-focused tabs reveal themselves in the horizontally scrollable navigation; focus outlines remain inside the scrollport.
- Account/profile editing, team/league naming, invitation copy/revoke/regeneration and sign-out remain real operations, not visual demonstrations.

## Practice and upcoming gameplay

`/demo` is a working **fictional, browser-only practice arena**: six fictional teams, three snake rounds, player/franchise search, role filters, manager/round board, pick history, team composition, player details and reset. Its ratings are fictional demonstration values, not fantasy points. Picks are exclusive only within this local practice session and disappear on refresh; there is no multiplayer or persisted ownership.

The practice player dialog uses native modal focus behavior, Escape/close controls, role/franchise identity and explicit unavailable historical/match statistics. The scoring playground calls the existing `mlc-v0.1` domain formula and labels every input/output as an example.

Reusable planned-lineup and head-to-head components show the documented eight starters and two bench places, team identity, an unassigned opponent and unavailable scores. They do not assign players, calculate projections, invent match contributions or imply a live match. The protected `/practice` lineup guide links to the actual practice arena.

M2 must replace upcoming league gameplay with server-authoritative draft state, real normalized player IDs, reconnect handling and transactional picks. M3 adds auditable historical scoring and real matchup contributions. Visual foundations are not evidence those modules exist.

## Accessibility and verification

Visible keyboard focus, native labeled form controls, skip links, reduced motion, explicit status/error messages, ID-consistent avatars and sufficient interactive-boundary contrast are part of the shared system. Use role labels alongside color and never label fictional data live.

Public landing, sign-in, sign-up and practice surfaces were exercised at 320, 390, 768 and 1440px without horizontal page overflow. Thirteen authenticated routes/views passed the same four widths against real native Auth/PostgREST/PostgreSQL; screenshot/child-bound checks caught and corrected a tablet lobby overlap that page-overflow checks alone missed. Maximum-length league/profile names remained contained. Browser smoke completed all 18 practice picks with both snake reversals, exclusive local picks, profile Escape/close/focus restoration, search/no-results/role filtering, reset and scoring changes.

The 26 authenticated and eight public mobile/desktop WCAG-tagged axe scans reported no violations. Automated checks drove draft-slot contrast and group-semantic corrections. Clipped inactive tabs, nearly opaque bottom navigation and minus symbols needed manual contrast/keyboard review; active/focused tabs were then checked at all four widths. Form controls, loading skeletons, empty hubs, rejected invitations/full leagues, saved edits and private unavailable states were exercised. These checks are not a claim of full WCAG certification or a substitute for assistive-technology user testing.

The README records hosted authentication/private-league acceptance separately from interface implementation. Default Supabase email restrictions must not be mistaken for public signup readiness.
