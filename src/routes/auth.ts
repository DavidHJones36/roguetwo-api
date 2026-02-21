import type { FastifyInstance } from 'fastify';
import { db } from '../supabase.js';

/**
 * Auth routes - these are NOT protected by the auth middleware.
 * They handle signup profile/private-profile creation after Supabase Auth
 * signup completes on the client side.
 */
export async function authRoutes(app: FastifyInstance) {
  // POST /auth/signup-profile - Create profile + profiles_private after Supabase Auth signup
  // Called from the client after supabase.auth.signUp() succeeds
  app.post<{
    Body: {
      token: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string;
      role: 'host' | 'sitter';
    };
  }>('/signup-profile', async (request, reply) => {
    const { token, firstName, lastName, avatarUrl, role } = request.body;

    if (!token || !firstName || !lastName || !role) {
      return reply
        .status(400)
        .send({ error: 'token, firstName, lastName, and role are required' });
    }

    // Verify the token to get the user ID
    const { data: userData, error: userErr } = await (
      await import('../supabase.js')
    ).supabaseAuth.auth.getUser(token);
    if (userErr || !userData?.user) {
      return reply.status(401).send({ error: 'Invalid token' });
    }

    const userId = userData.user.id;

    // Create profile
    const { error: profileErr } = await db.from('profiles').insert({
      id: userId,
      first_name: firstName,
      last_name: lastName,
      avatar_url: avatarUrl || null,
    });
    if (profileErr) {
      return reply.status(500).send({ error: profileErr.message });
    }

    // Create private profile
    const { error: privateErr } = await db.from('profiles_private').insert({
      id: userId,
      isHost: role === 'host',
      isSitter: role === 'sitter',
    });
    if (privateErr) {
      return reply.status(500).send({ error: privateErr.message });
    }

    return { success: true };
  });
}
