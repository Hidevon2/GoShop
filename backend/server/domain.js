import { randomUUID } from "node:crypto";
import { one } from "./db.js";

export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const fail = (status, message) => {
  throw new AppError(status, message);
};
export async function audit(tx, actor, action, type, id, details = {}) {
  await tx.query(
    "INSERT INTO audit_logs(id,actor_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5,$6)",
    [randomUUID(), actor, action, type, id, JSON.stringify(details)],
  );
}
export async function moveStock(
  tx,
  { product, delta, reason, actor, orderId = null },
) {
  const next = await one(
    tx,
    "UPDATE products SET stock=stock+$1, updated_at=NOW() WHERE id=$2 AND stock+$1>=0 RETURNING *",
    [delta, product.id],
  );
  if (!next)
    fail(409, `Not enough stock for ${product.name}. Refresh and try again.`);
  await tx.query(
    "INSERT INTO stock_movements(id,product_id,delta,balance,reason,order_id,actor_id) VALUES($1,$2,$3,$4,$5,$6,$7)",
    [randomUUID(), product.id, delta, next.stock, reason, orderId, actor],
  );
  return next;
}
export async function getSettings(db) {
  return (
    (await one(db, "SELECT value FROM settings WHERE id='store'"))?.value ?? {
      storeName: "GoShop",
      shippingCents: 9900,
      freeShippingCents: 150000,
      currency: "PHP",
    }
  );
}
export async function orderDetails(db, id) {
  const order = await one(db, "SELECT * FROM orders WHERE id=$1", [id]);
  if (!order) fail(404, "Order not found.");
  order.items = (
    await db.query("SELECT * FROM order_items WHERE order_id=$1 ORDER BY sku", [
      id,
    ])
  ).rows;
  return order;
}
export async function placeOrder(db, user, input) {
  return db.transaction(async (tx) => {
    // Serializes simultaneous retries with the same key, including on different API instances.
    await tx.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [user.id]);
    const existing = await one(
      tx,
      "SELECT id FROM orders WHERE created_by=$1 AND idempotency_key=$2",
      [user.id, input.idempotencyKey],
    );
    if (existing) return orderDetails(tx, existing.id);
    if (input.channel === "pos" && !["admin", "staff"].includes(user.role))
      fail(403, "Staff access is required for in-store checkout.");
    const rawItems =
      input.channel === "online"
        ? (
            await tx.query(
              'SELECT product_id AS "productId", quantity FROM carts WHERE user_id=$1 ORDER BY product_id',
              [user.id],
            )
          ).rows
        : input.items;
    if (!rawItems?.length) fail(400, "Your cart is empty.");
    const quantities = new Map();
    for (const item of rawItems)
      quantities.set(
        item.productId,
        (quantities.get(item.productId) ?? 0) + item.quantity,
      );
    const lines = [];
    // Deterministic lock order prevents deadlocks between overlapping shopping carts.
    for (const [id, quantity] of [...quantities.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99)
        fail(400, "Each quantity must be between 1 and 99.");
      const product = await one(
        tx,
        "SELECT * FROM products WHERE id=$1 FOR UPDATE",
        [id],
      );
      if (!product?.active)
        fail(409, "A product in your cart is no longer available.");
      if (product.stock < quantity)
        fail(
          409,
          `Only ${product.stock} units of ${product.name} are available.`,
        );
      lines.push({ product, quantity });
    }
    const settings = await getSettings(tx);
    const subtotal = lines.reduce(
      (sum, { product, quantity }) => sum + product.price_cents * quantity,
      0,
    );
    if (input.channel === "pos" && input.expectedTotalCents !== subtotal)
      fail(
        409,
        "Product prices changed. Review the updated total and confirm the cash amount before trying again.",
      );
    const shipping =
      input.channel === "pos" || subtotal >= settings.freeShippingCents
        ? 0
        : settings.shippingCents;
    if (subtotal + shipping > 2000000000)
      fail(400, "Order total exceeds the supported amount.");
    const id = randomUUID();
    const number = `GS-${Date.now().toString(36).toUpperCase()}-${id.slice(0, 4).toUpperCase()}`;
    const customerName =
      input.channel === "online"
        ? input.name
        : input.name || "Walk-in customer";
    await tx.query(
      `INSERT INTO orders(id,order_number,customer_id,customer_name,customer_email,phone,channel,status,payment_method,subtotal_cents,shipping_cents,total_cents,address,idempotency_key,created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        id,
        number,
        input.channel === "online" ? user.id : null,
        customerName,
        input.channel === "online" ? user.email : "",
        input.phone || "",
        input.channel,
        input.channel === "pos" ? "delivered" : "pending",
        input.channel === "pos" ? "cash" : "cod",
        subtotal,
        shipping,
        subtotal + shipping,
        input.address || "",
        input.idempotencyKey,
        user.id,
      ],
    );
    for (const { product, quantity } of lines) {
      await tx.query(
        "INSERT INTO order_items(id,order_id,product_id,product_name,sku,quantity,unit_price_cents) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [
          randomUUID(),
          id,
          product.id,
          product.name,
          product.sku,
          quantity,
          product.price_cents,
        ],
      );
      await moveStock(tx, {
        product,
        delta: -quantity,
        reason: input.channel === "pos" ? "In-store sale" : "Online order",
        actor: user.id,
        orderId: id,
      });
    }
    if (input.channel === "online")
      await tx.query("DELETE FROM carts WHERE user_id=$1", [user.id]);
    await audit(tx, user.id, "order.created", "order", id, {
      channel: input.channel,
      totalCents: subtotal + shipping,
    });
    return orderDetails(tx, id);
  });
}
export async function transitionOrder(
  db,
  user,
  id,
  status,
  trackingNumber = "",
) {
  return db.transaction(async (tx) => {
    const order = await one(tx, "SELECT * FROM orders WHERE id=$1 FOR UPDATE", [
      id,
    ]);
    if (!order) fail(404, "Order not found.");
    const staff = ["admin", "staff"].includes(user.role);
    if (
      !staff &&
      (order.customer_id !== user.id ||
        status !== "cancelled" ||
        order.status !== "pending")
    )
      fail(403, "You can only cancel your own pending orders.");
    const transitions = {
      pending: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: [],
    };
    if (!transitions[order.status].includes(status))
      fail(409, `Cannot change ${order.status} to ${status}.`);
    if (status === "shipped" && !trackingNumber.trim())
      fail(400, "Enter a tracking number before marking the order shipped.");
    if (status === "cancelled") {
      const items = (
        await tx.query(
          "SELECT * FROM order_items WHERE order_id=$1 ORDER BY product_id",
          [id],
        )
      ).rows;
      for (const item of items) {
        const product = await one(
          tx,
          "SELECT * FROM products WHERE id=$1 FOR UPDATE",
          [item.product_id],
        );
        await moveStock(tx, {
          product,
          delta: item.quantity,
          reason: "Order cancelled",
          actor: user.id,
          orderId: id,
        });
      }
    }
    await tx.query(
      "UPDATE orders SET status=$1, tracking_number=$2,updated_at=NOW() WHERE id=$3",
      [status, trackingNumber || order.tracking_number, id],
    );
    await audit(tx, user.id, "order.status_changed", "order", id, {
      from: order.status,
      to: status,
    });
    return orderDetails(tx, id);
  });
}
