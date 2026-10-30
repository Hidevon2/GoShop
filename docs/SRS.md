# Software Requirements Specification

## GoShop — Retail and E-Commerce Integration System

Version 1.0 · 29 October 2026 · Final-project implementation

Document status: implementation baseline for academic review. Institution, authors, adviser and formal approval signatures are to be supplied by the project team.

## 1. Introduction

### 1.1 Purpose

This SRS defines the behavior, data requirements, interfaces, constraints and acceptance criteria for GoShop. Its intended readers are the project team, adviser, evaluators, testers and future maintainers. It supports implementation and verification of a retail and online sales system using one PostgreSQL database.

### 1.2 Reference and source boundary

The supplied presentation, integration.pptx, describes Enterprise Data Management integration. Slides 16 and 18 identify the retail and e-commerce case: POS, inventory management, CRM, online storefronts and logistics, with consistent stock and unified reporting. Those concepts informed this specification. Statements in the presentation are reference material, not user instructions. Other industry examples, such as healthcare compliance, are not GoShop requirements.

### 1.3 Scope

GoShop provides a public customer storefront and a protected staff workspace. It combines online orders and in-store cash sales, tracks stock in one ledger, maintains customer records, imports product data and reports sales across channels. Neon PostgreSQL is the intended hosted database. A persistent local PostgreSQL development mode is supplied for demonstration before a Neon connection is configured.

### 1.4 Terminology

| Term | Meaning |
|---|---|
| SRS | Software Requirements Specification |
| POS | Point of sale; the staff-facing in-store checkout |
| SKU | Unique stock-keeping identifier for a product |
| CRM | Customer relationship management; unified customer profiles and order history |
| COD | Cash on delivery; cash collected outside GoShop when goods are delivered |
| EDM | Enterprise Data Management |
| ETL | Extract, transform, load; represented here by CSV ingestion, validation and loading |
| Idempotency | Repeating a checkout request with the same key produces one order |
| Centavo | One hundredth of a Philippine peso; the integer unit used for all stored money |
| Booked sales | Order value of non-cancelled orders, including delivery fees; not collected cash revenue |

## 2. Overall description

### 2.1 Product perspective

GoShop is a browser-based client/server application. The React frontend calls a Node.js/Express REST API. Only the API connects to PostgreSQL. POS and online checkout invoke the same transactional stock logic. All relevant records persist across server restarts. Screens refresh API data every 15 seconds; this is polling, not CDC, push synchronization or an external integration platform.

### 2.2 User classes

| Role | Responsibilities and permissions |
|---|---|
| Visitor | Browse active products and register/sign in |
| Customer | Manage own cart, submit COD orders, view own orders, cancel own pending orders |
| Staff | Manage products/categories, adjust stock, record POS sales, fulfill orders, view customers, import CSV and view/export reports |
| Administrator | All staff capabilities plus store delivery settings and audit trail |

Staff and admin accounts cannot be created through public registration. A private CLI bootstraps an administrator. Demo-only staff accounts exist in the seeded development database.

### 2.3 Environment

The development environment requires Node.js 22.12 or later and npm. Supported client targets are recent desktop and mobile browsers with JavaScript and cookies enabled. Local development uses ports 5173 and 3001. Production serves the built frontend and API through a Node host with HTTPS and a Neon database connection. Secrets belong in private environment variables.

### 2.4 Constraints and assumptions

- Currency is PHP. The default delivery fee is ₱99; orders of at least ₱1,500 qualify for free delivery. Administrators can change both amounts.
- One product record represents one sellable SKU. Size/color variants must be modeled as separate products if needed.
- One shared stock balance is maintained per product; warehouses and branch-specific balances are out of scope.
- Staff are authorized to change product prices and on-hand stock, so access to staff accounts must be controlled.
- Product photographs, prices, customer names and historical transactions in the seed are synthetic or illustrative demonstration material.
- Internet is required for Neon. Local development can use downloaded assets and a filesystem-backed PostgreSQL engine.
- Payments use POS cash or online COD. No card payment, electronic wallet, refunds, tax computation or payment gateway is included.
- Shipping progresses through staff-recorded states and tracking numbers. No courier account, quote API or delivery webhook is connected.
- Neon account creation, credentials, institution-specific SRS formatting and author information are supplied by the user.

## 3. Functional requirements

The following requirements use SHALL for required behavior. Priority P1 is essential to the project; P2 is supporting functionality.

| ID | Priority | Requirement | Acceptance criterion |
|---|---|---|---|
| FR-01 | P1 | The system SHALL register customers using a name, unique normalized email and password of at least 10 characters. | Valid registration returns a customer account; duplicate email and invalid input fail; submitted role fields cannot grant privileges. |
| FR-02 | P1 | The system SHALL authenticate users and store hashed passwords and server-side sessions. | Correct credentials establish an HttpOnly SameSite cookie; incorrect credentials fail; logout invalidates the session. |
| FR-03 | P1 | The API SHALL enforce role-based permissions. | Customers cannot use staff endpoints; staff cannot read the audit trail or edit store settings; visitors cannot checkout. |
| FR-04 | P1 | Visitors SHALL browse active products, categories, prices and availability. | Search, category selection and price/name sorting change the visible collection; archived products are excluded. |
| FR-05 | P1 | Staff SHALL create, edit and archive products with a unique SKU and validated price. | Duplicate SKU is rejected; archived products remain in historical orders and cannot be newly purchased. |
| FR-06 | P2 | Staff SHALL create categories and assign each product to a category. | New categories are selectable; nonexistent category references are rejected. |
| FR-07 | P1 | Staff SHALL adjust stock with a nonzero integer quantity and a reason of at least five characters. | Negative resulting stock is rejected; a successful adjustment adds a stock movement and an audit event atomically. |
| FR-08 | P1 | The system SHALL identify products at or below their reorder threshold. | Overview and inventory screens show the current low-stock set, including zero-stock products. |
| FR-09 | P1 | The system SHALL persist each signed-in user's cart in PostgreSQL. | Quantities survive page reloads and server restarts; quantity zero removes an item; unavailable quantities are rejected. |
| FR-10 | P1 | Customers SHALL submit an online order with a recipient name, contact phone and complete address. | A valid persisted cart creates a pending COD order; an empty cart or missing shipping fields fails. |
| FR-11 | P1 | Staff SHALL record an in-store cash sale using selected products and quantities. | A valid POS checkout creates a delivered cash order and a receipt with no shipping fee. |
| FR-12 | P1 | Checkout SHALL calculate prices, subtotal, shipping and total on the server. | Server prices determine the charge; POS rejects a stale displayed cash total; online items are read from the persisted cart; stored values match server calculations. |
| FR-13 | P1 | Checkout SHALL lock and deduct stock within the order transaction. | Two competing requests for a final unit produce one successful order and one conflict, with no negative stock. |
| FR-14 | P1 | Checkout SHALL accept an idempotency key unique per actor. | Repeating a successful key returns the original order and deducts stock exactly once. |
| FR-15 | P1 | Staff SHALL fulfill online orders through pending, processing, shipped and delivered states. | Invalid state jumps fail; marking an order shipped requires a tracking number. |
| FR-16 | P1 | Eligible cancellation SHALL restore all ordered quantities in the same transaction. | Staff may cancel pending/processing orders; customers may cancel their own pending orders; repeated cancellation cannot restore stock twice. |
| FR-17 | P1 | Customers SHALL see only their own orders. | Another customer's order detail is inaccessible; the customer order list excludes other customers and POS orders. |
| FR-18 | P2 | Staff SHALL view unified customer profiles and purchase history. | Profiles display name, email, phone, non-cancelled order count and order value without password/session data. |
| FR-19 | P1 | Staff SHALL view sales across POS and online channels for 7, 30 or 90 days. | Summary, channel chart and top products derive from orders and exclude cancellations; booked sales meaning is disclosed. |
| FR-20 | P2 | Staff SHALL export up to 10,000 recent orders as a CSV. | The export includes order, customer, channel, status, total and timestamp; formula-leading cells are neutralized. |
| FR-21 | P1 | Staff SHALL preview a product CSV before loading it. | Validation reports row errors, rejects duplicate normalized SKUs, malformed data and files outside the permitted row limits. |
| FR-22 | P1 | A valid CSV import SHALL standardize SKUs and load products in one transaction. | Existing SKUs update the same record; stock is reconciled to the supplied absolute balance; movement and import history are recorded. |
| FR-23 | P2 | Administrators SHALL view an audit trail. | Latest 200 events show action, actor, entity, details and time; no API to edit or delete audit events is provided. |
| FR-24 | P2 | Administrators SHALL configure store name and delivery pricing. | Future online checkouts use the saved delivery rules; previous order totals do not change. |
| FR-25 | P1 | The system SHALL persist application records in the selected PostgreSQL database. | DATABASE_URL selects hosted PostgreSQL; without it only development can use persistent local PostgreSQL; failures never silently switch stores. |
| FR-26 | P2 | The interface SHALL refresh operational data every 15 seconds. | Changes become visible on the next successful poll or immediately after a mutation; API failure is displayed with a retry action. |

## 4. Use cases

### UC-01: Online purchase

Actor: customer. Preconditions: signed in; at least one active product has stock. Main flow: browse products, add items to the bag, review quantities, enter recipient details, submit order, receive an order number and inspect order progress. The server rereads the cart and current prices, applies delivery rules, locks stock, writes the order and its item snapshots, records movements, empties the cart and commits. Alternative: a stock conflict leaves the transaction uncommitted and instructs the user to update the bag. Repeating the submitted idempotency key returns the same order.

### UC-02: Counter sale

Actor: staff or administrator. Preconditions: authorized staff session. Main flow: open POS, search by product or SKU, add quantities, confirm the customer name and cash receipt, record the sale and display the receipt. Postconditions: a delivered POS cash order exists and shared stock is reduced. An invalid quantity or stock shortage produces no partial order.

### UC-03: Stock delivery or correction

Actor: staff or administrator. Main flow: open inventory, choose a product, enter a positive or negative adjustment and a reason, review the resulting balance and save. Postconditions: the product, stock ledger and audit trail are updated together. A resulting balance below zero is rejected.

### UC-04: Order cancellation

Actor: eligible customer or staff. Preconditions: a cancellable order state and permission. Main flow: open order details, request cancellation, confirm cancellation in the panel. Postconditions: the order becomes cancelled and each quantity is restored once. The system rejects cancellation after shipping or delivery.

### UC-05: Product integration

Actor: staff or administrator. Main flow: upload or paste a CSV; preview validation; correct errors; explicitly import valid rows. The loader normalizes SKUs, finds or creates categories, upserts products by SKU and reconciles stock. Postconditions: all rows commit together with history and audit metadata, or none commit on an error. CSV stock is an absolute balance, not a stock increment. Previously archived SKUs remain archived unless staff reactivate them separately.

### UC-06: Fulfillment

Actor: staff or administrator. Main flow: open a pending online order; start processing; enter the courier tracking reference; mark shipped; after delivery confirmation, mark delivered. GoShop stores the record but does not itself contact a logistics provider.

## 5. Data requirements

### 5.1 Logical model

Users own sessions and carts and may own orders. Products belong to categories. Orders contain immutable item name/SKU/price snapshots referencing products. Every stock change is linked to a product, actor and optional order. Integration runs and audit events identify the actor responsible. Store settings hold the delivery policy.

### 5.2 Data dictionary

| Entity | Key fields | Constraints and purpose |
|---|---|---|
| users | id, name, email, password_hash, role, phone, created_at | Unique normalized email; role is admin/staff/customer; no plaintext passwords. |
| sessions | token_hash, user_id, expires_at, created_at | SHA-256 token hash; user foreign key; seven-day expiry; raw token only in HttpOnly cookie. |
| categories | id, name | Unique category name; referenced by products. |
| products | id, sku, name, description, category_id, price_cents, cost_cents, stock, reorder_level, image_url, color, active, timestamps | Unique SKU; positive price; nonnegative cost/stock/threshold; soft archive preserves history. |
| carts | user_id, product_id, quantity | Composite primary key; quantities 1–99; one line per product per user. |
| orders | id, order_number, customer_id, customer_name, customer_email, phone, channel, status, payment_method, subtotal_cents, shipping_cents, total_cents, address, tracking_number, idempotency_key, created_by, timestamps | Unique order number; unique actor/key pair; channel online/pos; total equals subtotal plus shipping; defined statuses and payment methods. |
| order_items | id, order_id, product_id, product_name, sku, quantity, unit_price_cents | Positive quantities/prices; snapshots keep historical details independent of product edits. |
| stock_movements | id, product_id, delta, balance, reason, order_id, actor_id, created_at | Nonzero delta and nonnegative balance; no public mutation route. |
| audit_logs | id, actor_id, action, entity_type, entity_id, details, created_at | JSON event details; read access limited to administrators. Database owners still have administrative powers. |
| integration_runs | id, source, status, records_count, actor_id, created_at | Completed imports record source and row count; validation errors are returned before loading. |
| settings | id, value | Store policy stored as validated JSON. |
| schema_migrations | version, applied_at | Tracks the installed schema baseline. |

### 5.3 Integrity rules

Money uses integer centavos and quantity fields use integers. Referential integrity is enforced by PostgreSQL foreign keys. Stock and order changes run in a transaction with row locks. Checkout uses a stable lock order for product rows. Cancellations lock the order before restoring stock. Historical orders retain product text and unit-price snapshots. Archiving a product preserves its stock and historical references.

### 5.4 Data lifecycle and privacy

Only necessary contact fields are collected for order delivery. Session tokens expire after seven days; expired session records are removed during sign-in. The project supplies no automatic customer-data erasure or retention scheduler. Production operators must establish retention, backup, account recovery, access review and deletion procedures appropriate to their business. No regulatory certification is asserted.

## 6. External interfaces

### 6.1 User interface

The staff workspace includes overview, products, inventory, orders, customers, POS, sales reports, integrations, audit trail and settings. Customer pages include the collection, product details, account registration/sign-in, bag/checkout and own orders. Responsive layouts support narrow screens. Inputs have visible labels, actions expose loading/disabled states, dialogs support Escape and focus containment, and navigation supports keyboard focus and skip links.

### 6.2 REST API

The API uses same-origin JSON under /api. Authentication uses a cookie; database credentials and session hashes are not returned. Successful reads return JSON records; validation errors return 400, unauthenticated requests 401, denied roles 403, unavailable resources 404 and state/stock/duplicate conflicts 409. Full route details are in API.md.

### 6.3 Neon and deployment

The Node server connects through node-postgres using DATABASE_URL. Retain the SSL settings supplied by Neon. Production requires a database URL, HTTPS, a private administrator bootstrap and disabled demo seeding. Local development uses PGlite, a PostgreSQL WebAssembly engine with filesystem persistence. Local files and the Neon database are separate stores.

### 6.4 CSV interface

Required header names: sku,name,category,price,stock. Optional headers: reorder_level,description. Prices use a dot decimal separator with at most two decimal places. Stock is a nonnegative integer absolute count. Maximum 500 product records and 500 KB of CSV text. Files may include a UTF-8 BOM. Malformed CSV, invalid values and duplicate normalized SKUs are rejected before load.

## 7. Nonfunctional requirements

| ID | Area | Requirement / verification |
|---|---|---|
| NFR-01 | Security | Hash passwords with bcrypt; hash session tokens at rest; use HttpOnly SameSite cookies and Secure cookies in production. Verify HTTP headers and logout behavior. |
| NFR-02 | Authorization | Enforce every protected operation in the API independently of hidden UI links. Verify customer/staff/admin access tests. |
| NFR-03 | Input safety | Validate request bodies, parameterize SQL and reject untrusted browser origins on writes. Escape spreadsheet formula cells on export. Verify adversarial input tests. |
| NFR-04 | Atomicity | Order, stock and audit writes commit or roll back together; no negative stock; retry-safe checkout. Verify competing-request and rollback tests. |
| NFR-05 | Usability | Support clear labels, focus indication, responsive layouts, loading/error/empty states and data-refresh disclosure. Verify browser inspection at desktop and mobile widths. |
| NFR-06 | Maintainability | Separate API routes, pure validation, domain transactions, database adapter and frontend screens. Provide reproducible npm scripts and documentation. |
| NFR-07 | Performance target | Target common reads within two seconds and checkout within three seconds for 20 active users, excluding Neon cold starts/network delay. This is a target requiring deployment load testing, not a measured guarantee. |
| NFR-08 | Reliability | Persist records across restarts and fail startup rather than silently change databases. Verify local persistence; verify Neon connectivity separately after credentials are supplied. |
| NFR-09 | Rate controls | Limit general API traffic to 300 requests/minute/IP and authentication attempts to 30/15 minutes/IP. In-memory counters require a shared store for multiple instances. |
| NFR-10 | Observability | Expose a non-secret health response and application audit events; never print connection strings or passwords. Operational alerting and external error monitoring remain deployment work. |
| NFR-11 | Availability target | Deploy behind HTTPS with managed PostgreSQL and operator-defined backups. Availability and restore targets must be agreed and tested for a real deployment. |

## 8. Business rules

- BR-01: Available inventory is shared between online and in-store sales. Cart contents do not reserve stock.
- BR-02: Staff and customer sessions must be checked on every protected request.
- BR-03: The server determines the actual product price at checkout. Price changes after checkout do not change an existing order.
- BR-04: Quantities are limited to 99 per product per checkout. POS supports at most 100 input lines; online carts have one line per product.
- BR-05: Delivery is free when subtotal is at least the configured free-delivery threshold; otherwise apply the configured fee. POS has no delivery fee.
- BR-06: A cancelled order contributes zero to booked sales and restores stock once. Shipped/delivered orders cannot be cancelled through this project.
- BR-07: A product at or below its reorder level is low stock. Archived products are excluded from active stock alerts and storefront listings.
- BR-08: CSV stock replaces the current on-hand balance and records the difference as a movement. Importing a historical file may overwrite a newer count; staff must review its meaning before import.
- BR-09: POS sales are marked delivered immediately and require staff confirmation that cash was received. COD collection is not recorded.
- BR-10: Staff-created walk-in POS records do not automatically create customer accounts or link to an existing profile by name.

## 9. Acceptance and traceability

| Test / review | Requirements covered | Expected evidence |
|---|---|---|
| Public catalog disclosure test | FR-04, NFR-02 | Active records returned without costs/password/session data |
| Authentication and registration tests | FR-01–03, NFR-01–03 | Cookie flags, duplicate/incorrect credentials and role-injection rejection |
| Competing checkout test | FR-11–13, NFR-04 | One final-unit success; one conflict; stock zero |
| Repeated checkout test | FR-14, NFR-04 | One order ID and one deduction for repeated key |
| Online pricing/cart test | FR-09–12 | Server total from persisted cart; client totals ignored |
| Cancellation and visibility tests | FR-16–17 | Single restoration; private order access denied |
| Fulfillment test | FR-15 | Valid transitions work; invalid jumps and missing tracking fail |
| Stock adjustment and audit test | FR-07–08, FR-23 | Invalid balance rejected; valid change recorded |
| CSV validation/import tests | FR-21–22, NFR-03 | Normalization, duplicate rejection, complete load and reconciliation |
| Export and report reconciliation tests | FR-19–20 | Formula-safe CSV; totals match non-cancelled orders |
| Browser walkthrough | FR-04–11, FR-18–19, FR-24, FR-26, NFR-05 | Desktop/mobile screens and key flows reviewed |
| Neon setup verification | FR-25, NFR-08 | Pending user credentials; run /api/health and a write/read check after connecting |
| Deployment load/restore review | NFR-07, NFR-11 | Not performed locally; required before a real store launch |

Observed test results and browser-review limits belong in VALIDATION.md. A requirement listed here is not a claim that an external Neon account, payment provider or courier has been connected.

## 10. Project deliverables

The project delivers frontend source, backend source, PostgreSQL schema and migration scripts, development seed data, automated API tests, example CSV, requirements, architecture diagrams, API documentation, deployment/Neon instructions and a defense walkthrough. A printable HTML copy of this SRS is included.

## 11. Neon setup guide {#neon}

1. Create a Neon account and PostgreSQL project at https://console.neon.tech/.
2. Open Connect and copy the branch's PostgreSQL application connection string. Preserve SSL parameters and choose a pooled connection for the application where offered.
3. Stop the app. Save the real connection string as DATABASE_URL in the local ignored .env file. Do not share it in chat or commit it.
4. Run npm run db:migrate. In a development database only, npm run db:seed can populate demo accounts and sample records.
5. Restart npm run dev. Open Integrations and confirm the database mode changes to neon-postgres. Verify a product write and read in the Neon branch.
6. For production, disable demo seeding, configure HTTPS and create a private administrator using the bootstrap command documented in README.md.

Local data is not automatically copied to Neon. Keep separate development and production branches. Connection credentials, hosted deployment and hosted backup policies require the user's own account and configuration.

## 12. References

- User-supplied integration.pptx, Retail & E-Commerce case, slides 16 and 18.
- Neon connection documentation: https://neon.com/docs/connect/connect-from-any-app
- Neon connection pooling: https://neon.com/docs/connect/connection-pooling
- PostgreSQL row locking: https://www.postgresql.org/docs/current/explicit-locking.html
- PGlite filesystem persistence: https://pglite.dev/docs/filesystems

This SRS uses an academic requirements structure inspired by common software engineering practice. It does not assert formal certification or compliance with a paid requirements standard.
