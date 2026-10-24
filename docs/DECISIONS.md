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
| D009 | Next.js/TypeScript plus planned Supabase and Vercel | Pragmatic stack for web + multiplayer | Accepted |
| D010 | Do not copy Sleeper assets or pretend draft fantasy is unprecedented | Respect IP; differentiate on experience | Accepted |

Changes to accepted or experimental game rules should be documented here and versioned in scoring tests.
