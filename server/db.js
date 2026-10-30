import "dotenv/config";
import pg from "pg";
import { PGlite } from "@electric-sql/pglite";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

export async function createDatabase({
  url = process.env.DATABASE_URL,
  memory = false,
  directory = resolve(".data/goshop"),
} = {}) {
  if (url) {
    const pool = new pg.Pool({
      connectionString: url,
      max: 10,
      connectionTimeoutMillis: 15000,
    });
    return {
      mode: "neon-postgres",
      query: (sql, params = []) => pool.query(sql, params),
      async transaction(fn) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const result = await fn(client);
          await client.query("COMMIT");
          return result;
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        } finally {
          client.release();
        }
      },
      close: () => pool.end(),
    };
  }
  if (process.env.NODE_ENV === "production" && !memory)
    throw new Error("DATABASE_URL is required in production.");
  const dataDir = resolve(directory);
  if (!memory) await mkdir(dataDir, { recursive: true });
  const local = new PGlite(memory ? undefined : dataDir);
  await local.waitReady;
  return {
    mode: memory ? "test-postgres" : "local-postgres",
    query: (sql, params = []) => local.query(sql, params),
    transaction: (fn) => local.transaction(fn),
    close: () => local.close(),
  };
}

export async function one(db, sql, params = []) {
  return (await db.query(sql, params)).rows[0] ?? null;
}
