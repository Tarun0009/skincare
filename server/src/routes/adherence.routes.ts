import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { verifyFirebaseToken } from '../hooks/auth.js';
import { adherenceRepo } from '../db/adherence.repo.js';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const putBodySchema = z.object({
  stepIds: z.array(z.string().min(1).max(120)).max(50),
});

const paramsSchema = z.object({
  date: z.string().regex(ISO_DATE_RE, 'date must be YYYY-MM-DD'),
});

export async function adherenceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyFirebaseToken);

  /** Full snapshot of the user's adherence. Used on cold app boot to hydrate
   * the Redux slice so streaks survive reinstalls. */
  app.get('/adherence', async (req) => {
    const userId = req.firebaseUser!.uid;
    const checks = await adherenceRepo.findAll(userId);
    return { checks };
  });

  /** Idempotent replace-the-day: client sends the full stepIds array; server
   * overwrites or deletes as appropriate. Empty array is treated as clear. */
  app.put('/adherence/:date', async (req, reply) => {
    const userId = req.firebaseUser!.uid;

    const params = paramsSchema.safeParse(req.params);
    if (!params.success) return reply.code(400).send({ error: 'invalid_date' });

    const body = putBodySchema.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'invalid_body' });

    await adherenceRepo.putDay(userId, params.data.date, body.data.stepIds);
    return reply.code(204).send();
  });
}
