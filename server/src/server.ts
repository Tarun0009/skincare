// Sentry MUST init before any other imports that might throw, so its global
// hooks are in place from the very first line of application code.
import { initSentry, Sentry } from './services/sentry.js';
initSentry();

import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

import { config } from './config.js';
import { applySchema } from './db/migrate.js';
import { scanRoutes } from './routes/scans.routes.js';
import { accountRoutes } from './routes/account.routes.js';
import { adherenceRoutes } from './routes/adherence.routes.js';
import { productRoutes } from './routes/products.routes.js';
import { healthRoutes } from './routes/health.routes.js';
// Boot Firebase Admin + Cloudinary at startup so a bad config fails fast
// with a clear error instead of on the first request.
import './services/firebase.js';
import './services/cloudinary.js';

await applySchema();

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

// Global rate limit — applied to every route unless a route overrides it.
// Keyed by Firebase UID when present, so shared-IP scenarios (uni Wi-Fi,
// office NAT) don't punish innocent users.
await app.register(rateLimit, {
  max: config.rateLimit.globalPerMinute,
  timeWindow: '1 minute',
  keyGenerator: (req) => req.firebaseUser?.uid ?? req.ip,
  errorResponseBuilder: (_req, ctx) => ({
    error: 'rate_limited',
    retryAfterSeconds: Math.ceil(ctx.ttl / 1000),
  }),
});

// Report unhandled route errors to Sentry with the Fastify request tag,
// while keeping Fastify's own error serialization for the client response.
app.setErrorHandler((err, req, reply) => {
  const status = err.statusCode ?? 500;
  if (status >= 500) {
    Sentry.captureException(err, {
      tags: { route: req.routerPath ?? req.url, method: req.method },
    });
  }
  reply.send(err);
});

await app.register(healthRoutes);
await app.register(scanRoutes);
await app.register(adherenceRoutes);
await app.register(productRoutes);
await app.register(accountRoutes);

try {
  await app.listen({ host: config.host, port: config.port });
} catch (err) {
  Sentry.captureException(err);
  app.log.error(err);
  process.exit(1);
}
