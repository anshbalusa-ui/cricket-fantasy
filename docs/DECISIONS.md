# Architecture / product decision log

| ID | Decision | Reason | Status |
| --- | --- | --- | --- |
| D001 | Prioritize private season-long fantasy, not daily contests | Draft + rivalry + retention is our core thesis | Accepted |
| D002 | Free leagues, no wagering or monetary prizes | Focus on social product and wide accessibility | Accepted |
| D003 | MLC as first league, others in data model | Manageable initial scope; IPL expansion path | Accepted |
| D004 | Mobile-first web before native apps | One codebase and shareable links | Accepted |
| D005 | Six managers, ten draft picks each, eight starters | A clear initial testing configuration; subject to player pool validation | Provisional |
| D006 | Snake draft with exclusive per-league player ownership | Traditional league fantasy behavior | Accepted |
| D007 | Average a starter's eligible match points within each fantasy round | Reduce extra-fixture advantage; must be historical-tested | Experimental |
| D008 | 2026 historical MLC replay before live stats | Build deterministic quality while sourcing a live provider | Accepted |
| D009 | Next.js/TypeScript with Supabase Auth/Postgres; Vercel deployment target | Pragmatic stack for web + multiplayer | Existing Free/Hobby projects configured; automatic preview and CI verified; hosted positive acceptance/production SMTP tracked separately |
| D010 | Do not copy Sleeper assets or pretend draft fantasy is unprecedented | Respect IP; differentiate on experience | Accepted |
| D011 | User-scoped Supabase SSR clients plus RLS and transactional league RPCs | Keep private reads and commissioner/member mutations enforceable in the database without service keys | Local authorization/concurrency scenarios pass; actual hosted RPC definitions/grants and anonymous denial audited; seven intentional warnings retained |
| D012 | Hash-only, expiring, rotating invitations; no pre-join league preview | Sharing convenience without exposing private league details or retaining raw credentials | Implemented and locally verified in M1 |
| D013 | Pin Vercel/CI to Node 22.x; use only provider-generated preview origins for preview email callbacks | Avoid untested runtime upgrades and production-directed preview confirmations without trusting request headers | Next.js/Node 22, system-env exposure, automatic preview and CI verified; exact-origin PKCE requirement documented |
| D014 | Original shared dark consumer UI with local Manrope, Lucide and distinct mobile/desktop navigation | Give cricket leagues a coherent sports identity without copied assets, external fonts or a second component convention | Implemented; public/private responsive, interaction and accessibility smoke verified; authenticated hosted league acceptance tracked separately |
| D015 | Support standard PKCE and token-hash email confirmation as separate active protocols | Keep default hosted mail usable on Free while retaining the local/custom-SMTP template; reject ambiguous credentials | Default-template PKCE exercised against actual native Auth/Mailpit; hosted owner confirmation/sign-in recorded; production SMTP and full hosted multi-manager rehearsal remain gates |

Changes to accepted or experimental game rules should be documented here and versioned in scoring tests.
