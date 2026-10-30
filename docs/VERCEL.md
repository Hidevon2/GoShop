# Deploy GoShop to Vercel

GoShop uses a Vite frontend and one Express API function on Vercel. Both use the same hostname. The function connects to the existing Neon PostgreSQL database through its pooled connection string. The local Node server remains available through `npm run dev` or `npm start`.

## Project settings

- Import `Hidevon2/GoShop` from GitHub, or link the directory with Vercel CLI.
- Framework: Vite. Root directory: project root.
- Build command: `npm run build`. Output directory: `dist`.
- Select a supported Node.js version that meets the package requirement.
- The checked-in configuration routes `/api/*` to `api/handler.js`, preserves static assets, and returns the React entry for frontend routes. The API region is Singapore (`sin1`).

## Private environment settings

Set these on the Vercel project before deploying:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Full private pooled Neon PostgreSQL URL, including SSL parameters. |
| `NODE_ENV` | `production` |
| `SEED_DEMO` | `false` |
| `TRUST_PROXY` | `1`, for the Vercel proxy in front of the API. |
| `APP_ORIGIN` | The exact HTTPS production website origin, without a trailing slash. |

Use Vercel environment settings or CLI standard input. Never commit these values, place the database URL in a `VITE_` variable, or include it in a deployment log. `.vercelignore` excludes private configuration, local databases and work artifacts from uploads.

## Database and accounts

Run `npm run db:migrate` against the intended database before releasing a schema change. The Vercel request handler does not migrate or seed on a cold start. Its shared PostgreSQL pool uses Vercel's connection lifecycle helper.

The currently configured Neon database contains classroom demonstration products and orders. Disabling seeding prevents new seed runs; it does not remove existing demonstration accounts or records. For a real retail deployment, use private account credentials and the production preparation in README.md.

## Verify a deployment

1. Open `/api/health`; require `status: ok` and `database: neon-postgres`.
2. Open the storefront, a direct `/login` route and a product image. Confirm that the API returns JSON and assets return the expected content type.
3. Sign in over HTTPS, inspect the staff dashboard, and confirm that the session cookie is HttpOnly, Secure and SameSite=Lax.
4. Check a rejected foreign-origin write and logout. Confirm that browser requests remain on the same hostname.

Rate counters are per function instance. Public hosting does not establish load capacity, distributed rate limiting, payment processing, courier integration or backup restoration.

Official references: [Vercel routing configuration](https://vercel.com/docs/project-configuration/vercel-json) and [database pool lifecycle](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package).
