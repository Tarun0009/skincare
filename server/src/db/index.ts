import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';

mkdirSync(dirname(config.storage.dbPath), { recursive: true });

export const db = new Database(config.storage.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Repositories prepare statements as soon as their modules are imported, so
// the schema must exist as part of database module initialization. Doing this
// later in server.ts is too late because ESM evaluates static imports first.
const here = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(resolve(here, 'schema.sql'), 'utf8');
db.exec(schema);

export type DB = typeof db;
