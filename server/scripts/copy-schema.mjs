import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(projectDir, 'src/db/schema.sql');
const destination = resolve(projectDir, 'dist/server/src/db/schema.sql');

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
