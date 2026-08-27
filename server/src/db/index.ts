import { Pool } from 'pg';
import { config } from '../config.js';

/**
 * Single shared connection pool. Repos import `pool` and use `pool.query()`
 * directly — no prepared-statement bookkeeping like better-sqlite3 needed
 * because pg parses on the server and caches internally.
 *
 * Schema is applied by `db/migrate.ts` on server boot (see server.ts). We do
 * NOT apply it at module-import time because pg is async and the schema call
 * would return an unresolved Promise before repo modules that follow start
 * using the pool.
 */
export const pool = new Pool({
  connectionString: config.storage.databaseUrl,
  // Neon requires SSL. Local Postgres usually doesn't. `sslmode=require` in
  // the URL already handles Neon; this keeps the pool tolerant of self-signed
  // certs in dev without needing per-env config.
  ssl: config.storage.databaseUrl.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : undefined,
  max: 10,
});

export type DB = typeof pool;
