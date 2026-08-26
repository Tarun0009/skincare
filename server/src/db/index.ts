import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from '../config.js';

mkdirSync(dirname(config.storage.dbPath), { recursive: true });

export const db = new Database(config.storage.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export type DB = typeof db;
