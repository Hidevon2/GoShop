# GoShop

A complete retail and e-commerce final project: React storefront and staff workspace, Node.js REST API, and a shared PostgreSQL database. Built around the retail integration case in `integration.pptx`.

## Start locally

Requires Node.js 22.12+ and npm. From this directory:

```powershell
npm install
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
```

Open [GoShop](http://localhost:5173). A persistent local PostgreSQL database is created in `.data/goshop`. No database installation is needed for local development. The API runs at port 3001 and Vite at 5173. Leave both running through `npm run dev`.

The first development run seeds **synthetic demonstration data** when `SEED_DEMO=true`. Existing data is preserved. These accounts all use `GoShopDemo!2026`:

| Role | Email | Access |
|---|---|---|
| Administrator | admin@goshop.local | All staff tools, settings and audit trail |
| Staff | staff@goshop.local | POS, products, stock, orders, CRM, imports and reports |
| Customer | customer@goshop.local | Storefront, cart, own orders and pending-order cancellation |

Choose a demo role on the sign-in screen to fill credentials. You can also register a new customer. Change `DEMO_PASSWORD` **before the first seed** to use a different password; later changes do not reset existing passwords.

## Connect Neon

1. Create your own account at [Neon](https://console.neon.tech/), then create a PostgreSQL project and development branch.
2. Select **Connect** and copy the PostgreSQL connection string. Use the pooled connection for an application server and retain the provided SSL parameters.
3. Stop GoShop. In the ignored local `.env`, set `DATABASE_URL` to that string. Keep this value private; never put it in a `VITE_` variable or commit it.
4. Run `npm run db:migrate`. For a separate development/demo database, run `npm run db:seed` if you want sample data.
5. Restart `npm run dev`. Open **Integrations** or `/api/health` to verify the database mode reads `neon-postgres`.

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@YOUR-POOLER-HOST/neondb?sslmode=require&channel_binding=require
```

The connection string above is a placeholder. Supply your own Neon connection string in the private, ignored `.env` file. Switching databases does not copy existing local records. Start with a fresh Neon database or plan an explicit data migration. Neon credentials are used only by the server. See `docs/VALIDATION.md` for the recorded live Neon verification.

Official references: [Connect Neon](https://neon.com/docs/connect/connect-from-any-app), [connection pooling](https://neon.com/docs/connect/connection-pooling).

## What works

- Account registration, bcrypt password hashes, server-side cookie sessions and role-based API permissions.
- Product categories, product create/edit/archive, search and category filters.
- Inventory adjustments with reasons, low-stock thresholds and a stock movement ledger.
- In-store cash POS with product search, a sale bag, a receipt and stale-price confirmation protection.
- Public storefront, product details, a persisted customer cart and cash-on-delivery checkout.
- Transactional checkout with stock locks, server-calculated prices and idempotency keys.
- Order processing, tracking numbers, shipping/delivery states and cancellation with stock restoration.
- Customer profiles and unified sales reports for POS and online orders.
- Validated product CSV preview/import, SKU standardization, stock reconciliation and audit logs.
- Admin store name/delivery settings and order CSV export protected against spreadsheet formulas.
- Responsive screens, keyboard focus, loading/error/empty states and 15-second data refresh.

## Documentation

- [Software Requirements Specification](docs/SRS.md), with requirements, use cases, data dictionary and acceptance criteria.
- [Architecture and database relationships](docs/ARCHITECTURE.md).
- [API contract](docs/API.md).
- [Project defense walkthrough](docs/DEMO-GUIDE.md).
- [Validation record](docs/VALIDATION.md).
- [Asset credits](docs/ASSET-CREDITS.md).

The SRS is delivered separately as a Word document, GoShop-SRS.docx. It is not part of the application interface. The Markdown file in docs/SRS.md remains the editable requirements source.

## Verify

```powershell
npm test
npm run build
```

Tests use isolated in-memory PostgreSQL, never the configured Neon database. They cover authorization, CSRF origin checks, competing checkouts, retry safety, cancellation, fulfillment, CSV validation, exports and report reconciliation. See `docs/VALIDATION.md` for the latest observed results.

`npm run build` checks TypeScript and creates the frontend in `dist/`. To serve the built frontend and API together:

```powershell
npm run build
npm start
```

Open [built GoShop](http://localhost:3001). Do not run another API process against the same local PGlite directory. Stop development before running migration or seeding CLI commands locally.

## Production deployment

For Vercel hosting, use [the Vercel deployment guide](docs/VERCEL.md). The repository includes a Vite build, a serverless Express API entry point and routing configuration.

Use a Node.js host with HTTPS and Neon PostgreSQL. This project is a runnable final-project implementation; external payment/courier services are not configured.

1. Install with `npm ci`, build with `npm run build`, then use `npm start` as the service command.
2. Set `NODE_ENV=production`, `SEED_DEMO=false`, a real `DATABASE_URL`, `HOST=0.0.0.0`, and `APP_ORIGIN=https://your-app.example`. The host typically supplies `PORT`.
3. If and only if your platform places the server behind one trusted reverse proxy, set `TRUST_PROXY=1`. Confirm the platform’s proxy topology before changing this setting.
4. Run `npm run db:migrate` against the production database.
5. Set `INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_EMAIL`, and `INITIAL_ADMIN_PASSWORD` in private environment variables, then run `npm run db:admin` once. The password must have at least 12 characters. Remove these bootstrap variables after success. The script refuses to modify an existing account.
6. Confirm HTTPS cookies, access restrictions, stock consistency, backup retention and restore procedures in the deployed environment.

Production refuses to start without a database URL and refuses demo seeding. Database errors do not silently fall back to local storage. Do not deploy a database containing the known demo accounts.

Production hardening still needed for a real store: payment collection and refund reconciliation, verified courier webhooks, password reset/email verification, distributed rate limiting for multiple instances, observability, backup restore drills and load testing. No PCI DSS or GDPR certification is claimed.

## Repository layout

```text
src/                 React application and responsive styles
server/              Express API, domain logic, PostgreSQL adapter and schema
tests/               HTTP integration and transactional correctness tests
public/products/     Local demonstration product photography
public/samples/      Example product CSV
docs/                Requirements, architecture, API and demo guide
scripts/             Bootstrap, documentation and asset helpers
```

Money is stored as integer centavos. Completed POS cash sales and non-cancelled online orders appear in booked sales reports; COD payment collection is not tracked. All stock changes and order writes run through the shared backend database.
