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
      .select('isHost, isSitter, approved')
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

  // GET /profiles/my-sitters - Get profiles + status of all sitters for the current host,
  // grouped into { sitters: (active/pending), deniedSitters }
  app.get('/my-sitters', async (request) => {
    const { data: mappings, error: mappingsError } = await db
      .from('host_sitters')
      .select('sitter, sitter_status')
      .eq('host', request.userId);

    if (mappingsError) throw mappingsError;
    if (!mappings?.length) return { sitters: [], deniedSitters: [] };

    const sitterIds = mappings
      .map((r) => r.sitter)
      .filter((id): id is string => id !== null);

    const { data, error } = await db
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, created_at')
      .in('id', sitterIds);

    if (error) throw error;

    const all = (data || []).map((p) => ({
      ...p,
      sitter_status:
        mappings.find((m) => m.sitter === p.id)?.sitter_status ?? null,
    }));

    return {
      sitters: all.filter((s) => s.sitter_status !== 'denied'),
      deniedSitters: all.filter((s) => s.sitter_status === 'denied'),
    };
  });

  // GET /profiles/my-hosts - Get profiles of all approved hosts for the current sitter
  app.get('/my-hosts', async (request) => {
    const { data: mappings, error: mappingsError } = await db
      .from('host_sitters')
      .select('host')
      .eq('sitter', request.userId)
      .eq('sitter_status', 'approved');

    if (mappingsError) throw mappingsError;
    if (!mappings?.length) return [];

    const hostIds = mappings.map((r) => r.host);

    const { data, error } = await db
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, created_at')
      .in('id', hostIds);

    if (error) throw error;
    return data || [];
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
