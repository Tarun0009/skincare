import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthError, authService } from '../services/auth.service.js';
import type { AuthResponse } from '../../../shared/types.js';

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (req, reply) => {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_body', details: parsed.error.flatten() });
    }
    try {
      const user = await authService.register(parsed.data.email, parsed.data.password);
      const token = await reply.jwtSign({ sub: user.id, email: user.email });
      const res: AuthResponse = { token, userId: user.id, email: user.email };
      return reply.code(201).send(res);
    } catch (err) {
      if (err instanceof AuthError) return reply.code(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  app.post('/auth/login', async (req, reply) => {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_body' });
    }
    try {
      const user = await authService.verify(parsed.data.email, parsed.data.password);
      const token = await reply.jwtSign({ sub: user.id, email: user.email });
      const res: AuthResponse = { token, userId: user.id, email: user.email };
      return reply.send(res);
    } catch (err) {
      if (err instanceof AuthError) return reply.code(err.statusCode).send({ error: err.message });
      throw err;
    }
  });
}
