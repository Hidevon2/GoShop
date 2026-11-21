import { attachDatabasePool } from "@vercel/functions";
import { createPostgresDatabase } from "../server/postgres.js";
import { createApp } from "../server/app.js";

// One pool per warm function instance. Run migrations separately before release.
const db = createPostgresDatabase(process.env.DATABASE_URL);
attachDatabasePool(db.pool);
export default createApp(db);
