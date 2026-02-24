import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { supabaseAuth, db } from '../supabase.js';

const SKIP_AUTH = new Set(['/health', '/auth/signup']);

// Routes where an authenticated but unapproved user is still allowed through.
// e.g. fetching their own private profile so the client can show a pending screen.
const SKIP_APPROVAL = new Set(['/profiles/me/private']);

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

      if (!SKIP_APPROVAL.has(request.url)) {
        const { data: profile } = await db
          .from('profiles_private')
          .select('approved')
          .eq('id', request.userId)
          .single();
        if (!profile?.approved) {
          return reply.status(403).send({ error: 'Account pending approval' });
        }
      }
    },
  );
}

export const authPlugin = fp(authPluginFn, {
  name: 'auth',
});
