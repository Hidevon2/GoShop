import "dotenv/config";
import express from "express";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { createDatabase } from "./db.js";
import { migrate } from "./migrate.js";
import { seed } from "./seed.js";
import { createApp } from "./app.js";

const db = await createDatabase();
await migrate(db);
if (process.env.SEED_DEMO === "true" && process.env.NODE_ENV !== "production")
  await seed(db);
const app = createApp(db);
if (existsSync(resolve("dist/index.html"))) {
  app.use(express.static(resolve("dist"), { redirect: false }));
  app.get("/{*path}", (req, res) => res.sendFile(resolve("dist/index.html")));
}
const port = Number(process.env.PORT || 3001);
const server = app.listen(
  port,
  process.env.HOST ||
    (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1"),
  () =>
    console.log(`GoShop API: http://localhost:${port} | Database: ${db.mode}`),
);
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  server.close(async () => {
    await db.close();
    process.exit(0);
  });
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
