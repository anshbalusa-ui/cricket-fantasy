# UX and visual direction

Cricket Fantasy is a private fantasy-cricket league room, not a SaaS analytics dashboard. [Sleeper fantasy football](https://sleeper.com/fantasy-football) informs league-first navigation, clear ownership, readable statistics and contextual actions. Branding, stumps mark, assets, copy and layouts are original.

## Shared visual system

Charcoal/deep-navy canvas, layered surfaces, mint actions and restrained semantic accents. Locally bundled variable Manrope, tabular statistics, Lucide icons and deterministic ID-seeded avatars. `src/app/globals.css` and shared `Brand`, `Avatar`, `Badge`, `Panel`, `PageHeading`, `Stat`, `EmptyState` and form primitives own the foundations.

Role colors remain consistent in full/compact badges and XI markers: WK mint, BAT amber, BOWL blue, ALL violet. Compact rows show familiar role codes, with full screen-reader text. Colors do not replace labels. Controls have clear boundaries/focus/pending/disabled states; transitions respect reduced motion. No random glow, excessive gradient or copied player imagery.

## Information architecture

- Desktop: persistent Home / Leagues / Players / Account sidebar and season/account context.
- Mobile: a separate bottom navigation and compact context header. In a league it switches to League / My team / Matchup / Draft; the top avatar opens the account.
- League tabs: Home, Roster, Matchup, Standings, Draft, Managers, Players. All are actual views, not coming-soon simulations. Active and keyboard-focused items reveal themselves inside the horizontal scrollport.
- `/practice` is the real format guide. The optional `/demo` arena remains visibly fictional, local-only and reset-on-refresh; it is not core navigation or evidence of multiplayer.

## Real product surfaces

**Hub:** actual league memberships, own club names, active draft actions, season context, invitation entry and real player-pool links. Empty hubs explain how to create/join, not fake participation.

**Authentication:** ordinary signup/confirmation, password sign-in/out and self-service recovery. Trusted-origin PKCE/token-hash callbacks retain safe invitation destinations. Email restrictions are explained without claiming production delivery.

**Lobby:** actual managers/team identities, commissioner status, capacity, editable names, invitation generation/copy/revocation and membership transitions. Server validation remains authoritative; failed forms keep meaningful input.

**Draft:** commissioner readiness screen, real published fixture windows before the first pick, server-authoritative turn and countdown, name/franchise search, distinct all-role/all-rounder filtering, historical-average ordering, compact player rows and role-safe picks. Player-pool/board switching is a labeled pressed-button group. The six-column 15-round board scrolls internally on mobile; it renders all 90 saved picks. Own squad composition and recent pick history use persisted data. Countdown updates do not rerender the full player pool every tick.

**Roster:** fifteen owned players, eleven typed/flex slots and four bench. Local edits survive snapshot refresh; only valid distinct owned players can save. Default/carried XIs are reviewable, current open XIs are owner-editable, locked XIs read-only. Opponent open XIs are explicitly private, not falsely labeled all-bench. Future/unplayed or eliminated-club rounds explain their actual state rather than showing an invented XI.

**Matchups:** own pairing comes first; club identities, real finalized scores and expandable starting-player appearances/contributions. Historical fixture dates/venues/source links are separate from fantasy home/away sides. No unsupported projection or live status. Commissioner lock/replay states that all participating XIs freeze.

**Standings/title run:** regular records, league points, points for/against, frozen seed bracket and actual champion. Full precision decides results; display rounds to one decimal. Recalculate tools appear only to the commissioner after scored rounds exist.

**Players:** source-backed directory/search/roles, franchise, appearances, runs, wickets and labeled historical averages. Global and league-scoped profiles reuse the same readable category-by-category match audit, not raw JSON dumps. Eligibility/source/license notes are visible; no invented photos or verified-live claims.

## Synchronization, failure and accessibility

Visible rooms poll five seconds while drafting, twenty otherwise. Older fetches are aborted/ignored; hidden polling pauses. Offline/expired-session states retain the last saved snapshot but block writes and provide reconnect/sign-in actions. Interrupted mutation responses warn that an action may have committed. No automatic replay of an uncertain user pick/save.

Native labels, skip links, keyboard focus, non-color status, accessible compact role text, native details controls and semantic grouped switches are required. Information-only scores and disabled turns do not pretend to be active buttons.

## Exercised verification

Twelve actual protected surfaces were checked at **320, 390, 768 and 1440px**: 48 viewport checks, with no horizontal page or top-level panel overflow. Desktop draft/roster and mobile standings/profile/calendar were visually inspected. Genuine Auth, email confirmation/recovery, invitation continuation, 90-pick multiplayer draft, XI save/lock, seven rounds and champion were exercised against native Auth/PostgREST/PostgreSQL/Mailpit.

Ten mobile/desktop WCAG-tagged axe scans reported no violations; focused follow-up corrected the draft-switch group semantics and dense role overlap. Bounding-box checks confirmed zero role/average overlap. Remaining clipped inactive-tab/background findings received manual review; focusing a clipped tab revealed it correctly. The board showed all 90 picks and a real profile expanded all eight point categories plus total. These checks are not WCAG certification or assistive-technology user research.

Hosted SMTP and genuine multi-manager participation are separately recorded in README. A good frontend does not prove public email deliverability, statistical fairness or a live-data contract.
