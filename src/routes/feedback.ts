import type { FastifyInstance } from 'fastify';
import { db } from '../supabase.js';

const VALID_CATEGORIES = ['general', 'bug', 'feature'] as const;
type FeedbackCategory = (typeof VALID_CATEGORIES)[number];

export async function feedbackRoutes(app: FastifyInstance) {
  // POST /feedback - Submit feedback
  app.post<{
    Body: {
      category: FeedbackCategory;
      message: string;
    };
  }>('/', async (request, reply) => {
    const { category, message } = request.body;

    if (!VALID_CATEGORIES.includes(category)) {
      return reply
        .status(400)
        .send({ error: 'category must be one of: general, bug, feature' });
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return reply
        .status(400)
        .send({ error: 'message must be a non-empty string' });
    }

    // Get the user's email from Supabase Auth using the userId set by the auth plugin
    const { data: userData, error: userError } =
      await db.auth.admin.getUserById(request.userId);

    if (userError || !userData?.user) {
      return reply
        .status(500)
        .send({ error: 'Failed to retrieve user information' });
    }

    const email = userData.user.email ?? null;

    const { error: insertError } = await db.from('feedback').insert({
      user_id: request.userId,
      email,
      category,
      message: message.trim(),
    });

    if (insertError) {
      app.log.error(insertError, 'Failed to insert feedback');
      return reply.status(500).send({ error: 'Failed to save feedback' });
    }

    return { success: true };
  });
}
