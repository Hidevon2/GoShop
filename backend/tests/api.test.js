import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { createDatabase, one } from "../server/db.js";
import { migrate } from "../server/migrate.js";
import { createApp } from "../server/app.js";

let db, server, base, admin, staff, customer;
async function request(path, { method = "GET", body, cookie, origin } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(origin ? { Origin: origin } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = response.headers
    .get("content-type")
    ?.includes("application/json")
    ? await response.json()
    : await response.text();
  return {
    status: response.status,
    body: result,
    cookie: response.headers.getSetCookie()?.[0]?.split(";")[0],
    headers: response.headers,
  };
}
const pos = (productId, quantity = 1, key = randomUUID()) => ({
  channel: "pos",
  name: "Test shopper",
  idempotencyKey: key,
  expectedTotalCents: 25000 * quantity,
  items: [{ productId, quantity }],
});
before(async () => {
  db = await createDatabase({ url: "", memory: true });
  await migrate(db);
  const password = await bcrypt.hash("TestPassword!123", 4);
  for (const role of ["admin", "staff", "customer"])
    await db.query(
      "INSERT INTO users(id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5)",
      [role, `Test ${role}`, `${role}@test.local`, password, role],
    );
  await db.query("INSERT INTO categories(id,name) VALUES('test','Test')");
  await db.query("INSERT INTO settings(id,value) VALUES('store',$1)", [
    JSON.stringify({
      storeName: "GoShop",
      currency: "PHP",
      shippingCents: 9900,
      freeShippingCents: 150000,
    }),
  ]);
  for (const [id, stock] of [
    ["normal", 100],
    ["scarce", 1],
    ["other", 20],
  ])
    await db.query(
      "INSERT INTO products(id,sku,name,category_id,price_cents,stock) VALUES($1,$2,$3,'test',25000,$4)",
      [id, `TEST-${id.toUpperCase()}`, `Test ${id}`, stock],
    );
  server = createApp(db).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
  for (const role of ["admin", "staff", "customer"]) {
    const result = await request("/auth/login", {
      method: "POST",
      body: { email: `${role}@test.local`, password: "TestPassword!123" },
    });
    assert.equal(result.status, 200);
    if (role === "admin") admin = result.cookie;
    if (role === "staff") staff = result.cookie;
    if (role === "customer") customer = result.cookie;
  }
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.close();
});

test("public catalog never exposes cost prices or password hashes", async () => {
  const result = await request("/products");
  assert.equal(result.status, 200);
  assert.equal(result.body.length, 3);
  assert.ok(!("cost_cents" in result.body[0]));
  assert.ok(!("password_hash" in result.body[0]));
});
test("authorization is enforced by API for guests, customers and staff", async () => {
  assert.equal((await request("/dashboard")).status, 401);
  assert.equal((await request("/customers", { cookie: customer })).status, 403);
  assert.equal((await request("/audit", { cookie: staff })).status, 403);
  assert.equal(
    (
      await request("/checkout", {
        method: "POST",
        cookie: customer,
        body: pos("normal"),
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request("/settings", {
        method: "PATCH",
        cookie: customer,
        body: {},
      })
    ).status,
    403,
  );
});
test("session cookie is HttpOnly and SameSite; incorrect login fails", async () => {
  const result = await request("/auth/login", {
    method: "POST",
    body: { email: "admin@test.local", password: "TestPassword!123" },
  });
  assert.match(result.headers.getSetCookie()[0], /HttpOnly/);
  assert.match(result.headers.getSetCookie()[0], /SameSite=Lax/);
  assert.equal(
    (
      await request("/auth/login", {
        method: "POST",
        body: { email: "admin@test.local", password: "incorrect" },
      })
    ).status,
    401,
  );
});
test("registration cannot elevate a customer to an admin", async () => {
  const result = await request("/auth/register", {
    method: "POST",
    body: {
      name: "New customer",
      email: "new@test.local",
      password: "StrongPassword123!",
      role: "admin",
    },
  });
  assert.equal(result.status, 201);
  assert.equal(result.body.role, "customer");
  assert.ok(!result.body.password_hash);
  assert.equal(
    (
      await request("/auth/register", {
        method: "POST",
        body: {
          name: "Duplicate",
          email: "NEW@test.local",
          password: "StrongPassword123!",
        },
      })
    ).status,
    409,
  );
});
test("untrusted browser origins cannot make authenticated changes", async () => {
  const result = await request("/checkout", {
    method: "POST",
    cookie: admin,
    origin: "https://untrusted.example",
    body: pos("normal"),
  });
  assert.equal(result.status, 403);
});
test("competing checkouts cannot oversell the final unit", async () => {
  const results = await Promise.all([
    request("/checkout", {
      method: "POST",
      cookie: staff,
      body: pos("scarce"),
    }),
    request("/checkout", {
      method: "POST",
      cookie: admin,
      body: pos("scarce"),
    }),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  assert.equal(
    (await one(db, "SELECT stock FROM products WHERE id='scarce'")).stock,
    0,
  );
});
test("simultaneous checkout retries return one order and deduct stock once", async () => {
  const before = (await one(db, "SELECT stock FROM products WHERE id='normal'"))
      .stock,
    key = randomUUID();
  const results = await Promise.all([
    request("/checkout", {
      method: "POST",
      cookie: admin,
      body: pos("normal", 2, key),
    }),
    request("/checkout", {
      method: "POST",
      cookie: admin,
      body: pos("normal", 2, key),
    }),
  ]);
  assert.equal(results[0].status, 201);
  assert.equal(results[1].status, 201);
  assert.equal(results[0].body.id, results[1].body.id);
  assert.equal(
    (await one(db, "SELECT stock FROM products WHERE id='normal'")).stock,
    before - 2,
  );
  assert.equal(
    Number(
      (
        await one(
          db,
          "SELECT COUNT(*) AS count FROM orders WHERE idempotency_key=$1",
          [key],
        )
      ).count,
    ),
    1,
  );
});
let onlineOrder;
test("POS rejects a stale displayed cash total without recording a sale or deducting stock", async () => {
  const before = (await one(db, "SELECT stock FROM products WHERE id='normal'"))
    .stock;
  const input = { ...pos("normal"), expectedTotalCents: 1 };
  const result = await request("/checkout", {
    method: "POST",
    cookie: staff,
    body: input,
  });
  assert.equal(result.status, 409);
  assert.match(result.body.error, /prices changed/);
  assert.equal(
    (await one(db, "SELECT stock FROM products WHERE id='normal'")).stock,
    before,
  );
  assert.equal(
    await one(db, "SELECT id FROM orders WHERE idempotency_key=$1", [
      input.idempotencyKey,
    ]),
    null,
  );
});
test("online checkout uses the persisted cart and server prices; cancellation restores stock once", async () => {
  assert.equal(
    (
      await request("/cart/other", {
        method: "PUT",
        cookie: customer,
        body: { quantity: 2 },
      })
    ).status,
    200,
  );
  const result = await request("/checkout", {
    method: "POST",
    cookie: customer,
    body: {
      channel: "online",
      name: "Test Customer",
      phone: "09171234567",
      address: "123 Example Street, Quezon City",
      idempotencyKey: randomUUID(),
      items: [{ productId: "normal", quantity: 99 }],
      total_cents: 1,
    },
  });
  assert.equal(result.status, 201);
  onlineOrder = result.body;
  assert.equal(onlineOrder.items.length, 1);
  assert.equal(onlineOrder.items[0].product_id, "other");
  assert.equal(onlineOrder.subtotal_cents, 50000);
  assert.equal(onlineOrder.shipping_cents, 9900);
  assert.equal(onlineOrder.total_cents, 59900);
  assert.equal((await request("/cart", { cookie: customer })).body.length, 0);
  assert.equal(
    (await one(db, "SELECT stock FROM products WHERE id='other'")).stock,
    18,
  );
  assert.equal(
    (
      await request(`/orders/${onlineOrder.id}/status`, {
        method: "PATCH",
        cookie: customer,
        body: { status: "cancelled" },
      })
    ).status,
    200,
  );
  assert.equal(
    (await one(db, "SELECT stock FROM products WHERE id='other'")).stock,
    20,
  );
  assert.equal(
    (
      await request(`/orders/${onlineOrder.id}/status`, {
        method: "PATCH",
        cookie: admin,
        body: { status: "cancelled" },
      })
    ).status,
    409,
  );
  assert.equal(
    (await one(db, "SELECT stock FROM products WHERE id='other'")).stock,
    20,
  );
});
test("customer cannot read another customer’s order", async () => {
  const stranger = await request("/auth/register", {
    method: "POST",
    body: {
      name: "Other shopper",
      email: "stranger@test.local",
      password: "AnotherPassword123!",
    },
  });
  assert.equal(
    (await request(`/orders/${onlineOrder.id}`, { cookie: stranger.cookie }))
      .status,
    404,
  );
  assert.equal(
    (await request("/orders", { cookie: stranger.cookie })).body.length,
    0,
  );
});
test("fulfillment follows valid transitions and requires shipment tracking", async () => {
  await request("/cart/normal", {
    method: "PUT",
    cookie: customer,
    body: { quantity: 1 },
  });
  const order = (
    await request("/checkout", {
      method: "POST",
      cookie: customer,
      body: {
        channel: "online",
        name: "Test Customer",
        phone: "09171234567",
        address: "123 Example Street, Quezon City",
        idempotencyKey: randomUUID(),
      },
    })
  ).body;
  const update = (body) =>
    request(`/orders/${order.id}/status`, {
      method: "PATCH",
      cookie: staff,
      body,
    });
  assert.equal((await update({ status: "delivered" })).status, 409);
  assert.equal((await update({ status: "processing" })).status, 200);
  assert.equal((await update({ status: "shipped" })).status, 400);
  assert.equal(
    (await update({ status: "shipped", trackingNumber: "TRACK-123" })).status,
    200,
  );
  assert.equal((await update({ status: "delivered" })).status, 200);
  assert.equal((await update({ status: "cancelled" })).status, 409);
});
test("stock adjustments reject negative balances and preserve an audit record", async () => {
  const before = (await one(db, "SELECT stock FROM products WHERE id='normal'"))
    .stock;
  assert.equal(
    (
      await request("/inventory/adjust", {
        method: "POST",
        cookie: staff,
        body: {
          productId: "normal",
          delta: -1000,
          reason: "Invalid adjustment",
        },
      })
    ).status,
    409,
  );
  assert.equal(
    (await one(db, "SELECT stock FROM products WHERE id='normal'")).stock,
    before,
  );
  assert.equal(
    (
      await request("/inventory/adjust", {
        method: "POST",
        cookie: staff,
        body: { productId: "normal", delta: 5, reason: "Supplier delivery" },
      })
    ).status,
    200,
  );
  assert.ok(
    (await request("/audit", { cookie: admin })).body.some(
      (a) => a.action === "inventory.adjusted",
    ),
  );
});
test("CSV validation normalizes SKUs, rejects duplicates and imports atomically", async () => {
  const invalid =
    "sku,name,category,price,stock\ntest-new,New product,Test,5.00,3\nTEST-NEW,Duplicate,Test,9.00,4";
  const preview = await request("/integrations/preview", {
    method: "POST",
    cookie: staff,
    body: { csv: invalid },
  });
  assert.equal(preview.body.valid, false);
  assert.match(preview.body.errors[0].message, /Duplicate/);
  assert.equal(
    (
      await request("/integrations/import", {
        method: "POST",
        cookie: staff,
        body: { csv: invalid },
      })
    ).status,
    400,
  );
  assert.equal(
    await one(db, "SELECT id FROM products WHERE sku='TEST-NEW'"),
    null,
  );
  const valid =
    "sku,name,category,price,stock\n  test-new  ,New product,Test,59.50,30";
  assert.equal(
    (
      await request("/integrations/import", {
        method: "POST",
        cookie: staff,
        body: { csv: valid },
      })
    ).status,
    200,
  );
  const row = await one(db, "SELECT * FROM products WHERE sku='TEST-NEW'");
  assert.equal(row.stock, 30);
  assert.equal(row.price_cents, 5950);
  assert.equal(
    (
      await request("/integrations/import", {
        method: "POST",
        cookie: staff,
        body: { csv: valid },
      })
    ).status,
    200,
  );
  assert.equal(
    (await one(db, "SELECT stock FROM products WHERE sku='TEST-NEW'")).stock,
    30,
  );
});
test("invalid import values and hostile CSV headers do not mutate data", async () => {
  const csv =
    "sku,name,category,price,stock,__proto__\nBAD,Something,Test,-3.00,-10,abc";
  const result = await request("/integrations/preview", {
    method: "POST",
    cookie: staff,
    body: { csv },
  });
  assert.equal(result.body.valid, false);
  assert.equal({}.abc, undefined);
});
test("CSV export protects spreadsheet formula cells", async () => {
  const body = { ...pos("normal"), name: "=SUM(1+1)" };
  assert.equal(
    (await request("/checkout", { method: "POST", cookie: staff, body }))
      .status,
    201,
  );
  const result = await request("/reports/export", { cookie: staff });
  assert.equal(result.status, 200);
  assert.match(result.body, /'=SUM\(1\+1\)/);
});
test("dashboard totals are derived from orders and omit cancellations", async () => {
  const result = await request("/dashboard?days=30", { cookie: staff });
  assert.equal(result.status, 200);
  const actual = await one(
    db,
    "SELECT SUM(total_cents) AS total FROM orders WHERE status<>'cancelled'",
  );
  assert.equal(Number(result.body.summary.sales), Number(actual.total));
  assert.equal(
    (await request("/dashboard?days=-1", { cookie: admin })).status,
    400,
  );
});
test("chart and summary use the same Manila calendar-day interval", async () => {
  const boundary = await one(
    db,
    "SELECT (date_trunc('day',NOW() AT TIME ZONE 'Asia/Manila')-interval '29 days') AT TIME ZONE 'Asia/Manila' AS start",
  );
  const start = new Date(boundary.start);
  const included = (
    await request("/checkout", {
      method: "POST",
      cookie: staff,
      body: pos("normal"),
    })
  ).body;
  const excluded = (
    await request("/checkout", {
      method: "POST",
      cookie: staff,
      body: pos("normal"),
    })
  ).body;
  await db.query("UPDATE orders SET created_at=$1 WHERE id=$2", [
    new Date(start.getTime() + 60000).toISOString(),
    included.id,
  ]);
  await db.query("UPDATE orders SET created_at=$1 WHERE id=$2", [
    new Date(start.getTime() - 60000).toISOString(),
    excluded.id,
  ]);
  const { body: data } = await request("/dashboard?days=30", { cookie: staff });
  const firstDate = new Date(start.getTime() + 8 * 3600000)
    .toISOString()
    .slice(0, 10);
  assert.ok(data.daily.some((row) => row.date === firstDate));
  assert.ok(data.daily.every((row) => row.date >= firstDate));
  assert.equal(
    data.daily.reduce(
      (sum, row) => sum + Number(row.online || 0) + Number(row.pos || 0),
      0,
    ),
    Number(data.summary.sales),
  );
});
test("logout invalidates the server session", async () => {
  const session = await request("/auth/login", {
    method: "POST",
    body: { email: "staff@test.local", password: "TestPassword!123" },
  });
  assert.equal(
    (await request("/auth/logout", { method: "POST", cookie: session.cookie }))
      .status,
    200,
  );
  assert.equal(
    (await request("/auth/me", { cookie: session.cookie })).status,
    401,
  );
});
