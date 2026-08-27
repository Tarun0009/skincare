import type { FastifyReply, FastifyRequest } from 'fastify';
import { firebaseAuth } from '../services/firebase.js';

declare module 'fastify' {
  interface FastifyRequest {
    /** Verified Firebase user, populated by `verifyFirebaseToken`. */
    firebaseUser?: { uid: string; email: string | null };
  }
}

/**
 * Fastify preHandler that verifies the `Authorization: Bearer <token>` header
 * with Firebase Admin. On success, `req.firebaseUser` is populated so route
 * handlers can read the UID without touching Firebase again.
 */
export async function verifyFirebaseToken(req: FastifyRequest, reply: FastifyReply) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'missing_token' });
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return reply.code(401).send({ error: 'missing_token' });
  }

  try {
    const decoded = await firebaseAuth.verifyIdToken(token);
    req.firebaseUser = { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    return reply.code(401).send({ error: 'invalid_token' });
  }
}
