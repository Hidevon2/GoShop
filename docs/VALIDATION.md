# Validation record

Date: 29 October 2026. Environment: Windows, Node.js v25.2.1. These results apply to the local project and isolated test databases.

## Observed checks

- Initial production frontend build: passed TypeScript and Vite compilation. A bundle-size warning prompted splitting chart and React dependencies into separate chunks; a final build follows that change.
- API integration suite: 16/16 passed after correcting a test's expected guest status from 403 to 401. The API already returned the appropriate unauthenticated status.
- Dependency audit after updating csv-parse to a patched version: 0 vulnerabilities reported by npm.
- HTTP smoke checks: API health, frontend entry, storefront route, sign-in route, transformed frontend module, printable SRS and a local product image returned HTTP 200.
- Seeded administrator login succeeded. The dashboard returned 48 sample orders, 12 products, 3 low-stock products and 7 customers.
- Impeccable mechanical source detector: no findings (`[]`).

## API behaviors exercised

The suite checks public catalog data disclosure, role permissions, cookie flags, incorrect login, registration role injection, duplicate email, foreign-origin writes, final-unit competition, simultaneous idempotent retries, persisted-cart pricing, cancellation/restoration, customer order privacy, fulfillment transitions, tracking requirements, invalid stock adjustments, audit records, CSV normalization/duplicate rejection/loading, hostile headers, spreadsheet-formula escaping, report reconciliation and logout invalidation.

A separate filesystem persistence test is included to close and reopen an isolated PostgreSQL data directory and verify a committed record survives. Final counts are recorded below after the final test run.

## Verification limits

Browser automation was attempted twice through the available in-app browser surface. Both requests returned `transport closed before response`. Consequently no rendered desktop/mobile screenshots, interactive browser walkthrough or visual accessibility certification is claimed. Responsive breakpoints and dialog focus behavior were inspected in source. Human browser review is still needed.

At the initial 29 October verification, a real Neon connection was not available. The automated regression suite used PGlite PostgreSQL. The later live Neon verification is recorded below; it does not imply that the entire regression suite was run against the cloud database.

No hosted deployment, load test, backup-restore drill, payment processing or external courier integration was performed. Performance numbers in the SRS are targets, not measured claims.

## Final run

- `npm run check`: **19/19 tests passed**, followed by successful TypeScript checking and Vite production build.
- New checks cover stale POS cash totals, chart/summary calendar-day reconciliation, and filesystem persistence after close/reopen.
- Build chunks: application 224.05 KB, charts 379.28 KB, React/router 463.42 KB before gzip. No chunk-size warning remained.
- Independent finish review: **SOURCE REVIEW PASS** after all six material source findings were repaired. See REVIEW.md. This is explicitly not a rendered/browser acceptance pass.

## Live Neon connection verified on 30 October 2026

The owner created the GoShop Neon project in Singapore and saved its pooled PostgreSQL connection string in the private, ignored `.env` file. No credentials are included in this record.

- Connected through the application's `pg` adapter and applied schema version 1 successfully. All 12 GoShop tables were present.
- Loaded the configured classroom demonstration seed into the new cloud database: 12 products, 6 categories, 9 users and 48 synthetic orders. Counts were confirmed after closing and reopening the database connection.
- Inserted and read a unique category inside a transaction, then rolled it back and confirmed that no probe row remained.
- The running API returned `{ "status": "ok", "database": "neon-postgres" }` from `/api/health`.
- Public product reads, concealed product costs, anonymous dashboard rejection, administrator sign-in, dashboard reads and logout passed against the running API.
- The frontend entry returned HTTP 200, and its `/api/health` proxy confirmed the same live Neon adapter.
- Restricted the development backend watcher to `server/` after unrestricted dependency watching repeatedly restarted the process on this Windows environment. The updated `npm run dev` started the API and Vite successfully.

The local `.data/goshop` store remains separate and was not transferred or erased. The cloud records are demonstration data. GoShop is running locally with Neon persistence; no public website deployment, browser interaction acceptance, load test or backup restoration is claimed.
