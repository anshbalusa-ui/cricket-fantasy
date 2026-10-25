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
| D009 | Next.js/TypeScript with Supabase Auth/Postgres; Vercel deployment target | Pragmatic stack for web + multiplayer | Dedicated Free backend provisioned; frontend creation blocked by Vercel 403 |
| D010 | Do not copy Sleeper assets or pretend draft fantasy is unprecedented | Respect IP; differentiate on experience | Accepted |
| D011 | User-scoped Supabase SSR clients plus RLS and transactional league RPCs | Keep private reads and commissioner/member mutations enforceable in the database without service keys | Locally tested; hosted RLS/grants verified with seven intentional RPC advisor warnings |
| D012 | Hash-only, expiring, rotating invitations; no pre-join league preview | Sharing convenience without exposing private league details or retaining raw credentials | Implemented and locally verified in M1 |
| D013 | Pin Vercel/CI to Node 22.x; use only provider-generated preview origins for preview email callbacks | Avoid untested runtime upgrades and production-directed preview confirmations without trusting request headers | Locally verified; hosted frontend creation returns 403 through the accessible plugin |

Changes to accepted or experimental game rules should be documented here and versioned in scoring tests.
