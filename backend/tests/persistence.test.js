import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { createDatabase, one } from "../server/db.js";

test("filesystem PostgreSQL preserves committed records after closing and reopening", async () => {
  const root = resolve(".data/persistence-tests"),
    directory = resolve(root, randomUUID());
  assert.ok(
    directory.startsWith(root + "\\") || directory.startsWith(root + "/"),
  );
  let first, second;
  try {
    first = await createDatabase({ url: "", directory });
    await first.query(
      "CREATE TABLE persistence_probe(id TEXT PRIMARY KEY, value INTEGER NOT NULL)",
    );
    await first.query("INSERT INTO persistence_probe(id,value) VALUES($1,$2)", [
      "saved",
      42,
    ]);
    await first.close();
    first = null;
    second = await createDatabase({ url: "", directory });
    assert.equal(
      (
        await one(second, "SELECT value FROM persistence_probe WHERE id=$1", [
          "saved",
        ])
      ).value,
      42,
    );
  } finally {
    if (first) await first.close();
    if (second) await second.close();
    // The resolved test directory was checked against this exact workspace test root above.
    await rm(directory, { recursive: true, force: true });
  }
});
