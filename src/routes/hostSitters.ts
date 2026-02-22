import type { FastifyInstance } from 'fastify';
import { db } from '../supabase.js';

export async function hostSittersRoutes(app: FastifyInstance) {
  // GET /host-sitters?host=:hostId - Get sitters for a host
  // GET /host-sitters?sitter=:sitterId&status=approved - Get hosts for a sitter
  app.get<{
    Querystring: { host?: string; sitter?: string; status?: string };
  }>('/', async (request, reply) => {
    const { host, sitter, status } = request.query;

    if (host) {
      // Host listing their sitters
      let query = db
        .from('host_sitters')
        .select('sitter, sitter_status')
        .eq('host', host);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }

    if (sitter) {
      // Sitter listing their hosts
      let query = db.from('host_sitters').select('host').eq('sitter', sitter);

      if (status) {
        query = query.eq('sitter_status', status as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }

    return reply
      .status(400)
      .send({ error: 'host or sitter query parameter required' });
  });

  // GET /host-sitters/status?host=:hostId&sitter=:sitterId - Check relationship status
  app.get<{
    Querystring: { host: string; sitter: string };
  }>('/status', async (request, reply) => {
    const { host, sitter } = request.query;
    if (!host || !sitter) {
      return reply
        .status(400)
        .send({ error: 'host and sitter query parameters required' });
    }

    const { data, error } = await db
      .from('host_sitters')
      .select('sitter_status')
      .eq('host', host)
      .eq('sitter', sitter)
      .maybeSingle();

    if (error) throw error;
    return data;
  });

  // POST /host-sitters - Create a new host-sitter relationship
  app.post<{
    Body: {
      host: string;
      sitter: string;
      sitter_status: 'pending' | 'approved' | 'invited';
    };
  }>('/', async (request, reply) => {
    const { host, sitter, sitter_status } = request.body;
    const userId = request.userId;

    // Only the sitter themselves can request to join
    if (sitter !== userId) {
      return reply
        .status(403)
        .send({ error: 'Can only create relationships for yourself' });
    }

    // A host cannot add themselves as a sitter
    if (host === sitter) {
      return reply
        .status(403)
        .send({ error: 'A host cannot join their own sitter network' });
    }

    const { data: profile } = await db
      .from('profiles_private')
      .select('isHost')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.isHost) {
      return reply
        .status(403)
        .send({ error: 'Hosts cannot join a sitter network' });
    }

    const { error } = await db.from('host_sitters').insert({
      host,
      sitter,
      sitter_status,
    });

    if (error) throw error;
    reply.status(201);
    return { success: true };
  });

  // PATCH /host-sitters - Update sitter status (approve/deny)
  app.patch<{
    Body: {
      host: string;
      sitter: string;
      sitter_status: 'approved' | 'denied';
    };
  }>('/', async (request, reply) => {
    const { host, sitter, sitter_status } = request.body;
    const userId = request.userId;

    // Only the host can approve/deny
    if (host !== userId) {
      return reply
        .status(403)
        .send({ error: 'Only the host can approve or deny sitters' });
    }

    const { error } = await db
      .from('host_sitters')
      .update({ sitter_status })
      .eq('sitter', sitter)
      .eq('host', host);

    if (error) throw error;
    return { success: true };
  });

  // DELETE /host-sitters - Remove a host-sitter relationship
  app.delete<{
    Querystring: { host: string; sitter: string };
  }>('/', async (request, reply) => {
    const { host, sitter } = request.query;
    const userId = request.userId;

    if (!host || !sitter) {
      return reply
        .status(400)
        .send({ error: 'host and sitter query parameters required' });
    }

    // Either the host or the sitter can delete the relationship
    if (host !== userId && sitter !== userId) {
      return reply
        .status(403)
        .send({ error: 'Not authorized to delete this relationship' });
    }

    const { error } = await db
      .from('host_sitters')
      .delete()
      .eq('host', host)
      .eq('sitter', sitter);

    if (error) throw error;
    return { success: true };
  });
}
