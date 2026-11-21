import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { z, ZodError } from "zod";
import { one } from "./db.js";
import {
  AppError,
  fail,
  audit,
  moveStock,
  getSettings,
  placeOrder,
  transitionOrder,
  orderDetails,
} from "./domain.js";
import {
  loginSchema,
  registerSchema,
  productSchema,
  checkoutSchema,
  previewImport,
} from "./validation.js";

const hash = (token) => createHash("sha256").update(token).digest("hex");
const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
});
const staff = (req, res, next) =>
  ["admin", "staff"].includes(req.user?.role)
    ? next()
    : next(new AppError(403, "Staff access is required."));
const admin = (req, res, next) =>
  req.user?.role === "admin"
    ? next()
    : next(new AppError(403, "Administrator access is required."));
const auth = (req, res, next) =>
  req.user ? next() : next(new AppError(401, "Please sign in to continue."));
const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 7 * 86400000,
});
export function createApp(db) {
  const app = express();
  if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "https:", "data:"],
          fontSrc: ["'self'"],
          connectSrc: ["'self'"],
          upgradeInsecureRequests:
            process.env.NODE_ENV === "production" ? [] : null,
        },
      },
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  // Same-origin writes plus SameSite cookies defend cookie-authenticated routes against CSRF.
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers.origin
    ) {
      const origin = req.headers.origin;
      const allowed = new Set([
        process.env.APP_ORIGIN,
        `${req.protocol}://${req.get("host")}`,
      ]);
      if (process.env.NODE_ENV !== "production")
        [
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://localhost:3001",
          "http://127.0.0.1:3001",
        ].forEach((x) => allowed.add(x));
      if (!allowed.has(origin))
        return next(
          new AppError(403, "This request came from an untrusted origin."),
        );
    }
    next();
  });
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 300,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Too many requests. Please wait a minute." },
    }),
  );
  app.use("/api", async (req, res, next) => {
    const token = req.cookies.goshop_session;
    if (token)
      req.user = await one(
        db,
        "SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>NOW()",
        [hash(token)],
      );
    next();
  });
  const loginLimiter = rateLimit({
    windowMs: 15 * 60000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many sign-in attempts. Try again in 15 minutes." },
  });
  async function setSession(req, res, user) {
    if (req.cookies.goshop_session)
      await db.query("DELETE FROM sessions WHERE token_hash=$1", [
        hash(req.cookies.goshop_session),
      ]);
    await db.query("DELETE FROM sessions WHERE expires_at<NOW()");
    const token = randomBytes(32).toString("hex");
    await db.query(
      "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)",
      [hash(token), user.id, new Date(Date.now() + 7 * 86400000).toISOString()],
    );
    res.cookie("goshop_session", token, cookieOptions());
  }
  app.get("/api/health", async (req, res) => {
    await db.query("SELECT 1");
    res.json({ status: "ok", database: db.mode });
  });
  app.get("/api/config", async (req, res) =>
    res.json({
      ...(await getSettings(db)),
      database: db.mode,
      demo:
        process.env.NODE_ENV !== "production" &&
        process.env.SEED_DEMO === "true",
    }),
  );
  app.post("/api/auth/login", loginLimiter, async (req, res) => {
    const input = loginSchema.parse(req.body),
      user = await one(db, "SELECT * FROM users WHERE email=$1", [input.email]);
    // Always run a password comparison, even for an unknown address.
    const matches = await bcrypt.compare(
      input.password,
      user?.password_hash ||
        "$2b$12$jcqRHxoBmDX7Tqb4DXxQo.lu9ki09KRWDvV0wG5/5ECSLE1w8rzpS",
    );
    if (!user || !matches) fail(401, "The email or password is incorrect.");
    await setSession(req, res, user);
    res.json(safeUser(user));
  });
  app.post("/api/auth/register", loginLimiter, async (req, res) => {
    const input = registerSchema.parse(req.body),
      id = randomUUID(),
      passwordHash = await bcrypt.hash(input.password, 12);
    const user = await db.transaction(async (tx) => {
      if (await one(tx, "SELECT id FROM users WHERE email=$1", [input.email]))
        fail(409, "An account already uses this email.");
      const result = await one(
        tx,
        "INSERT INTO users(id,name,email,password_hash,role,phone) VALUES($1,$2,$3,$4,'customer',$5) RETURNING *",
        [id, input.name, input.email, passwordHash, input.phone],
      );
      await audit(tx, id, "customer.registered", "user", id);
      return result;
    });
    await setSession(req, res, user);
    res.status(201).json(safeUser(user));
  });
  app.get("/api/auth/me", auth, (req, res) => res.json(safeUser(req.user)));
  app.post("/api/auth/logout", async (req, res) => {
    if (req.cookies.goshop_session)
      await db.query("DELETE FROM sessions WHERE token_hash=$1", [
        hash(req.cookies.goshop_session),
      ]);
    res.clearCookie("goshop_session", {
      ...cookieOptions(),
      maxAge: undefined,
    });
    res.json({ ok: true });
  });
  app.get("/api/categories", async (req, res) =>
    res.json((await db.query("SELECT * FROM categories ORDER BY name")).rows),
  );
  app.post("/api/categories", auth, staff, async (req, res) => {
    const name = z.string().trim().min(2).max(60).parse(req.body.name),
      id = randomUUID();
    await db.transaction(async (tx) => {
      await tx.query("INSERT INTO categories(id,name) VALUES($1,$2)", [
        id,
        name,
      ]);
      await audit(tx, req.user.id, "category.created", "category", id, {
        name,
      });
    });
    res.status(201).json({ id, name });
  });
  app.get("/api/products", async (req, res) => {
    const isStaff = ["admin", "staff"].includes(req.user?.role);
    const columns = isStaff
      ? "p.*"
      : "p.id,p.sku,p.name,p.description,p.category_id,p.price_cents,p.stock,p.reorder_level,p.image_url,p.color,p.active,p.updated_at";
    res.json(
      (
        await db.query(
          `SELECT ${columns}, c.name AS category FROM products p JOIN categories c ON c.id=p.category_id ${isStaff && req.query.archived === "true" ? "" : "WHERE p.active=TRUE"} ORDER BY p.created_at,p.sku`,
        )
      ).rows,
    );
  });
  app.post("/api/products", auth, staff, async (req, res) => {
    const input = productSchema.parse(req.body),
      id = randomUUID();
    await db.transaction(async (tx) => {
      if (
        !(await one(tx, "SELECT id FROM categories WHERE id=$1", [
          input.category_id,
        ]))
      )
        fail(400, "Choose an existing category.");
      await tx.query(
        "INSERT INTO products(id,sku,name,description,category_id,price_cents,cost_cents,reorder_level,image_url,color,active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
        [
          id,
          input.sku,
          input.name,
          input.description,
          input.category_id,
          input.price_cents,
          input.cost_cents,
          input.reorder_level,
          input.image_url,
          input.color,
          input.active,
        ],
      );
      if (input.stock)
        await moveStock(tx, {
          product: { id, name: input.name },
          delta: input.stock,
          reason: "Opening inventory",
          actor: req.user.id,
        });
      await audit(tx, req.user.id, "product.created", "product", id, {
        sku: input.sku,
      });
    });
    res
      .status(201)
      .json(await one(db, "SELECT * FROM products WHERE id=$1", [id]));
  });
  app.patch("/api/products/:id", auth, staff, async (req, res) => {
    const input = productSchema.omit({ stock: true }).parse(req.body);
    await db.transaction(async (tx) => {
      if (
        !(await one(tx, "SELECT id FROM categories WHERE id=$1", [
          input.category_id,
        ]))
      )
        fail(400, "Choose an existing category.");
      const result = await one(
        tx,
        "UPDATE products SET sku=$1,name=$2,description=$3,category_id=$4,price_cents=$5,cost_cents=$6,reorder_level=$7,image_url=$8,color=$9,active=$10,updated_at=NOW() WHERE id=$11 RETURNING id",
        [
          input.sku,
          input.name,
          input.description,
          input.category_id,
          input.price_cents,
          input.cost_cents,
          input.reorder_level,
          input.image_url,
          input.color,
          input.active,
          req.params.id,
        ],
      );
      if (!result) fail(404, "Product not found.");
      await audit(
        tx,
        req.user.id,
        "product.updated",
        "product",
        req.params.id,
        { sku: input.sku, active: input.active },
      );
    });
    res.json({ ok: true });
  });
  app.post("/api/inventory/adjust", auth, staff, async (req, res) => {
    const input = z
      .object({
        productId: z.string(),
        delta: z
          .number()
          .int()
          .min(-1000000)
          .max(1000000)
          .refine((n) => n !== 0),
        reason: z.string().trim().min(5).max(200),
      })
      .parse(req.body);
    const result = await db.transaction(async (tx) => {
      const product = await one(
        tx,
        "SELECT * FROM products WHERE id=$1 FOR UPDATE",
        [input.productId],
      );
      if (!product) fail(404, "Product not found.");
      const next = await moveStock(tx, {
        product,
        ...input,
        actor: req.user.id,
      });
      await audit(
        tx,
        req.user.id,
        "inventory.adjusted",
        "product",
        product.id,
        { delta: input.delta, reason: input.reason, balance: next.stock },
      );
      return next;
    });
    res.json(result);
  });
  app.get("/api/inventory/movements", auth, staff, async (req, res) => {
    const params = req.query.product ? [String(req.query.product)] : [];
    res.json(
      (
        await db.query(
          `SELECT s.*,p.name AS product_name,p.sku,u.name AS actor FROM stock_movements s JOIN products p ON p.id=s.product_id JOIN users u ON u.id=s.actor_id ${params.length ? "WHERE s.product_id=$1" : ""} ORDER BY s.created_at DESC LIMIT 200`,
          params,
        )
      ).rows,
    );
  });
  app.get("/api/cart", auth, async (req, res) =>
    res.json(
      (
        await db.query(
          "SELECT c.quantity,p.id,p.sku,p.name,p.price_cents,p.stock,p.active,p.image_url,p.color FROM carts c JOIN products p ON p.id=c.product_id WHERE c.user_id=$1 ORDER BY p.name",
          [req.user.id],
        )
      ).rows,
    ),
  );
  app.put("/api/cart/:id", auth, async (req, res) => {
    const quantity = z.number().int().min(0).max(99).parse(req.body.quantity);
    await db.transaction(async (tx) => {
      await tx.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [
        req.user.id,
      ]);
      if (!quantity) {
        await tx.query("DELETE FROM carts WHERE user_id=$1 AND product_id=$2", [
          req.user.id,
          req.params.id,
        ]);
        return;
      }
      const product = await one(tx, "SELECT * FROM products WHERE id=$1", [
        req.params.id,
      ]);
      if (!product?.active) fail(404, "Product not available.");
      if (quantity > product.stock)
        fail(409, `Only ${product.stock} units are available.`);
      await tx.query(
        "INSERT INTO carts(user_id,product_id,quantity) VALUES($1,$2,$3) ON CONFLICT(user_id,product_id) DO UPDATE SET quantity=EXCLUDED.quantity",
        [req.user.id, req.params.id, quantity],
      );
    });
    res.json({ ok: true });
  });
  app.post("/api/checkout", auth, async (req, res) =>
    res
      .status(201)
      .json(await placeOrder(db, req.user, checkoutSchema.parse(req.body))),
  );
  app.get("/api/orders", auth, async (req, res) => {
    const isStaff = ["admin", "staff"].includes(req.user.role);
    res.json(
      (
        await db.query(
          `SELECT o.*, (SELECT SUM(quantity)::int FROM order_items WHERE order_id=o.id) AS item_count FROM orders o ${isStaff ? "" : "WHERE o.customer_id=$1"} ORDER BY o.created_at DESC LIMIT 500`,
          isStaff ? [] : [req.user.id],
        )
      ).rows,
    );
  });
  app.get("/api/orders/:id", auth, async (req, res) => {
    const order = await orderDetails(db, req.params.id);
    if (req.user.role === "customer" && order.customer_id !== req.user.id)
      fail(404, "Order not found.");
    res.json(order);
  });
  app.patch("/api/orders/:id/status", auth, async (req, res) => {
    const input = z
      .object({
        status: z.enum(["processing", "shipped", "delivered", "cancelled"]),
        trackingNumber: z.string().trim().max(100).default(""),
      })
      .parse(req.body);
    res.json(
      await transitionOrder(
        db,
        req.user,
        req.params.id,
        input.status,
        input.trackingNumber,
      ),
    );
  });
  app.get("/api/customers", auth, staff, async (req, res) =>
    res.json(
      (
        await db.query(`SELECT u.id,u.name,u.email,u.phone,u.created_at,
   COUNT(o.id) FILTER(WHERE o.status<>'cancelled')::int AS order_count,
   COALESCE(SUM(o.total_cents) FILTER(WHERE o.status<>'cancelled'),0)::bigint AS total_spent,
   MAX(o.created_at) AS last_order FROM users u LEFT JOIN orders o ON o.customer_id=u.id WHERE u.role='customer' GROUP BY u.id ORDER BY u.created_at DESC`)
      ).rows,
    ),
  );
  app.get("/api/dashboard", auth, staff, async (req, res) => {
    const days = z.coerce
      .number()
      .int()
      .refine((n) => [7, 30, 90].includes(n))
      .parse(req.query.days || 30);
    const today = new Date(Date.now() + 8 * 3600000);
    const start =
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate(),
      ) -
      8 * 3600000 -
      (days - 1) * 86400000;
    const cutoff = new Date(start).toISOString(),
      previous = new Date(start - days * 86400000).toISOString();
    const summary = await one(
      db,
      `SELECT COALESCE(SUM(total_cents) FILTER(WHERE created_at>=$1),0)::bigint AS sales,
     COUNT(*) FILTER(WHERE created_at>=$1)::int AS orders,COALESCE(SUM(total_cents) FILTER(WHERE created_at>=$2 AND created_at<$1),0)::bigint AS previous_sales,
     COALESCE(SUM(total_cents) FILTER(WHERE created_at>=$1 AND channel='online'),0)::bigint AS online_sales,
     COALESCE(SUM(total_cents) FILTER(WHERE created_at>=$1 AND channel='pos'),0)::bigint AS pos_sales
     FROM orders WHERE status<>'cancelled'`,
      [cutoff, previous],
    );
    const inventory = await one(
      db,
      "SELECT COUNT(*)::int AS products,COALESCE(SUM(stock),0)::int AS units,COUNT(*) FILTER(WHERE stock<=reorder_level)::int AS low_stock FROM products WHERE active=TRUE",
    );
    const customers = await one(
      db,
      "SELECT COUNT(*)::int AS count FROM users WHERE role='customer'",
    );
    const daily = (
      await db.query(
        `SELECT (created_at AT TIME ZONE 'Asia/Manila')::date::text AS date,
     SUM(total_cents) FILTER(WHERE channel='online') AS online,SUM(total_cents) FILTER(WHERE channel='pos') AS pos
     FROM orders WHERE created_at>=$1 AND status<>'cancelled' GROUP BY 1 ORDER BY 1`,
        [cutoff],
      )
    ).rows;
    const topProducts = (
      await db.query(
        `SELECT p.id,p.name,p.sku,p.image_url,p.color,SUM(i.quantity)::int AS sold,SUM(i.quantity*i.unit_price_cents)::bigint AS sales
     FROM order_items i JOIN orders o ON o.id=i.order_id JOIN products p ON p.id=i.product_id WHERE o.created_at>=$1 AND o.status<>'cancelled' GROUP BY p.id ORDER BY sales DESC LIMIT 5`,
        [cutoff],
      )
    ).rows;
    const recent = (
      await db.query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 5")
    ).rows;
    res.json({
      summary,
      inventory,
      customers: customers.count,
      daily,
      topProducts,
      recent,
      days,
    });
  });
  app.get("/api/integrations", auth, staff, async (req, res) =>
    res.json({
      database: db.mode,
      runs: (
        await db.query(
          "SELECT r.*,u.name AS actor FROM integration_runs r JOIN users u ON u.id=r.actor_id ORDER BY r.created_at DESC LIMIT 50",
        )
      ).rows,
      quality: await one(
        db,
        "SELECT COUNT(*)::int AS checked,COUNT(*) FILTER(WHERE stock<0 OR price_cents<=0 OR name='')::int AS invalid FROM products",
      ),
    }),
  );
  const csvSchema = z.object({ csv: z.string().min(1).max(500000) });
  app.post("/api/integrations/preview", auth, staff, (req, res) =>
    res.json(previewImport(csvSchema.parse(req.body).csv)),
  );
  app.post("/api/integrations/import", auth, staff, async (req, res) => {
    const result = previewImport(csvSchema.parse(req.body).csv);
    if (!result.valid)
      fail(400, "Resolve every CSV validation error before importing.");
    const id = randomUUID();
    await db.transaction(async (tx) => {
      // Serializes imports; stock rows are then locked in SKU order, consistently with each other.
      await tx.query("SELECT id FROM settings WHERE id='store' FOR UPDATE");
      await tx.query("SELECT id FROM products ORDER BY id FOR UPDATE");
      for (const row of result.rows.sort((a, b) =>
        a.sku.localeCompare(b.sku),
      )) {
        let category = await one(
          tx,
          "SELECT id FROM categories WHERE lower(name)=lower($1)",
          [row.category],
        );
        if (!category) {
          category = { id: randomUUID() };
          await tx.query("INSERT INTO categories(id,name) VALUES($1,$2)", [
            category.id,
            row.category,
          ]);
        }
        const existing = await one(
          tx,
          "SELECT * FROM products WHERE sku=$1 FOR UPDATE",
          [row.sku],
        );
        const product = existing || {
          id: randomUUID(),
          name: row.name,
          stock: 0,
        };
        if (existing)
          await tx.query(
            "UPDATE products SET name=$1,description=$2,category_id=$3,price_cents=$4,reorder_level=$5,updated_at=NOW() WHERE id=$6",
            [
              row.name,
              row.description,
              category.id,
              row.price_cents,
              row.reorder_level,
              product.id,
            ],
          );
        else
          await tx.query(
            "INSERT INTO products(id,sku,name,description,category_id,price_cents,reorder_level) VALUES($1,$2,$3,$4,$5,$6,$7)",
            [
              product.id,
              row.sku,
              row.name,
              row.description,
              category.id,
              row.price_cents,
              row.reorder_level,
            ],
          );
        if (row.stock !== product.stock)
          await moveStock(tx, {
            product,
            delta: row.stock - product.stock,
            reason: "CSV stock reconciliation",
            actor: req.user.id,
          });
      }
      await tx.query(
        "INSERT INTO integration_runs(id,source,status,records_count,actor_id) VALUES($1,$2,$3,$4,$5)",
        [id, "Product CSV", "completed", result.rows.length, req.user.id],
      );
      await audit(tx, req.user.id, "integration.imported", "integration", id, {
        records: result.rows.length,
      });
    });
    res.json({ id, imported: result.rows.length });
  });
  app.get("/api/audit", auth, admin, async (req, res) =>
    res.json(
      (
        await db.query(
          "SELECT a.*,u.name AS actor FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 200",
        )
      ).rows,
    ),
  );
  app.patch("/api/settings", auth, admin, async (req, res) => {
    const settings = z
      .object({
        storeName: z.string().trim().min(2).max(60),
        shippingCents: z.number().int().min(0).max(100000),
        freeShippingCents: z.number().int().min(0).max(10000000),
        currency: z.literal("PHP"),
      })
      .parse(req.body);
    await db.transaction(async (tx) => {
      await tx.query(
        "INSERT INTO settings(id,value) VALUES('store',$1) ON CONFLICT(id) DO UPDATE SET value=EXCLUDED.value",
        [JSON.stringify(settings)],
      );
      await audit(
        tx,
        req.user.id,
        "settings.updated",
        "settings",
        "store",
        settings,
      );
    });
    res.json(settings);
  });
  app.get("/api/reports/export", auth, staff, async (req, res) => {
    const rows = (
      await db.query(
        "SELECT order_number,customer_name,channel,status,total_cents,created_at FROM orders ORDER BY created_at DESC LIMIT 10000",
      )
    ).rows;
    const escape = (value) =>
      '"' +
      String(value ?? "")
        .replace(/^[=+@-]/, "'$&")
        .replaceAll('"', '""') +
      '"';
    const csv = [
      "order_number,customer,channel,status,total_php,created_at",
      ...rows.map((r) =>
        [
          r.order_number,
          r.customer_name,
          r.channel,
          r.status,
          (r.total_cents / 100).toFixed(2),
          new Date(r.created_at).toISOString(),
        ]
          .map(escape)
          .join(","),
      ),
    ].join("\r\n");
    res.type("text/csv").attachment("goshop-sales.csv").send(csv);
  });
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "API route not found." }),
  );
  app.use((error, req, res, next) => {
    if (error instanceof ZodError)
      return res
        .status(400)
        .json({
          error: error.issues
            .map((e) => `${e.path.join(".") || "Input"}: ${e.message}`)
            .join(" "),
        });
    if (error.code === "23505")
      return res
        .status(409)
        .json({
          error:
            "This email, SKU or category already exists. Use a unique value.",
        });
    if (error instanceof AppError)
      return res.status(error.status).json({ error: error.message });
    if (error.type === "entity.parse.failed")
      return res.status(400).json({ error: "Invalid JSON request." });
    if (error.type === "entity.too.large")
      return res.status(413).json({ error: "The request is too large." });
    console.error("API error:", error.code || error.name);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  });
  return app;
}
