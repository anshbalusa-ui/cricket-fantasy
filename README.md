# Cricket Fantasy

Free, season-long, draft-based fantasy cricket for private groups. MLC first; the competition/season model also supports future tournaments. Original branding and UI; no real-money contests.

**Website:** [cricket-fantasy-two.vercel.app](https://cricket-fantasy-two.vercel.app). Hosted configuration and acceptance limits are recorded below; a successful deployment is not a production-email readiness claim.

## Implemented: M1 accounts and private leagues

- Supabase email/password signup, email confirmation, sign-in, sign-out, cookie sessions and protected routes.
- Persistent profiles, dashboard, My Leagues, MLC league creation, overview and six-manager lobby.
- Atomic commissioner membership/team creation, custom league/team names, manager leave/rejoin, and profile editing.
- Commissioner-only invitations: 256-bit secrets, SHA-256 hashes in Postgres, seven-day expiry, revocation and rotation. Invitation signup preserves the join destination through email confirmation.
- Database authorization and RLS: only members can read a private league; only commissioners manage its name/invitations; managers control their own team. Row locks prevent concurrent joins from overfilling a league.
- Original dark fantasy-sports interface with locally bundled Manrope, Lucide icons, shared visual foundations, desktop sidebar/mobile bottom navigation, compact league/player identities and accessible loading/error/empty states.

**Not implemented:** persistent multiplayer drafting, player ownership/rosters, ingestion, fixtures, scoring persistence, matchups, standings, playoffs, chat or live results. `/demo` is a separate **fictional, browser-only practice arena** with a working three-round snake draft, search/role filters, player profiles, pick history, roster composition and scoring controls. Picks reset on reload; ratings are fictional, not verified cricket data.

## Run locally

Use Node.js 22.x (`.nvmrc` selects 22) and npm. The committed lockfile is used by CI; the explicit engine range keeps Vercel on the same tested major rather than selecting Node 24.

```sh
npm ci
cp .env.example .env.local
```

Configure `.env.local`:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project/API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public publishable key from Connect; a local anon JWT also works in this field |
| `NEXT_PUBLIC_SITE_URL` | Exact trusted app origin, e.g. `http://localhost:3000`; production requires HTTPS |

Never use a `service_role` or secret key in these variables. Application queries and RPCs run with the signed-in user's session, not privileged credentials. Environment files are ignored by git.

```sh
npm run dev
```

Open `http://localhost:3000`. Without Supabase variables, the public landing/practice arena still work and auth screens explain the missing configuration; no fake login or local-storage league fallback is provided.

### Option A: local Supabase

Install a supported Docker/Podman environment and use the pinned CLI:

```sh
npx supabase start
npx supabase status
```

Use the printed API URL and public key in `.env.local`. `supabase/config.toml` enables email confirmation and includes the versioned confirmation template. New migrations are applied on startup. For a deliberate **local-only data reset**, run `npx supabase db reset` (this deletes local data). The migration seeds only MLC/2026 catalogue metadata—not fixtures, results or player data.

Open the local email inbox URL printed by `supabase status` to confirm test accounts. The standard Docker stack was not run on the implementation machine because Docker/Podman was unavailable; actual application flows were instead exercised against native Supabase Auth, PostgREST, PostgreSQL and Mailpit, as detailed below.

### Option B: hosted Supabase

1. Prefer the existing connected Supabase app/plugin when available; its authentication is independent of Supabase CLI login. This repository's dedicated hosted project is recorded below. Do not create duplicates or reuse unrelated/inactive projects.
2. Inspect migration history before applying changes. An authenticated CLI is an optional alternative to the connected plugin:
   ```sh
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```
   The migration system applies `20261024000000_m1_private_leagues.sql` followed by `20261024000001_backfill_existing_profiles.sql`. The second migration initializes missing profiles for Auth accounts created before M1 without changing existing profiles. Inspect `npx supabase migration list --linked` before applying; never blindly replay the base migration or run the destructive test harness against a hosted project.
3. Enable email/password signup and email confirmation. Set **Auth → URL Configuration → Site URL** to the trusted app origin and narrowly allow `/auth/confirm` redirects, including the `next` query. The dedicated project's applied settings are recorded below.
4. Choose the supported confirmation protocol:
   - The default hosted mailer uses standard PKCE: the callback exchanges `code` with `exchangeCodeForSession`. Open the email in the same browser and exact origin used for signup. Use the canonical production website or the provider-generated immutable preview URL, not a different deployment alias.
   - Local Supabase and custom-SMTP installations can use `supabase/templates/confirmation.html`:
     ```html
     <a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Confirm your email</a>
     ```
     Signup supplies `/auth/confirm?next=...`; this protocol calls `verifyOtp`. Both protocols retain the validated relative destination, including invitation queries. Ambiguous code-plus-token-hash requests are rejected.
   - The existing Free project/default mailer rejected custom-template changes with HTTP 400: “Email template modification is not available for free tier projects using the default email provider.” The default template was retained; no plan upgrade or disabled confirmation was used.
5. Configure a verified SMTP sender/provider before inviting ordinary users. The [default mailer](https://supabase.com/docs/guides/auth/auth-smtp) only sends to project-organization members, currently permits two messages/hour and provides no delivery SLA.
6. Fill the three environment variables above and restart Next.js.

### Verified hosted backend

| Setting | Verified value |
| --- | --- |
| Project | `cricket-fantasy` |
| Project reference | `irdolhsdemjugrsgfuuc` |
| API URL | `https://irdolhsdemjugrsgfuuc.supabase.co` |
| Organization/region | User-selected personal Free organization; US West `us-west-1` |
| Provisioning | `ACTIVE_HEALTHY`; creation quoted and confirmed at **$0/month** |
| Migration history | `20261024000000` and `20261024000001`, matching the repository files |

The connected Supabase plugin created this isolated project and applied both migration files verbatim to an initially empty public schema. MCP-generated execution timestamps were reconciled to the repository versions with guarded migration-metadata updates; application SQL/data were not rewritten. No destructive test harness was run on hosted data. The unrelated inactive project was left untouched.

All seven public tables have RLS enabled; keys, membership/team uniqueness, the composite membership foreign key, one-commissioner index and table/column/function grants were verified. Real anonymous Data API reads and unauthenticated league mutations returned HTTP 401/permission denied. Hosted email/password signup is enabled and email confirmation is required.

**Security advisor review:** hosted advisors report seven [authenticated SECURITY DEFINER warnings](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), one for each intentionally callable transactional league RPC. These are retained, not suppressed: anonymous execution is revoked, every function has a fixed empty search path, and authorization/ownership checks remain mandatory. Direct league writes are denied. The trigger helper is not executable by client roles. Do not describe this as zero hosted warnings.

The ignored `.env.local` uses the real development backend's URL, enabled modern publishable key and `http://localhost:3000`; key values are not committed. Vercel development/preview/production public configuration and Supabase Auth URL settings are applied. The hosted provider records an email-confirmed owner account and successful sign-in; actual hosted invalid-login responses and anonymous API/RPC denial were also exercised. **Authenticated hosted league/invitation/persistence verification still requires the owner's available app session. The full hosted multi-manager rehearsal and production SMTP remain separate acceptance gates.**

### Applied hosted Auth configuration

- Site URL: `https://cricket-fantasy-two.vercel.app`.
- Email/password signup enabled; email confirmation required; default provider template retained.
- Allowed confirmation destinations:
  ```
  http://localhost:3000/auth/confirm**
  http://127.0.0.1:3000/auth/confirm**
  https://cricket-fantasy-two.vercel.app/auth/confirm**
  https://cricket-fantasy-*-anshbalusa-8318s-projects.vercel.app/auth/confirm**
  ```
- Settings were applied through the authenticated Supabase CLI using an isolated Auth-only configuration. **Do not blindly push the local `supabase/config.toml` to hosted:** its localhost URL and local email-template configuration are development settings, not this deployed policy.


## Verification

```sh
npm run typecheck
npm test
npm run build
```

Database policies and concurrency require a **dedicated disposable PostgreSQL 17 database named exactly `cricket_fantasy_test` on localhost/loopback**, owned by a superuser:

```sh
createdb cricket_fantasy_test
TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/cricket_fantasy_test npm run test:db
```

**Destructive test harness:** it refuses any other database name or non-local hostname and drops/recreates the `public` and `private` schemas in that database. On plain Postgres it creates minimal test-only `auth.users`/`auth.uid()` fixtures; those fixtures are not an authentication implementation and never run in the app. Use only a disposable database with no valuable data. Never point it through a tunnel to hosted data. CI supplies a fresh PostgreSQL 17 service.

Verified during implementation:

- Hosted integration/redesign: `npm ci`, TypeScript checking, **19** domain/validation tests, **4** isolated PostgreSQL integration scenarios and the optimized Next.js build passed. `npm audit --audit-level=moderate` reported **zero vulnerabilities**, including development dependencies. GitHub Actions web/database jobs and automatic Vercel previews were verified; current delivery is tracked in [PR #11](https://github.com/anshbalusa-ui/cricket-fantasy/pull/11).
- Real Supabase Auth source tag v2.197.0 + PostgREST v16.5 + PostgreSQL 17.11 + Mailpit: seven normally registered, email-confirmed fixture accounts; default-template PKCE signup/confirmation into league creation; ordinary password sign-in/out; invitation-preserving sign-in; persisted profile/team/league edits; invitation clipboard copy/revoke/replacement; manager leave/rejoin; duplicate rejection and commissioner/member boundaries. A real API race admitted exactly one of two final-seat contenders, leaving six memberships and six teams. Nonmembers received no private rows or league-name disclosure. The Next.js unavailable screen can use HTTP 200 when streamed; privacy is enforced by authentication/RLS, not an assumed 404 status.
- Expired-session refresh: a real provider-issued 120-second access token expired; reloading the protected dashboard rotated both access/refresh tokens and retained authentication with an unexpired token.
- Public landing, sign-in, sign-up and practice surfaces checked at **320/390/768/1440px** without horizontal page overflow; **13 authenticated surfaces at the same four widths** also passed. Maximum 60-character league/40-character profile names stayed contained at mobile/tablet/desktop widths. Browser smoke completed all **18** local draft picks in correct snake order with exclusive picks, search/no-results/filters, player dialog/Escape/focus restoration and reset; scoring changed **106 → 107 → 106**. Real hosted login failure, disabled pending submission and password visibility controls worked. **34 mobile/desktop WCAG-tagged axe checks reported no violations**; clipped navigation and minus-symbol contrast received manual review, not a certification claim. Active and keyboard-focused league tabs now reveal themselves. Failed create/join/rename/profile submissions retain input, including the selected season.
- Database tests exercise table/RPC grants and RLS, own/co-member profile privacy, cross-league isolation, invitation format/expiry/revocation/rotation, duplicate membership, commissioner constraints, and competing joins for the final seat (exactly one admitted).
- Follow-up browser smoke used actual native Auth/PostgREST/Postgres/Mailpit with a synthetic Vercel preview environment, not a Vercel deployment: the email link used the preview origin rather than the configured production origin and preserved the invitation destination. Its token was redeemed only on the local application. A real pre-migration account had zero profiles before the forward migration and one afterward, then successfully created a league. A second email-confirmed account joined; membership persisted on reload, and the 390px lobby had no horizontal overflow.
- Hosted schema/grant/constraint checks and real anonymous REST/RPC denial passed on the dedicated project. The seven retained warnings were reviewed function-by-function against the actual deployed SQL, including authenticated/anonymous/PUBLIC execution grants; see the architecture security matrix. No authorization defect requiring a new migration was found. Hosted positive account/league/email acceptance is recorded separately rather than inferred from these tests.

## Vercel project and Git connection

The locally authenticated Vercel CLI created `cricket-fantasy` (`prj_VYvlYPp8UDKDlJ2pIVGfVlpp9wah`) in existing Hobby workspace `anshbalusa-8318s-projects`. [Project dashboard](https://vercel.com/anshbalusa-8318s-projects/cricket-fantasy). Verified project settings are Next.js, Node `22.x`, and repository root. The Git link targets `anshbalusa-ui/cricket-fantasy` on GitHub with production branch `main`; other branches use previews. Vercel's default `git.deploymentEnabled=true` is unchanged, and the repository does not disable it.

The earlier ChatGPT integration project-create 403 was resolved through the separately authenticated CLI's normal browser device flow and own credentials, not by bypassing permissions or changing the plan. Only the requested project was configured; no purchase, paid feature, plan change or unrelated project mutation occurred. `vercel.json` retains the Next.js build/install commands.

The first automatic Git push (`26f137480dae6c9b48984b6c79460d36f3e5c736`) produced deployment `dpl_5XEc76opaqRkSKhLxFXXV7BfSr1J` in `READY` state. Its assigned [website URL](https://cricket-fantasy-two.vercel.app) serves the landing page. This verifies the Git deployment hook and build, not hosted authentication/email readiness.

The existing project now has `NEXT_PUBLIC_SUPABASE_URL` and the active `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in **development, preview and production**. `NEXT_PUBLIC_SITE_URL` uses localhost for development, the canonical website for production and a verified HTTPS preview fallback. Actual previews use only Vercel's generated `VERCEL_URL` when `VERCEL_ENV=preview`; system-environment exposure was verified enabled. Incoming `Host`/forwarded-host headers never determine an email origin. Public variables are embedded at build time, so changes require a new build.

The feature push for `8bfced3` automatically created Ready deployment `dpl_4UURuTpiwNNnmUZgT2whntngFTf8`, [immutable preview](https://cricket-fantasy-2yw8hg7w3-anshbalusa-8318s-projects.vercel.app). Normal Vercel preview protection remains in place. The Supabase allowlist above is specific to this project/workspace, not a global `*.vercel.app` wildcard.

[PR #10](https://github.com/anshbalusa-ui/cricket-fantasy/pull/10) was reviewed and merged as `3d36be7b0b337e06835d6cb642cf5b6106b096dd`. The original consumer interface and remaining hosted integration changes are tracked in [PR #11](https://github.com/anshbalusa-ui/cricket-fantasy/pull/11); the canonical website above follows `main`, rather than a hard-coded preview alias.

No custom SMTP provider, sender domain or production recipient delivery has been verified. Supabase's default sender is restricted to organization members and low-rate development use. A verified sender/provider and approved quotas are required for ordinary manager invitations and a full hosted six-manager rehearsal. No paid resource is authorized by this runbook. Authenticated responses must not use shared caching; `src/proxy.ts` forwards refresh cookies and cache headers.


## Code map

- `src/lib/auth/`, `src/lib/supabase/`: validation, server auth/actions, user-scoped typed clients and session refresh.
- `src/lib/users/`, `src/lib/competitions/`, `src/lib/leagues/`: profiles, catalogue and league queries/actions.
- `src/lib/fantasy/`: existing draft-order/scoring domain logic (`mlc-v0.1`).
- `src/app/(auth)/`, `src/app/(app)/`: auth screens and protected application routes.
- `src/components/forms/`, `src/components/leagues/`: reusable form and league UI.
- `src/components/ui/`, `src/components/application/`: original visual primitives, Lucide icon map and shared responsive navigation.
- `src/components/fantasy/`, `src/components/demo/`: honest future-gameplay presentation and functional fictional practice interactions.
- `supabase/migrations/`, `supabase/tests/`, `supabase/templates/`: schema/security, integration scenarios and email template.
- `public/licenses/`: bundled [Manrope SIL OFL 1.1](public/licenses/manrope.txt) and [Lucide ISC / Feather MIT](public/licenses/lucide.txt) redistribution notices; the Cricket Fantasy brand/stumps mark is original.

Database interfaces in `src/lib/supabase/database.types.ts` track the migration. When changing the schema, regenerate with `npx supabase gen types typescript --local --schema public` in a supported local Supabase environment and review RPC/relationship types alongside callers. Schema status/settings versions and per-league teams establish the boundary for M2; no draft tables or pretend draft controls were added prematurely.

## Product documentation

[Product](docs/PRODUCT.md) · [Roadmap](docs/ROADMAP.md) · [Architecture](docs/ARCHITECTURE.md) · [Data model](docs/DATA_MODEL.md) · [Game rules](docs/GAME_RULES.md) · [UX](docs/UX.md) · [Decisions](docs/DECISIONS.md) · [Data sources](docs/DATA_SOURCES.md)

Implementation references: [Supabase Next.js SSR](https://supabase.com/docs/guides/auth/server-side/nextjs), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [local development](https://supabase.com/docs/guides/local-development/cli/getting-started), [CLI configuration](https://supabase.com/docs/guides/local-development/cli/config).
