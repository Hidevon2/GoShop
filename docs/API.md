# REST API contract

Base path: `/api`. Bodies and responses use JSON unless the endpoint exports CSV. Use the session cookie returned by login. Writes from browsers must use the same origin or configured APP_ORIGIN. All money fields are integer centavos, unless the CSV interface explicitly specifies peso decimals. No bearer database credential belongs in client requests.

| Method | Path | Access | Request / result |
|---|---|---|---|
| GET | /health | Public | `{status,database}` after a database probe |
| GET | /config | Public | Store name, PHP delivery policy, database mode and demo-mode flag |
| POST | /auth/register | Public | `{name,email,password,phone?}` → customer profile and cookie |
| POST | /auth/login | Public | `{email,password}` → profile and cookie |
| GET | /auth/me | Signed in | Current `{id,name,email,role,phone}` |
| POST | /auth/logout | Public | Invalidate provided session and clear cookie |
| GET | /categories | Public | Category array |
| POST | /categories | Staff/admin | `{name}` → category |
| GET | /products | Public | Active product array; costs omitted for nonstaff. Staff can use `?archived=true`. |
| POST | /products | Staff/admin | Product input → new product |
| PATCH | /products/:id | Staff/admin | Complete product input except stock → `{ok:true}` |
| POST | /inventory/adjust | Staff/admin | `{productId,delta,reason}` → updated product |
| GET | /inventory/movements | Staff/admin | Latest 200 movements; optional `?product=ID` |
| GET | /cart | Signed in | Own cart lines with current product details |
| PUT | /cart/:productId | Signed in | `{quantity:0..99}`; zero removes line |
| POST | /checkout | Signed in | Checkout input → order with item snapshots |
| GET | /orders | Signed in | Staff: up to 500 recent orders; customer: own orders only |
| GET | /orders/:id | Signed in | Staff or owning customer → order and items |
| PATCH | /orders/:id/status | Signed in | `{status,trackingNumber?}`; staff transitions or eligible own pending cancellation |
| GET | /customers | Staff/admin | Customer summaries, non-cancelled order counts and order value |
| GET | /dashboard?days=30 | Staff/admin | Metrics, daily channel totals, top products, recent orders; supported periods 7,30,90 |
| GET | /integrations | Staff/admin | Database mode, import history and core product quality check |
| POST | /integrations/preview | Staff/admin | `{csv}` → `{valid,rows,errors:[{row,message}]}` |
| POST | /integrations/import | Staff/admin | `{csv}` → `{id,imported}`; revalidates server-side |
| GET | /audit | Administrator | Latest 200 audit records |
| PATCH | /settings | Administrator | `{storeName,currency:'PHP',shippingCents,freeShippingCents}` |
| GET | /reports/export | Staff/admin | CSV download of up to 10,000 recent orders; all dates/statuses |

## Product input

```json
{
  "sku": "GS-NEW-001",
  "name": "Travel organizer",
  "description": "A compact everyday organizer.",
  "category_id": "existing-category-id",
  "price_cents": 44900,
  "cost_cents": 20000,
  "stock": 30,
  "reorder_level": 10,
  "image_url": "",
  "color": "#eeeaf6",
  "active": true
}
```

Create accepts opening stock. Updates ignore stock; use the adjustment endpoint to create an auditable change. SKUs normalize to uppercase. Price must be positive, stock/cost/threshold nonnegative integers. An update supplies the complete editable product record rather than a partial JSON patch. Setting active=false archives the product.

## Online checkout

```json
{
  "channel": "online",
  "name": "Customer name",
  "phone": "09171234567",
  "address": "House, street, city, province and postal code",
  "idempotencyKey": "client-generated-uuid"
}
```

Items come from the authenticated customer's persisted cart. The server ignores submitted line items and totals for online checkout. Successful checkout clears that cart. Reuse the same key if a network error makes the outcome uncertain.

## POS checkout

```json
{
  "channel": "pos",
  "expectedTotalCents": 89800,
  "name": "Walk-in customer",
  "idempotencyKey": "client-generated-uuid",
  "items": [{ "productId": "product-id", "quantity": 2 }]
}
```

Only staff/admin may submit POS sales. Send expectedTotalCents from the displayed cash total; a changed server total returns 409 before any sale is recorded. The server determines unit prices. Shipping is zero, payment is cash and status is delivered.

## Order transitions

```text
pending → processing → shipped → delivered
   └──────────────┐
processing ──────→ cancelled (stock restored)
```

Customers can cancel only their own pending orders. Staff can cancel pending/processing orders. A tracking number is required for shipped. Delivered/cancelled orders have no outgoing transition. POS starts delivered.

## Errors

Failures return `{ "error": "Readable explanation" }`. Expected codes: 400 invalid input, 401 no valid session, 403 unauthorized role/origin, 404 missing or private resource, 409 duplicate/state/stock conflict, 413 request too large, 429 rate limit and 500 unexpected server error. Internal SQL errors and secrets are not returned. Idempotent checkout repeats return 201 with the original order.

## Integration limits

Product CSV supports 1–500 rows, up to 500 KB text, required headers `sku,name,category,price,stock`, optional `reorder_level,description`. Prices are decimal pesos; stock is an absolute nonnegative balance. CSV import does not upload product images, alter existing cost prices, or reactivate archived products.

## Known API boundaries

This version returns bounded arrays rather than cursor-based pagination. It has no password reset, role-management API, account deletion, tax/refund/payment API, courier webhook or externally authenticated machine connector. Add those through separately specified requirements before a real deployment.
