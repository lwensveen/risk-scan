import { FastifyInstance } from 'fastify';
import { GIT_SHA, VERSION } from '@risk-scan/utils';

export function registerMetaRoutes(fastify: FastifyInstance) {
  fastify.get('/healthz', async () => ({ ok: true }));
  fastify.get('/version', async () => ({ version: VERSION, sha: GIT_SHA }));
}
