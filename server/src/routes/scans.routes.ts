import type { FastifyInstance } from 'fastify';
import { scansService } from '../services/scans.service.js';
import { config } from '../config.js';

export async function scanRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (req, reply) => {
    try {
      await req.jwtVerify();
    } catch {
      reply.code(401).send({ error: 'unauthorized' });
    }
  });

  app.post('/scans', async (req, reply) => {
    const userId = (req.user as { sub: string }).sub;

    const file = await req.file({ limits: { fileSize: config.storage.photoMaxBytes } });
    if (!file) return reply.code(400).send({ error: 'missing_photo' });
    if (!file.mimetype.startsWith('image/')) {
      return reply.code(415).send({ error: 'unsupported_media_type' });
    }

    const buffer = await file.toBuffer();
    const scan = await scansService.create(userId, buffer);
    return reply.code(201).send(scan);
  });

  app.get('/scans', async (req) => {
    const userId = (req.user as { sub: string }).sub;
    const limit = Math.min(Number((req.query as { limit?: string }).limit ?? 50), 200);
    return { scans: scansService.list(userId, limit) };
  });

  app.get('/scans/:id', async (req, reply) => {
    const userId = (req.user as { sub: string }).sub;
    const { id } = req.params as { id: string };
    const scan = scansService.get(userId, id);
    if (!scan) return reply.code(404).send({ error: 'not_found' });
    return scan;
  });

  app.get('/scans/compare/latest', async (req, reply) => {
    const userId = (req.user as { sub: string }).sub;
    const comparison = await scansService.compareLatestToBaseline(userId);
    if (!comparison) return reply.code(404).send({ error: 'not_enough_scans' });
    return comparison;
  });
}
