import type { FastifyInstance } from 'fastify';
import { db } from '../supabase.js';

/**
 * Auth routes - these are NOT protected by the auth middleware.
 * They handle signup entirely server-side so auth user creation and
 * profile row insertion succeed or fail together.
 */
export async function authRoutes(app: FastifyInstance) {
  // POST /auth/signup — Create Supabase auth user + profile + profiles_private atomically.
  // The client then calls signInWithPassword() to obtain a session.
  app.post<{
    Body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string;
      phone?: string;
      role: 'host' | 'sitter';
    };
  }>('/signup', async (request, reply) => {
    const { email, password, firstName, lastName, avatarUrl, phone, role } =
      request.body;

    if (!email || !password || !firstName || !lastName || !role) {
      return reply.status(400).send({
        error: 'email, password, firstName, lastName, and role are required',
      });
    }

    // Create the auth user server-side using the service-role admin API.
    // email_confirm: true skips the confirmation email so the user can sign in immediately.
    const { data: userData, error: createErr } = await db.auth.admin.createUser(
      {
        email,
        password,
        email_confirm: true,
      },
    );
    if (createErr || !userData?.user) {
      return reply
        .status(400)
        .send({ error: createErr?.message ?? 'Failed to create user' });
    }

    const userId = userData.user.id;

    // Create profile — on failure, clean up the auth user first.
    const { error: profileErr } = await db.from('profiles').insert({
      id: userId,
      first_name: firstName,
      last_name: lastName,
      avatar_url: avatarUrl || null,
    });
    if (profileErr) {
      await db.auth.admin.deleteUser(userId);
      return reply.status(500).send({ error: profileErr.message });
    }

    // Create private profile — on failure, clean up both the profile and auth user.
    const { error: privateErr } = await db.from('profiles_private').insert({
      id: userId,
      isHost: role === 'host',
      isSitter: role === 'sitter',
      phone: phone || null,
      approved: role === 'sitter', // sitters are auto-approved; hosts require admin approval
    });
    if (privateErr) {
      await db.auth.admin.deleteUser(userId);
      return reply.status(500).send({ error: privateErr.message });
    }

    return { success: true };
  });
}
