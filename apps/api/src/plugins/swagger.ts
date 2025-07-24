import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import {
  jsonSchemaTransform,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { VERSION } from '@risk-scan/utils';

export default fp(async function swaggerPlugin(fastify) {
  fastify.withTypeProvider<ZodTypeProvider>();

  await fastify.register(swagger, {
    openapi: {
      info: { title: 'RiskScan API', version: VERSION },
    },
    transform: jsonSchemaTransform,
  });

  await fastify.register(swaggerUI, {
    routePrefix: '/docs',
  });

  fastify.get('/openapi.json', async () => fastify.swagger());
});
