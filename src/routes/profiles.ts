import type { FastifyInstance } from 'fastify';
import { db } from '../supabase.js';

export async function profilesRoutes(app: FastifyInstance) {
  // GET /profiles/me - Get current user's profile
  app.get('/me', async (request, reply) => {
    const { data, error } = await db
      .from('profiles')
      .select('first_name, last_name, avatar_url')
      .eq('id', request.userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return reply.status(404).send({ error: 'Profile not found' });
      }
      throw error;
    }

    return data;
  });

  // PUT /profiles/me - Update current user's profile
  app.put<{
    Body: {
      first_name: string;
      last_name: string;
      avatar_url?: string;
    };
  }>('/me', async (request, reply) => {
    const { first_name, last_name, avatar_url } = request.body;

    const { error } = await db.from('profiles').upsert({
      id: request.userId,
      first_name,
      last_name,
      avatar_url: avatar_url || null,
    });

    if (error) throw error;
    return { success: true };
  });

  // GET /profiles/me/private - Get current user's private profile (roles)
  app.get('/me/private', async (request, reply) => {
    const { data, error } = await db
      .from('profiles_private')
      .select('isHost, isSitter')
      .eq('id', request.userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return reply.status(404).send({ error: 'Private profile not found' });
      }
      throw error;
    }

    return data;
  });

  // GET /profiles/me/subscription - Get subscription with usage limits
  app.get('/me/subscription', async (request, reply) => {
    const { data, error } = await db
      .from('profiles_private')
      .select('subscription_level_id, subscription_levels(events_per_month)')
      .eq('id', request.userId)
      .maybeSingle();

    if (error) {
      return reply
        .status(500)
        .send({ error: 'Failed to load subscription data' });
    }

    return data;
  });

  // GET /profiles/:id - Get a specific user's public profile
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { data, error } = await db
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .eq('id', request.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return reply.status(404).send({ error: 'Profile not found' });
      }
      throw error;
    }

    return data;
  });

  // GET /profiles/batch?ids=id1,id2,... - Batch lookup profiles
  app.get<{ Querystring: { ids: string } }>(
    '/batch',
    async (request, reply) => {
      const ids = request.query.ids?.split(',').filter(Boolean);
      if (!ids?.length) {
        return reply
          .status(400)
          .send({ error: 'ids query parameter required' });
      }

      const { data, error } = await db
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, created_at')
        .in('id', ids);

      if (error) throw error;
      return data || [];
    },
  );
}
