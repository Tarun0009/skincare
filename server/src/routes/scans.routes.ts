import type { FastifyInstance } from 'fastify';
import { scansService } from '../services/scans.service.js';
import { verifyFirebaseToken } from '../hooks/auth.js';
import { config } from '../config.js';
import { parseOnboardingField } from '../schemas/onboarding.js';
import type { OnboardingContext } from '../../../shared/types.js';

export async function scanRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyFirebaseToken);

  app.post('/scans', {
    // Tighter cap on the AI-cost endpoint. Overrides the global limit so a
    // single client can't burn the Gemini quota by hammering /scans while
    // staying under the broader 60/min cap.
    config: {
      rateLimit: {
        max: config.rateLimit.scanPerHour,
        timeWindow: '1 hour',
      },
    },
  }, async (req, reply) => {
    const userId = req.firebaseUser!.uid;

    // Read the multipart stream sequentially so the `photo` file AND the
    // optional `preferences` field are both captured, regardless of the order
    // the client appended them.
    let photoBuffer: Buffer | null = null;
    let photoMime: string | null = null;
    let onboarding: OnboardingContext | undefined;

    try {
      const parts = req.parts({ limits: { fileSize: config.storage.photoMaxBytes } });
      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'photo') {
          photoMime = part.mimetype;
          photoBuffer = await part.toBuffer();
        } else if (part.type === 'field' && part.fieldname === 'preferences') {
          // .value is typed as unknown by @fastify/multipart; the schema
          // parser tolerates non-strings by returning undefined.
          onboarding = parseOnboardingField(
            typeof part.value === 'string' ? part.value : undefined
          );
        }
      }
    } catch (err) {
      req.log.warn({ err }, 'multipart parse failed');
      return reply.code(400).send({ error: 'invalid_multipart' });
    }

    if (!photoBuffer || !photoMime) {
      return reply.code(400).send({ error: 'missing_photo' });
    }
    if (!photoMime.startsWith('image/')) {
      return reply.code(415).send({ error: 'unsupported_media_type' });
    }

    const scan = await scansService.create(userId, photoBuffer, { onboarding });
    return reply.code(201).send(scan);
  });

  app.get('/scans', async (req) => {
    const userId = req.firebaseUser!.uid;
    const limit = Math.min(Number((req.query as { limit?: string }).limit ?? 50), 200);
    return { scans: await scansService.list(userId, limit) };
  });

  app.get('/scans/:id', async (req, reply) => {
    const userId = req.firebaseUser!.uid;
    const { id } = req.params as { id: string };
    const scan = await scansService.get(userId, id);
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
