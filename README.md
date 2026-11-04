# Cricket Fantasy

Free, private, season-long fantasy cricket. Original dark sports interface; real multiplayer drafting and a complete **2026 MLC historical replay**. No wagers, entry fees or monetary prizes. No copied Sleeper assets.

**Website:** [cricket-fantasy-two.vercel.app](https://cricket-fantasy-two.vercel.app).

## What works

- Genuine Supabase signup/email confirmation, password sign-in/out, profile editing, cookie sessions and self-service delivered-email password recovery.
- Persistent private leagues, custom clubs, hash-only expiring/rotating invitations and atomic six-manager capacity. Membership/commissioner boundaries are enforced by RLS and server RPCs.
- **6 managers × 15 picks = 90-pick snake draft.** Server turn/deadline/expected-pick validation, exclusive ownership per league, role feasibility, persisted board/history, actual timeout auto-picks and reconnect snapshots.
- **11 starters + 4 bench:** 1 WK, 2 BAT, 2 BOWL, 2 ALL, 4 FLEX. Review/save an owned eligible XI, carry it forward, and keep opponents' open selections private until lock.
- **102 real source players, 34 historical matches, 754 recorded appearances and `mlc-v0.1` point breakdowns.** Player search/profiles, franchise identity, recorded runs/wickets and readable per-match scoring ledger. Fantasy eligibility is explicitly sourced/derived, not a complete official-position dataset.
- Seven published fixture windows, explicit commissioner **Lock & replay**, actual-appearance averages, five regular head-to-head rounds, standings, top-four semifinals/final and persisted champion. Full numeric precision decides results; only display rounds.
- Original reusable visual foundations, compact desktop sidebar/mobile contextual navigation, dense player rows, keyboard/focus support and actual loading/empty/error/reconnect/success behavior.

This is **historical**, not a live feed or projected-score service. `/practice` explains the actual format. `/demo` is separately labeled fictional, browser-only three-round practice; its ratings/picks are not real data or multiplayer and reset on reload.

## Hosted readiness — important limit

The existing Supabase backend is deployed and audited; the existing Vercel project is Git-linked/configured. **Production email delivery and a full hosted six-person onboarding rehearsal are not claimed complete.** Normal local Auth/email/browser acceptance is recorded below, not passed off as hosted testing.

Supabase's [default sender](https://supabase.com/docs/guides/auth/auth-smtp) is development-only: organization-team recipients, currently **2 messages/hour**, no delivery SLA. No custom SMTP sender/ordinary-recipient delivery was verified. Configure an existing verified SMTP provider/sender and approved quotas before inviting ordinary friends. Do not disable confirmation, admin-confirm fake users or purchase an upgrade to manufacture acceptance. An owner who needs access can use the real **Forgot your password?** flow on the website; no temporary credential file or privileged app impersonation is required.

Leaked-password protection also remains a provider warning: [Supabase documents it as Pro-only](https://supabase.com/docs/guides/auth/password-security). This task does not change the Free/Hobby plans.

## Local setup

Node **22.x**, npm and the committed lockfile:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

| Public variable                        | Value                                                                       |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Project/API URL                                                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Active publishable key; local anon JWT also supported                       |
| `NEXT_PUBLIC_SITE_URL`                 | Trusted exact app origin, e.g. `http://localhost:3000`; HTTPS in production |

Never put management tokens, database/SMTP passwords, service-role or privileged feed keys in public variables, browser code or git. The app uses each signed-in user's session. Without Supabase config, public information/practice work and auth reports missing configuration; there is no fake login/local-storage league fallback.

### Local Supabase

With a supported Docker/Podman environment:

```sh
npx supabase start
npx supabase status
```

Use the printed local API/public key and email inbox. Source migrations include the real historical catalog and gameplay schema, not just season labels. `npx supabase db reset` is a deliberate **local-only destructive reset**. Do not use it on valuable/hosted data. Docker was unavailable on the implementation machine; actual acceptance instead used native Auth/PostgREST/PostgreSQL/Mailpit.

### Existing hosted project

| Setting           | Value                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------- |
| Supabase          | `cricket-fantasy` / `irdolhsdemjugrsgfuuc`, `us-west-1`, existing Free project        |
| API               | `https://irdolhsdemjugrsgfuuc.supabase.co`                                            |
| Vercel            | `cricket-fantasy` / `prj_VYvlYPp8UDKDlJ2pIVGfVlpp9wah`                                |
| Workspace         | `anshbalusa-8318s-projects`, existing Hobby plan                                      |
| Framework/runtime | Next.js, Node 22.x, repository root                                                   |
| Git               | `anshbalusa-ui/cricket-fantasy`; `main` production, other branches protected previews |

Only these existing resources are used. A Free auto-pause was restored normally; it was not a missing-plugin-permission problem or a paid upgrade. The local Vercel CLI remains authenticated and can access this exact project even when the ChatGPT Vercel integration lacks permission.

Five applied migration versions match source:

```text
20261024000000_m1_private_leagues
20261024000001_backfill_existing_profiles
20261104000000_cricket_catalog
20261104000001_playable_leagues
20261104000002_catalog_read_models
```

The three new files were exercised locally, then applied to the existing hosted project. Guarded updates reconciled only MCP-generated migration version metadata to source filenames; no unrelated migrations or application data were rewritten. **All 24 public tables have RLS**; the catalog summary view is `security_invoker`; source counts and fifteen exposed RPCs' identity/search-path/execution grants were inspected directly. Real anonymous table/view reads and draft mutation returned HTTP 401/`42501`. Never point the destructive test harness at this project.

Hosted advisors intentionally retain **15 authenticated SECURITY DEFINER findings** (the original seven league RPCs plus eight gameplay/read RPCs), not zero warnings. All deny anonymous/PUBLIC execution, fix the search path and check caller/league authority. Private mutation helpers/profile trigger are not client-callable. See [the security matrix](docs/ARCHITECTURE.md#rpc-security-matrix). The separate leaked-password warning is documented above.

Inspect migration history before any CLI push:

```sh
npx supabase login
npx supabase link --project-ref irdolhsdemjugrsgfuuc
npx supabase migration list --linked
npx supabase db push
```

Do not blindly replay the base migration or overwrite published migrations.

## Auth URLs, environments and email

Current hosted Auth settings were read back through the authenticated Supabase CLI into an isolated private temporary configuration, not pushed from the development config. Email signup is enabled, confirmation required, and Site URL is `https://cricket-fantasy-two.vercel.app`.

Allowed callback destinations:

```text
http://localhost:3000/auth/confirm**
http://127.0.0.1:3000/auth/confirm**
https://cricket-fantasy-two.vercel.app/auth/confirm**
https://cricket-fantasy-*-anshbalusa-8318s-projects.vercel.app/auth/confirm**
```

The normal default mailer uses PKCE: open the confirmation/recovery link in the **same browser and exact origin** that requested it. Local/custom-SMTP installations can use `supabase/templates/confirmation.html` and token-hash verification. Code and token-hash credentials are mutually exclusive; both preserve only a validated relative destination, including invitations. The default Free mailer previously rejected custom-template edits with HTTP 400, so its template/confirmation were retained rather than bypassed.

All three public variables exist in Vercel **development/preview/production**. The active modern publishable key was securely obtained/read back and matches the configured key. Development Site URL is localhost; production is canonical; previews use only Vercel's generated `VERCEL_URL`, never incoming Host headers. Do not push local `supabase/config.toml` to hosted: its localhost/template values are development settings. Public-variable changes require a rebuild.

## Data, imports and corrections

Cricsheet JSON is [ODC-BY 1.0](https://opendatacommons.org/licenses/by/1.0/), with original raw files, archive/file checksums, stable registry IDs and visible attribution. The committed manifest publishes exact matches/rounds/eligibility policy. See [DATA_SOURCES.md](docs/DATA_SOURCES.md) for the two independent scorecards and twelve manually calculated totals.

```sh
# Validate the committed source snapshot
npx tsx scripts/import-cricket.ts

# Authorized operator, private connection only
DATABASE_URL=... npx tsx scripts/import-cricket.ts --apply
```

Two identical imports left all nine normalized-table fingerprints/counts unchanged. Corrections with stable identities upsert atomically; structural identity/eligibility/window changes need reviewed forward migrations. Do not regenerate the published seed with `--write-migration`. After approved point/stat corrections, commissioners recalculate scored rounds from frozen XIs. Already advanced bracket identities remain frozen, not silently repaired/redrawn.

The server clock is authoritative; expired turns resolve when a member checks/reconnects. No always-on offline timer or live ingestion worker is claimed. Eligibility and schedule/averaging fairness remain experimental alpha validation topics.

## Verification

Release checks passed: TypeScript/Next route generation, **31 unit tests**, **5 PostgreSQL integration scenarios**, the optimized production build and `npm audit --omit=dev` (**0 vulnerabilities**). The database scenarios include atomic joins, private/commissioner authorization, the full 90-pick draft, lineup locks, all seven scoring rounds and champion recalculation.

```sh
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

Database scenarios require a **dedicated disposable PostgreSQL 17 superuser database named exactly `cricket_fantasy_test` on loopback**:

```sh
createdb cricket_fantasy_test
TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/cricket_fantasy_test npm run test:db
```

The harness refuses other names/non-local hosts, drops/recreates only that test database's public/private schemas and uses minimal SQL auth fixtures for policy testing. Those fixtures are **not** the application's Auth implementation. GitHub Actions supplies fresh PostgreSQL 17; never tunnel the harness to hosted data.

Exercised runtime acceptance used **real native Supabase Auth v2.197.0, PostgREST v16.5, PostgreSQL 17.11 and Mailpit**:

- Seven ordinary signup/email-confirmed/password-login accounts; no admin-confirmed test success. Actual PKCE confirmation, signout/login, invitation continuation and delivered-email password recovery/new-password login.
- Two six-manager HTTP drafts completed **90 exclusive picks / 15 per squad**. Same-turn race admitted one and rejected a stale request; cross-league ownership remained independent. A real 15-second expiry saved an auto-pick, synced without reload and persisted on reconnect.
- Local XI edits survived refresh; saves persisted; foreign ownership and non-commissioner replay were denied; locked edits failed. One full season completed **7 rounds, 18 matchups and 396 XI contributions**, with a persisted champion and identical full recalculation. Recalculation during an active season was also exercised.
- Twelve actual protected surfaces at **320/390/768/1440px**: **48** page/panel overflow checks passed. Ten initial mobile/desktop WCAG-tagged axe scans reported no violations; focused follow-up corrected group semantics and dense-role overlap. Keyboard tab reveal, all 90 board cells and all nine match-audit rows were exercised. Automated checks are not WCAG certification.
- The dedicated hosted project's real schema, active key, callback policy, grants/RLS and anonymous denial were checked. **Authenticated hosted six-manager/email acceptance was not fabricated from local results or management access.**

## Code map

- `src/lib/auth`, `users`, `leagues`, `supabase`: identity, persistent private league management and user-scoped typed access.
- `src/lib/fantasy`, `ingestion`, `catalog`, `gameplay`: pure domain rules, provider parsing, source read models and authoritative league DTO/actions.
- `src/components/ui`, `application`, `fantasy`, `catalog`, `gameplay`: reusable original interface and real sports surfaces.
- `data/cricket/mlc-2026`, `scripts/import-cricket.ts`: licensed reproducible source snapshot/operator pipeline.
- `supabase/migrations`, `tests`, `templates`: schema/security, isolated policy/concurrency/season scenarios and email template.
- `public/licenses`: Cricsheet ODC-BY, Manrope OFL, Lucide ISC/Feather MIT notices. Stumps mark/avatars are original.

[Product](docs/PRODUCT.md) · [Roadmap](docs/ROADMAP.md) · [Architecture](docs/ARCHITECTURE.md) · [Data model](docs/DATA_MODEL.md) · [Rules](docs/GAME_RULES.md) · [UX](docs/UX.md) · [Decisions](docs/DECISIONS.md) · [Data sources](docs/DATA_SOURCES.md)
