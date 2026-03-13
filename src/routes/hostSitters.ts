import type { FastifyInstance } from 'fastify';
import { db } from '../supabase.js';

export async function hostSittersRoutes(app: FastifyInstance) {
  // GET /host-sitters?host=:hostId - Get sitters for a host
  // GET /host-sitters?sitter=:sitterId&status=approved - Get hosts for a sitter
  app.get<{
    Querystring: { host?: string; sitter?: string; status?: string };
  }>('/', async (request, reply) => {
    const { host, sitter, status } = request.query;
    const userId = request.userId;

    if (host) {
      if (host !== userId) {
        return reply
          .status(403)
          .send({ error: "Not authorized to view this host's sitters" });
      }
      const { data, error } = await db
        .from('host_sitters')
        .select('sitter, sitter_status')
        .eq('host', host);

      if (error) throw error;
      return data || [];
    }

    if (sitter) {
      if (sitter !== userId) {
        return reply
          .status(403)
          .send({ error: "Not authorized to view this sitter's hosts" });
      }
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

  // PATCH /host-sitters - Update sitter status (deny)
  app.patch<{
    Body: {
      host: string;
      sitter: string;
      sitter_status: 'denied';
    };
  }>('/', async (request, reply) => {
    const { host, sitter, sitter_status } = request.body;
    const userId = request.userId;

    // Only the host can deny
    if (host !== userId) {
      return reply
        .status(403)
        .send({ error: 'Only the host can deny sitters' });
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
