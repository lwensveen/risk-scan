import Fastify from 'fastify';
import cors from '@fastify/cors';
import caching from '@fastify/caching';
import etag from '@fastify/etag';
import { redisStore } from 'cache-manager-redis-yet';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import swaggerPlugin from './plugins/swagger.js';
import { registerRoutes } from './routes/index.js';
import { registerGetRawBodyHook } from './hooks/raw-body-hook.js';

export async function buildServer() {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  await app.register(cors, { origin: '*' });
  await app.register(etag, { algorithm: 'sha1', weak: false });
  await app.register(swaggerPlugin);

  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, NODE_ENV } =
    process.env;

  if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
    const store = await redisStore({
      url: `https://:${UPSTASH_REDIS_REST_TOKEN}@${UPSTASH_REDIS_REST_URL}`,
    });

    await app.register(caching, {
      privacy: caching.privacy.PUBLIC,
      expiresIn: 0,
      cache: store,
    });
  } else if (NODE_ENV !== 'test') {
    app.log.warn('Upstash Redis not configured – HTTP caching disabled');
  }

  registerGetRawBodyHook(app);
  await registerRoutes(app);

  return app;
}
