import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { pool } from './index.js';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Apply the schema. Idempotent — every statement uses `IF NOT EXISTS` so it's
 * safe to run on every boot and safe to run manually via `npm run migrate`.
 */
export async function applySchema(): Promise<void> {
  const schema = readFileSync(resolve(here, 'schema.sql'), 'utf8');
  await pool.query(schema);
}

// When run directly (`npm run migrate`), apply and exit.
const isCli = process.argv[1] && process.argv[1].endsWith('migrate.ts');
if (isCli) {
  applySchema()
    .then(() => {
      console.log('[migrate] schema applied');
      return pool.end();
    })
    .catch((err) => {
      console.error('[migrate] failed', err);
      process.exit(1);
    });
}
