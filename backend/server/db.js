import "dotenv/config";
import { createPostgresDatabase } from "./postgres.js";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

export async function createDatabase({
  url = process.env.DATABASE_URL,
  memory = false,
  directory = resolve(".data/goshop"),
} = {}) {
  if (url) return createPostgresDatabase(url);
  if (process.env.NODE_ENV === "production" && !memory)
    throw new Error("DATABASE_URL is required in production.");
  const dataDir = resolve(directory);
  if (!memory) await mkdir(dataDir, { recursive: true });
  const { PGlite } = await import("@electric-sql/pglite");
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
