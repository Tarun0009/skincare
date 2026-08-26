import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { db } from './index.js';

const here = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(resolve(here, 'schema.sql'), 'utf8');

db.exec(schema);
console.log('[migrate] schema applied');
