import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { one } from "./db.js";
import { placeOrder, moveStock } from "./domain.js";

const products = [
  [
    "GS-AU-001",
    "Studio wireless headphones",
    "Electronics",
    249900,
    150000,
    "Over-ear wireless headphones with soft cushions. Up to 30 hours of listening.",
    "headphones.jpg",
    "#edeaf8",
  ],
  [
    "GS-BG-002",
    "Everyday canvas tote",
    "Accessories",
    54900,
    23000,
    "A roomy everyday carry, made with heavyweight cotton canvas.",
    "tote.jpg",
    "#efe9e0",
  ],
  [
    "GS-HM-003",
    "Arc desk lamp",
    "Home & Living",
    189900,
    100000,
    "A sculptural desk companion with warm, adjustable light.",
    "lamp.jpg",
    "#f0ebe4",
  ],
  [
    "GS-DR-004",
    "Daybreak insulated bottle",
    "Lifestyle",
    79900,
    38000,
    "Double-wall stainless steel bottle. 500 ml, with a leakproof lid.",
    "bottle.jpg",
    "#e8eeea",
  ],
  [
    "GS-FT-005",
    "Weekend court sneakers",
    "Footwear",
    219900,
    120000,
    "Comfortable everyday sneakers. Demo product: standard size 40.",
    "sneakers.jpg",
    "#efe9e5",
  ],
  [
    "GS-CL-006",
    "Essential cotton sweatshirt",
    "Clothing",
    129900,
    65000,
    "An easy layer in soft cotton fleece. Demo product: unisex medium.",
    "sweatshirt.jpg",
    "#eaece5",
  ],
  [
    "GS-HM-007",
    "Slow morning ceramic mug",
    "Home & Living",
    39900,
    16000,
    "A glazed ceramic mug for your daily coffee ritual. 350 ml.",
    "mug.jpg",
    "#f0e8de",
  ],
  [
    "GS-AU-008",
    "Pocket portable speaker",
    "Electronics",
    159900,
    80000,
    "Compact wireless speaker with a fabric finish and carrying loop.",
    "speaker.jpg",
    "#e8e9ed",
  ],
  [
    "GS-BG-009",
    "City daypack",
    "Accessories",
    169900,
    90000,
    "A lightweight daily backpack with a padded laptop compartment.",
    "backpack.jpg",
    "#e6eae7",
  ],
  [
    "GS-LF-010",
    "Daily notes journal",
    "Lifestyle",
    34900,
    14000,
    "A clothbound notebook with 160 dotted pages.",
    "notebook.jpg",
    "#ede8f1",
  ],
  [
    "GS-HM-011",
    "Terra indoor planter",
    "Home & Living",
    64900,
    28000,
    "A small terracotta planter for bright corners. Plant not included.",
    "planter.jpg",
    "#eee5dd",
  ],
  [
    "GS-CL-012",
    "Classic everyday tee",
    "Clothing",
    59900,
    25000,
    "A breathable cotton staple. Demo product: unisex medium.",
    "tee.jpg",
    "#ecebe8",
  ],
];
export async function seed(db) {
  if (await one(db, "SELECT id FROM users LIMIT 1")) return false;
  if (process.env.NODE_ENV === "production")
    throw new Error("Demo seeding is disabled in production.");
  const passwordHash = await bcrypt.hash(
    process.env.DEMO_PASSWORD || "GoShopDemo!2026",
    12,
  );
  const users = [
    ["admin", "Alex Rivera", "admin@goshop.local"],
    ["staff", "Sam Reyes", "staff@goshop.local"],
    ["customer", "Jamie Santos", "customer@goshop.local"],
  ];
  for (const [role, name, email] of users)
    await db.query(
      "INSERT INTO users(id,name,email,password_hash,role,phone) VALUES($1,$2,$3,$4,$5,$6)",
      [role, name, email, passwordHash, role, "09171234567"],
    );
  const customerNames = [
    "Sofia Garcia",
    "Miguel Cruz",
    "Isabella Tan",
    "Ethan Lim",
    "Mia Reyes",
    "Noah Flores",
  ];
  for (let i = 0; i < customerNames.length; i++)
    await db.query(
      "INSERT INTO users(id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5)",
      [
        `customer-${i}`,
        customerNames[i],
        `demo${i + 1}@goshop.local`,
        passwordHash,
        "customer",
      ],
    );
  await db.query("INSERT INTO settings(id,value) VALUES($1,$2)", [
    "store",
    JSON.stringify({
      storeName: "GoShop",
      shippingCents: 9900,
      freeShippingCents: 150000,
      currency: "PHP",
    }),
  ]);
  for (const name of [...new Set(products.map((p) => p[2]))])
    await db.query("INSERT INTO categories(id,name) VALUES($1,$2)", [
      name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-"),
      name,
    ]);
  for (let i = 0; i < products.length; i++) {
    const [sku, name, category, price, cost, description, image, color] =
      products[i];
    const id = `product-${i + 1}`;
    await db.query(
      "INSERT INTO products(id,sku,name,category_id,price_cents,cost_cents,description,image_url,color,stock) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,0)",
      [
        id,
        sku,
        name,
        category.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-"),
        price,
        cost,
        description,
        `/products/${image}`,
        color,
      ],
    );
    await moveStock(db, {
      product: { id, name },
      delta: 100 + i * 5,
      reason: "Demo opening inventory",
      actor: "admin",
    });
  }
  for (let i = 0; i < 48; i++) {
    const online = i % 3 !== 0;
    const user = online
      ? {
          id: i % 7 === 0 ? "customer" : `customer-${i % 6}`,
          role: "customer",
          email:
            i % 7 === 0
              ? "customer@goshop.local"
              : `demo${(i % 6) + 1}@goshop.local`,
        }
      : { id: "staff", role: "staff" };
    const items = [
      { productId: `product-${(i % 12) + 1}`, quantity: (i % 3) + 1 },
      { productId: `product-${((i + 5) % 12) + 1}`, quantity: 1 },
    ];
    if (online)
      for (const item of items)
        await db.query(
          "INSERT INTO carts(user_id,product_id,quantity) VALUES($1,$2,$3) ON CONFLICT(user_id,product_id) DO UPDATE SET quantity=EXCLUDED.quantity",
          [user.id, item.productId, item.quantity],
        );
    const expectedTotalCents = items.reduce(
      (sum, item) =>
        sum +
        products[Number(item.productId.replace("product-", "")) - 1][3] *
          item.quantity,
      0,
    );
    const order = await placeOrder(db, user, {
      channel: online ? "online" : "pos",
      name: online
        ? i % 7 === 0
          ? "Jamie Santos"
          : customerNames[i % 6]
        : "Walk-in customer",
      phone: "09171234567",
      address: online ? "123 Demo Street, Quezon City, Metro Manila" : "",
      items,
      expectedTotalCents,
      idempotencyKey: `seed-${i}`,
    });
    const daysAgo = Math.floor((47 - i) / 2);
    const date = new Date(Date.now() - daysAgo * 86400000);
    date.setUTCHours(2 + (i % 10), 15 + (i % 30), 0, 0);
    const status = !online
      ? "delivered"
      : daysAgo > 5
        ? "delivered"
        : daysAgo > 2
          ? "shipped"
          : i % 2
            ? "pending"
            : "processing";
    await db.query(
      "UPDATE orders SET created_at=$1,updated_at=$1,status=$2,tracking_number=$3 WHERE id=$4",
      [
        date.toISOString(),
        status,
        ["shipped", "delivered"].includes(status) && online
          ? `DEMO-${String(i + 1).padStart(6, "0")}`
          : "",
        order.id,
      ],
    );
    await db.query(
      "UPDATE stock_movements SET created_at=$1 WHERE order_id=$2",
      [date.toISOString(), order.id],
    );
  }
  for (const [id, target] of [
    ["product-2", 7],
    ["product-4", 4],
    ["product-7", 9],
  ]) {
    const product = await one(db, "SELECT * FROM products WHERE id=$1", [id]);
    if (product.stock !== target)
      await moveStock(db, {
        product,
        delta: target - product.stock,
        reason: "Demo stock count reconciliation",
        actor: "admin",
      });
  }
  await db.query(
    "INSERT INTO integration_runs(id,source,status,records_count,actor_id) VALUES($1,$2,$3,$4,$5)",
    [randomUUID(), "Demo opening inventory", "completed", 12, "admin"],
  );
  await db.query(
    "UPDATE stock_movements SET created_at=$1 WHERE reason='Demo opening inventory'",
    [new Date(Date.now() - 30 * 86400000).toISOString()],
  );
  return true;
}
