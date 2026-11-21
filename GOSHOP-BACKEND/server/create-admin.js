import "dotenv/config";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createDatabase, one } from "./db.js";
import { migrate } from "./migrate.js";
import { audit } from "./domain.js";
const parsed = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(12).max(100),
  })
  .safeParse({
    name: process.env.INITIAL_ADMIN_NAME,
    email: process.env.INITIAL_ADMIN_EMAIL,
    password: process.env.INITIAL_ADMIN_PASSWORD,
  });
if (!parsed.success) {
  console.error(
    "Set INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD (12+ characters) in private environment variables.",
  );
  process.exit(1);
}
const db = await createDatabase();
try {
  await migrate(db);
  const { name, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);
  await db.transaction(async (tx) => {
    if (await one(tx, "SELECT id FROM users WHERE email=$1", [email]))
      throw new Error(
        "An account already exists at that address. No account was changed.",
      );
    const id = randomUUID();
    await tx.query(
      "INSERT INTO users(id,name,email,password_hash,role) VALUES($1,$2,$3,$4,'admin')",
      [id, name, email, passwordHash],
    );
    await tx.query(
      "INSERT INTO settings(id,value) VALUES('store',$1) ON CONFLICT DO NOTHING",
      [
        JSON.stringify({
          storeName: "GoShop",
          currency: "PHP",
          shippingCents: 9900,
          freeShippingCents: 150000,
        }),
      ],
    );
    await tx.query(
      "INSERT INTO categories(id,name) VALUES('general','General') ON CONFLICT DO NOTHING",
    );
    await audit(tx, id, "admin.bootstrapped", "user", id);
  });
  console.log(
    "Administrator created. Remove the INITIAL_ADMIN_* bootstrap variables from the environment.",
  );
} catch (error) {
  console.error(
    error.code
      ? "Administrator setup failed. Check database connectivity and schema."
      : error.message,
  );
  process.exitCode = 1;
} finally {
  await db.close();
}
