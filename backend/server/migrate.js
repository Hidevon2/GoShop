import { readFile } from "node:fs/promises";
import { createDatabase } from "./db.js";
import { pathToFileURL } from "node:url";
export async function migrate(db) {
  const sql = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
  await db.transaction(async (tx) => {
    for (const statement of sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean))
      await tx.query(statement);
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const db = await createDatabase();
  try {
    await migrate(db);
    console.log(`Migration 1 applied (${db.mode}).`);
  } finally {
    await db.close();
  }
}
