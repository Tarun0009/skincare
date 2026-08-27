import type { FastifyInstance } from 'fastify';
import { scansService } from '../services/scans.service.js';
import { verifyFirebaseToken } from '../hooks/auth.js';
import { config } from '../config.js';

export async function scanRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyFirebaseToken);

  app.post('/scans', async (req, reply) => {
    const userId = req.firebaseUser!.uid;

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
    const userId = req.firebaseUser!.uid;
    const limit = Math.min(Number((req.query as { limit?: string }).limit ?? 50), 200);
    return { scans: scansService.list(userId, limit) };
  });

  app.get('/scans/:id', async (req, reply) => {
    const userId = req.firebaseUser!.uid;
    const { id } = req.params as { id: string };
    const scan = scansService.get(userId, id);
    if (!scan) return reply.code(404).send({ error: 'not_found' });
    return scan;
  });

  app.get('/scans/compare/latest', async (req, reply) => {
    const userId = req.firebaseUser!.uid;
    const comparison = await scansService.compareLatestToBaseline(userId);
    if (!comparison) return reply.code(404).send({ error: 'not_enough_scans' });
    return comparison;
  });
}
