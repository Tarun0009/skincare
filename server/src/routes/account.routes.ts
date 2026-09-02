import type { FastifyInstance } from 'fastify';
import { verifyFirebaseToken } from '../hooks/auth.js';
import { deleteAccount } from '../services/account.service.js';

export async function accountRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyFirebaseToken);

  /**
   * Erases the authenticated user everywhere: Cloudinary photos, Postgres
   * scans, then the Firebase account. Idempotent — a second call after
   * successful deletion will 401 because the ID token is revoked (the user
   * is gone), which is the correct behavior.
   */
  app.delete('/me', async (req, reply) => {
    const userId = req.firebaseUser!.uid;
    const summary = await deleteAccount(userId);
    return reply.code(200).send(summary);
  });
}
