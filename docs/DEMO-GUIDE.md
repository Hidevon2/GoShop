# GoShop project defense walkthrough

Allow 8–12 minutes. Start with `npm run dev`. Use synthetic demo data only. The credentials and startup instructions are in README.md.

1. **Explain the problem.** A retail business can have one stock count in POS and another online. GoShop uses a shared PostgreSQL database and one transactional backend for both channels. Relate this to the retail case in slides 16/18 of integration.pptx.
2. **Show the architecture.** Open ARCHITECTURE.md and the SRS. Explain React, the REST API, PostgreSQL and roles. Point out that the browser never receives a database password.
3. **Sign in as administrator.** Use the Admin demo button, then Sign in. Review total sales, channel chart, recent orders, best sellers and the low-stock docket. Explain that the figures are synthetic booked order values and include delivery fees.
4. **Demonstrate POS.** Note an item's stock in Inventory. Open Point of sale, add that product, confirm cash and record a sale. Show the receipt and verify stock decreased. Explain that the price and stock are validated server-side.
5. **Demonstrate online checkout.** Sign out and sign in as the demo Customer. Browse the storefront, add a product, open the bag, enter demo shipping information and place the COD order. No money is charged by the app. Show the pending order.
6. **Prove stock restoration.** Note the new online order and stock deduction. Cancel the customer's pending order. Return to Inventory as admin and show that quantity was restored. Explain the order lock prevents double restoration.
7. **Show fulfillment.** Open another pending order as staff/admin. Start processing, enter a demo tracking number and mark shipped, then delivered. Explain that this is manual logistics recording, not an actual courier API.
8. **Show data quality.** In Integrations download the example CSV. Validate an invalid negative price or repeated SKU. Show row-specific rejection. Replace it with the valid sample, validate and import. Verify the catalog, stock movement ledger and import history.
9. **Show governance.** Open Audit trail as admin. Identify the actor, action, entity and details for the stock/import/order event. Sign in as Staff to demonstrate that audit/settings links are absent and API permissions are separately enforced.
10. **Show integration outputs.** Open Sales reports, switch periods, compare online/in-store sales and export orders as CSV. Open a customer profile to show the shared order history.
11. **Explain Neon.** If not yet configured, show the local database indicator honestly. Follow the Neon guide before claiming a live Neon connection. After configuration, show Integrations /api/health and verify a write in the selected Neon branch.
12. **Close with evidence.** Run `npm test` and `npm run build`. Explain the competing-checkout, idempotency and cancellation tests. Use SRS requirement IDs to connect those tests to the stated behavior.

## Likely evaluator questions

**Why one database?** It provides a single authoritative stock balance and consistent cross-channel reports. The presentation's integration principle is implemented through shared APIs and transactions.

**What if two shoppers buy the last unit?** Each checkout locks products in a stable order. The second transaction sees the updated balance and fails cleanly if stock is insufficient. A database check also rejects negative stock.

**What if the user double-clicks checkout?** A per-actor idempotency key and actor lock make the retry return the existing order instead of creating another deduction.

**Why not trust the price sent from the browser?** A user can edit browser requests. GoShop reads actual product prices from the database and calculates the total on the server.

**Does a cart reserve stock?** No. Availability is checked when the cart is changed and again inside checkout. This avoids abandoned carts holding inventory indefinitely.

**How does the import demonstrate ETL?** It extracts a CSV, normalizes SKUs, validates data, rejects duplicates and then transactionally loads unified product records. The stock reconciliation and audit trail make the load explainable.

**Does the system process card payments or connect to couriers?** No. This version uses cash/COD and manually entered fulfillment/tracking. Real payment/courier credentials, verification and reconciliation are future integrations.

**Is this formally compliant with GDPR/PCI DSS?** No certification is claimed. The project demonstrates role access, password hashing, controlled data access and audit events. Formal compliance requires a separate organizational and technical assessment.
