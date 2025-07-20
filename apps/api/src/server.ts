// src/server.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import caching from '@fastify/caching';
import etag from '@fastify/etag';
import { redisStore } from 'cache-manager-redis-yet';
import { registerRoutes } from './routes.js';
import { registerGetRawBodyHook } from './hooks/raw-body-hook.js';

const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN)
  throw new Error('Missing Upstash Redis config');

export async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: '*' });
  await app.register(etag, { algorithm: 'sha1', weak: false });
  await app.register(swagger, {
    swagger: { info: { title: 'RiskScan API', version: '0.0.0' } },
  });
  await app.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list' },
  });

  const store = await redisStore({
    url: `https://:${UPSTASH_REDIS_REST_TOKEN}@${UPSTASH_REDIS_REST_URL}`,
  });
  await app.register(caching, {
    privacy: caching.privacy.PUBLIC,
    expiresIn: 0,
    cache: store,
  });

  // Hooks / routes
  registerGetRawBodyHook(app);
  await registerRoutes(app);

  return app;
}
