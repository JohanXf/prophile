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
    max: 10,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 15_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pool;
}

pool.on("error", (err) => {
  console.error("Database pool error:", err.message);
});

const TRANSIENT_PG_CODES = new Set([
  "57P01", // admin_shutdown
  "57P02", // crash_shutdown
  "57P03", // cannot_connect_now (Cloud SQL waking from scale-to-zero)
  "08000",
  "08001",
  "08003",
  "08004",
  "08006",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
]);

export function isTransientDbError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string; cause?: unknown };
  if (err.code && TRANSIENT_PG_CODES.has(err.code)) return true;
  const msg = (err.message || "").toLowerCase();
  if (
    msg.includes("connection terminated") ||
    msg.includes("econnreset") ||
    msg.includes("econnrefused") ||
    msg.includes("timeout") ||
    msg.includes("socket hang up") ||
    msg.includes("the database system is starting up") ||
    msg.includes("cannot connect now")
  ) {
    return true;
  }
  if (err.cause && err.cause !== error) {
    return isTransientDbError(err.cause);
  }
  return false;
}

export async function withDbRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries && isTransientDbError(error)) {
        const delayMs = attempt === 0 ? 500 : 1200;
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const db = drizzle(pool, { schema });
