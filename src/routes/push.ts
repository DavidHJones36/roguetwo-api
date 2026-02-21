import type { FastifyInstance } from 'fastify';
import {
  registerPushSubscription,
  unregisterPushSubscription,
} from '../utils/notificationHub.js';

export async function pushRoutes(app: FastifyInstance) {
  // POST /push/register - Register push notification subscription
  app.post<{
    Body: {
      subscription: {
        endpoint: string;
        keys: {
          p256dh: string;
          auth: string;
        };
      };
      userId: string;
    };
  }>('/register', async (request, reply) => {
    const { subscription, userId } = request.body;

    if (!subscription || !userId) {
      return reply
        .status(400)
        .send({ error: 'subscription and userId required' });
    }

    // Ensure the user can only register for themselves
    if (userId !== request.userId) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const sanitizedSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };

    await registerPushSubscription(userId, sanitizedSubscription);
    return { success: true };
  });

  // POST /push/unregister - Unregister push notification subscription
  app.post<{
    Body: {
      userId: string;
      endpoint?: string;
    };
  }>('/unregister', async (request, reply) => {
    const { userId } = request.body;

    if (!userId) {
      return reply.status(400).send({ error: 'userId required' });
    }

    if (userId !== request.userId) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    await unregisterPushSubscription(userId);
    return { success: true };
  });
}
