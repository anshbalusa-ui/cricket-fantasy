# Contributing

## Workflow

- Keep changes small and tie them to a roadmap milestone / issue.
- Work in branches and open PRs once the initial foundation is in place.
- Update docs when behavior or fantasy rules change.
- Prefer pure, well-tested scoring functions over UI logic.
- Do not include real-money features, secrets, scraped proprietary data, or unlicensed images.

## Quality checks

Use Node 22.x and `npm ci`, then run `npm run typecheck`, `npm test`, `npm run build`, and `npm audit --omit=dev`. Database changes also require `npm run test:db` against the disposable loopback database described in README (the harness deletes its test schemas and rejects non-local hosts). Review grants, RLS, cross-league privacy and concurrent mutations. Use new forward migrations for existing installations; do not rewrite applied migrations or run destructive tests against hosted data. CI has separate application and PostgreSQL jobs. Historical or fictional data must be labeled as such.

## Source attribution

Any Cricsheet-based dataset/code path must preserve the provider's required attribution and source identifiers. Do not commit bulk data until licensing and repo-size requirements are reviewed.
