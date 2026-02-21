import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { supabaseAuth } from '../supabase.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
  }
}

async function authPluginFn(app: FastifyInstance) {
  app.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
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

  // Add preHandler hook for all routes except those explicitly skipped
  app.addHook('onRoute', (routeOptions) => {
    // Skip auth for OPTIONS, health check, and auth routes
    if (routeOptions.method === 'OPTIONS') return;
    if (routeOptions.url === '/health') return;
    if (routeOptions.url?.startsWith('/auth/')) return;

    const existing = routeOptions.preHandler;
    const authHandler = async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      await (app as any).authenticate(request, reply);
    };

    if (Array.isArray(existing)) {
      routeOptions.preHandler = [authHandler, ...existing];
    } else if (existing) {
      routeOptions.preHandler = [authHandler, existing];
    } else {
      routeOptions.preHandler = [authHandler];
    }
  });
}

export const authPlugin = fp(authPluginFn, {
  name: 'auth',
});
