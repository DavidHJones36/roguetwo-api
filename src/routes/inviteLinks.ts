import type { FastifyInstance } from 'fastify';
import { db } from '../supabase.js';

export async function inviteLinksRoutes(app: FastifyInstance) {
  // GET /invite-links - List invite links for the current user
  app.get('/', async (request) => {
    const { data, error } = await db
      .from('invite_links')
      .select('id')
      .eq('host', request.userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    return data || [];
  });

  // GET /invite-links/:id - Get a specific invite link (for sitter join flow)
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { data, error } = await db
      .from('invite_links')
      .select('host, expires_at')
      .eq('id', request.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return reply.status(404).send({ error: 'Invite not found' });
    }

    return data;
  });

  // POST /invite-links - Create a new invite link
  app.post('/', async (request, reply) => {
    const { data, error } = await db
      .from('invite_links')
      .insert({ host: request.userId })
      .select()
      .single();

    if (error) throw error;
    reply.status(201);
    return data;
  });

  // DELETE /invite-links/:id - Delete an invite link
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    // Verify ownership
    const { data: existing } = await db
      .from('invite_links')
      .select('host')
      .eq('id', request.params.id)
      .single();

    if (!existing) {
      return reply.status(404).send({ error: 'Invite link not found' });
    }
    if (existing.host !== request.userId) {
      return reply
        .status(403)
        .send({ error: 'Not authorized to delete this invite link' });
    }

    const { error } = await db
      .from('invite_links')
      .delete()
      .eq('id', request.params.id);

    if (error) throw error;
    return { success: true };
  });
}
