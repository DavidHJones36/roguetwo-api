import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authPlugin } from './plugins/auth.js';
import { authRoutes } from './routes/auth.js';
import { eventsRoutes } from './routes/events.js';
import { profilesRoutes } from './routes/profiles.js';
import { hostSittersRoutes } from './routes/hostSitters.js';
import { inviteLinksRoutes } from './routes/inviteLinks.js';

const app = Fastify({ logger: true });

// CORS
await app.register(cors, {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Auth plugin - adds request.userId to authenticated routes
await app.register(authPlugin);

// Routes
await app.register(authRoutes, { prefix: '/auth' });
await app.register(eventsRoutes, { prefix: '/events' });
await app.register(profilesRoutes, { prefix: '/profiles' });
await app.register(hostSittersRoutes, { prefix: '/host-sitters' });
await app.register(inviteLinksRoutes, { prefix: '/invite-links' });

// Health check
app.get('/health', async () => ({ status: 'ok' }));

const port = parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || '0.0.0.0';

try {
  await app.listen({ port, host });
  console.log(`Server running on http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
