import pg from "pg";

export function createPostgresDatabase(url) {
  if (!url) throw new Error("DATABASE_URL is required for hosted GoShop.");
  const pool = new pg.Pool({
    connectionString: url,
    max: 10,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 15000,
  });
  // Report background connection errors without exposing connection details.
  pool.on("error", () => console.error("An idle PostgreSQL connection failed."));
  return {
    mode: "neon-postgres",
    pool,
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
