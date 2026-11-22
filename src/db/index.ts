import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.ts";

const globalForDb = globalThis as unknown as {
  pgPool: Pool | undefined;
};

export const pool =
  globalForDb.pgPool ??
  new Pool({
    host: process.env.SQL_HOST,
    port: 5432,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    ssl: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pool;
}

pool.on("error", (err) => {
  console.error("Database pool error:", err.message);
});

export const db = drizzle(pool, { schema });
