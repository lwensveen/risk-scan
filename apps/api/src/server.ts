import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import caching from '@fastify/caching';
import etag from '@fastify/etag';
import { redisStore } from 'cache-manager-redis-yet';
import {
  jsonSchemaTransform,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { registerRoutes } from './routes/routes.js';
import { registerGetRawBodyHook } from './hooks/raw-body-hook.js';
import { VERSION } from '@risk-scan/utils';

export async function buildServer() {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  await app.register(cors, { origin: '*' });
  await app.register(etag, { algorithm: 'sha1', weak: false });

  await app.register(swagger, {
    openapi: {
      info: { title: 'RiskScan API', version: VERSION },
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list' },
  });

  app.get('/openapi.json', async () => app.swagger());

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
