# Cricket Fantasy

Free, season-long, draft-based fantasy cricket for private groups. MLC first; the competition/season model also supports future tournaments. Original branding and UI; no real-money contests.

## Implemented: M1 accounts and private leagues

- Supabase email/password signup, email confirmation, sign-in, sign-out, cookie sessions and protected routes.
- Persistent profiles, dashboard, My Leagues, MLC league creation, overview and six-manager lobby.
- Atomic commissioner membership/team creation, custom league/team names, manager leave/rejoin, and profile editing.
- Commissioner-only invitations: 256-bit secrets, SHA-256 hashes in Postgres, seven-day expiry, revocation and rotation. Invitation signup preserves the join destination through email confirmation.
- Database authorization and RLS: only members can read a private league; only commissioners manage its name/invitations; managers control their own team. Row locks prevent concurrent joins from overfilling a league.
- Responsive dark application shell, accessible forms, loading/error/empty states, and honest setup notices when Supabase is not configured.

**Not implemented:** persistent multiplayer drafting, player ownership/rosters, ingestion, fixtures, scoring persistence, matchups, standings, playoffs, chat or live results. The existing `/demo` is a separate **fictional, browser-only prototype**. Its picks reset on reload; it is not real multiplayer or MLC data.

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

Open `http://localhost:3000`. Without Supabase variables, the public landing/prototype still work and auth screens explain the missing configuration; no fake login or local-storage league fallback is provided.

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
3. Enable email/password signup and email confirmation. Set **Auth → URL Configuration → Site URL** to your trusted app origin. Allow your app's `/auth/confirm` callback, including its `next` query (for local development, `http://localhost:3000/**`). Use narrowly scoped production redirect URLs.
4. Replace **Auth → Email Templates → Confirm signup** with `supabase/templates/confirmation.html`. Its link must be:
   ```html
   <a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Confirm your email</a>
   ```
   Signup always supplies `RedirectTo` containing `/auth/confirm?next=...`. This exact link preserves an invitation through confirmation. The callback calls Supabase `verifyOtp`; it does not accept an unverified session or assume a particular token-hash length.
5. Configure production SMTP and appropriate Supabase email/auth rate limits. The default hosted email service is not a production mail-delivery plan.
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

The ignored `.env.local` is configured for the real development backend with the project URL, enabled modern publishable key and `http://localhost:3000` site origin; key values are not committed. Local sign-in UI and an actual hosted invalid-login response were exercised. **Successful hosted signup/email-delivery, six-manager user flow and production SMTP remain unverified.** URL allowlists, the versioned confirmation template, verified SMTP sender and delivery/rate limits still require configuration through an authorized management interface.

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

- Infrastructure follow-up: `npm ci`, TypeScript checking, **16** domain/validation tests, four PostgreSQL integration scenarios (including pre-M1 account backfill), and production builds both without credentials and with isolated local service configuration passed. `npm audit --omit=dev` reported zero vulnerabilities.
- Real Supabase Auth v2.197.0 + PostgREST v16.5 + PostgreSQL 17.11 + Mailpit: seven email-confirmed accounts, six admitted to one league, seventh denied; wrong-password errors, sign-out, persistent navigation, invite-preserving signup/confirmation, private nonmember 404s, profile/team/league edits, leave/rejoin, duplicate rejection, invitation copy/revoke/regeneration, and member/commissioner boundaries.
- Expired-session refresh: a real provider-issued 120-second access token expired; reloading the protected dashboard rotated both access/refresh tokens and retained authentication with an unexpired token.
- Actual browser surfaces at desktop and 390px mobile; mobile landing/lobby had no horizontal overflow. The credential-free production server displayed setup guidance and protected redirects; its prototype advanced to pick two and changing runs increased the score from 106 to 107.
- Database tests exercise table/RPC grants and RLS, own/co-member profile privacy, cross-league isolation, invitation format/expiry/revocation/rotation, duplicate membership, commissioner constraints, and competing joins for the final seat (exactly one admitted).
- Follow-up browser smoke used actual native Auth/PostgREST/Postgres/Mailpit with a synthetic Vercel preview environment, not a Vercel deployment: the email link used the preview origin rather than the configured production origin and preserved the invitation destination. Its token was redeemed only on the local application. A real pre-migration account had zero profiles before the forward migration and one afterward, then successfully created a league. A second email-confirmed account joined; membership persisted on reload, and the 390px lobby had no horizontal overflow.
- Local security advisors reported no issues on the disposable native database. Hosted schema/grant/constraint checks and anonymous REST/RPC denial also passed on the dedicated project; hosted advisors retain the seven reviewed warnings above. Hosted successful email delivery, preview logs and all fourteen deployed acceptance scenarios remain pending.

## Vercel project and Git connection

The locally authenticated Vercel CLI created `cricket-fantasy` (`prj_VYvlYPp8UDKDlJ2pIVGfVlpp9wah`) in existing Hobby workspace `anshbalusa-8318s-projects`. [Project dashboard](https://vercel.com/anshbalusa-8318s-projects/cricket-fantasy). Verified project settings are Next.js, Node `22.x`, and repository root. The Git link targets `anshbalusa-ui/cricket-fantasy` on GitHub with production branch `main`; other branches use previews. Vercel's default `git.deploymentEnabled=true` is unchanged, and the repository does not disable it.

The earlier ChatGPT integration project-create 403 was resolved by using the separately authenticated CLI's normal browser device flow and own credentials, not by bypassing permissions or changing the plan. Only the requested project was created/configured; no purchase, paid feature, plan change or unrelated project mutation occurred. `vercel.json` retains the Next.js build/install commands. Project/Git connection is verified; application environment variables and hosted email readiness remain separate setup work.

Configure the three environment variables above in development, preview and production using the dedicated project's actual URL/public key. Set the local development site origin to `http://localhost:3000`; set preview/production site origins to their verified HTTPS deployment origins. For previews, signup uses Vercel's system-provided `VERCEL_URL` when `VERCEL_ENV=preview` so an accidentally inherited production site URL cannot send preview users to production. Enable system environment variables. Incoming `Host`/forwarded-host headers are never trusted as the configured email origin.

Apply migrations first. In Supabase, install the confirmation template, set the canonical production Site URL, and allow the exact initial preview `/auth/confirm` callback including its query. For automatic later branch previews, review a **project/workspace-specific** redirect pattern (not a global `*.vercel.app` wildcard); the generated domain and workspace slug must come from the actual Vercel project. Keep development redirects scoped to localhost.

Deploy a **preview first** through the normal authenticated Vercel CLI/dashboard; verify its commit, READY state, origin, logs and all fourteen requested acceptance scenarios, including verified email delivery and seven distinct accounts. Connect/confirm Git integration with `main` as production and non-main branches as previews without initiating production before preview review. Public variables are embedded at build time: rebuild after changing them. Do not put authenticated responses behind shared caching; `src/proxy.ts` forwards refresh cookies and cache headers.

Production launch also requires a verified SMTP sender/provider and rate limits within its approved quota. The default hosted email service is not suitable proof of production delivery; no SMTP provider, sender domain, billing approval or recipient delivery has been verified here. Obtain approval before creating any nonzero-cost resource. Creating/linking the Vercel project does not imply production or email readiness.


## Code map

- `src/lib/auth/`, `src/lib/supabase/`: validation, server auth/actions, user-scoped typed clients and session refresh.
- `src/lib/users/`, `src/lib/competitions/`, `src/lib/leagues/`: profiles, catalogue and league queries/actions.
- `src/lib/fantasy/`: existing draft-order/scoring domain logic (`mlc-v0.1`).
- `src/app/(auth)/`, `src/app/(app)/`: auth screens and protected application routes.
- `src/components/forms/`, `src/components/leagues/`: reusable form and league UI.
- `supabase/migrations/`, `supabase/tests/`, `supabase/templates/`: schema/security, integration scenarios and email template.

Database interfaces in `src/lib/supabase/database.types.ts` track the migration. When changing the schema, regenerate with `npx supabase gen types typescript --local --schema public` in a supported local Supabase environment and review RPC/relationship types alongside callers. Schema status/settings versions and per-league teams establish the boundary for M2; no draft tables or pretend draft controls were added prematurely.

## Product documentation

[Product](docs/PRODUCT.md) · [Roadmap](docs/ROADMAP.md) · [Architecture](docs/ARCHITECTURE.md) · [Data model](docs/DATA_MODEL.md) · [Game rules](docs/GAME_RULES.md) · [UX](docs/UX.md) · [Decisions](docs/DECISIONS.md) · [Data sources](docs/DATA_SOURCES.md)

Implementation references: [Supabase Next.js SSR](https://supabase.com/docs/guides/auth/server-side/nextjs), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [local development](https://supabase.com/docs/guides/local-development/cli/getting-started), [CLI configuration](https://supabase.com/docs/guides/local-development/cli/config).
