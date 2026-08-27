import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import cors from '@fastify/cors';

import { config } from './config.js';
import { scanRoutes } from './routes/scans.routes.js';
import { healthRoutes } from './routes/health.routes.js';
// Boot Firebase Admin + Cloudinary at startup so a bad config fails fast
// with a clear error instead of on the first request.
import './services/firebase.js';
import './services/cloudinary.js';

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

await app.register(healthRoutes);
await app.register(scanRoutes);

try {
  await app.listen({ host: config.host, port: config.port });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
