import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import jwt from '@fastify/jwt';
import staticFiles from '@fastify/static';
import cors from '@fastify/cors';
import { resolve } from 'node:path';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

import { config } from './config.js';
import { db } from './db/index.js';
import { authRoutes } from './routes/auth.routes.js';
import { scanRoutes } from './routes/scans.routes.js';
import { healthRoutes } from './routes/health.routes.js';

const here = dirname(fileURLToPath(import.meta.url));

// Apply schema on boot so `npm run dev` just works.
const schema = readFileSync(resolve(here, 'db/schema.sql'), 'utf8');
db.exec(schema);

mkdirSync(config.storage.photoDir, { recursive: true });

const app = Fastify({
  logger:
    config.env === 'development'
      ? { transport: { target: 'pino-pretty' } }
      : true,
  bodyLimit: config.storage.photoMaxBytes + 1024 * 128,
});

await app.register(cors, { origin: true });
await app.register(multipart, {
  limits: { fileSize: config.storage.photoMaxBytes },
});
await app.register(jwt, {
  secret: config.auth.jwtSecret,
  sign: { expiresIn: config.auth.jwtExpiresIn },
});
await app.register(staticFiles, {
  root: resolve(config.storage.photoDir),
  prefix: '/photos/',
  decorateReply: false,
});

await app.register(healthRoutes);
await app.register(authRoutes);
await app.register(scanRoutes);

try {
  await app.listen({ host: config.host, port: config.port });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
