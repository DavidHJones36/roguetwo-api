import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { supabaseAuth } from '../supabase.js';

const SKIP_AUTH = new Set(['/health', '/auth/signup-profile']);

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
  }
}

async function authPluginFn(app: FastifyInstance) {
  app.addHook(
    'preHandler',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (request.method === 'OPTIONS') return;
      if (SKIP_AUTH.has(request.url)) return;

      const authHeader = request.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

      if (!token) {
        return reply.status(401).send({ error: 'Missing bearer token' });
      }

      const { data, error } = await supabaseAuth.auth.getUser(token);
      if (error || !data?.user) {
        return reply.status(401).send({ error: 'Invalid token' });
      }

      request.userId = data.user.id;
    },
  );
}

export const authPlugin = fp(authPluginFn, {
  name: 'auth',
});
