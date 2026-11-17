
import { Pool } from "pg";

const globalForPg = globalThis as typeof globalThis & {
  pgPool?: Pool;
};

const pool: Pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.SQL_URI,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

export default pool;
