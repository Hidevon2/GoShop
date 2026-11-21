import { createDatabase } from "./db.js";
import { migrate } from "./migrate.js";
import { seed } from "./seed.js";
const db = await createDatabase();
try {
  await migrate(db);
  console.log(
    (await seed(db))
      ? "Demo data seeded. See README for local credentials."
      : "Existing data found; no data changed.",
  );
} finally {
  await db.close();
}
