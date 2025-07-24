import { FastifyInstance } from 'fastify';
import { registerInternalRoutes } from '../handlers/daily-etl.js';
import { registerFlagRoutes } from '../handlers/flags.js';
import { registerReplayRoutes } from '../handlers/replay.js';
import { registerSnapshotRoutes } from '../handlers/snapshot.js';
import { registerMetaRoutes } from '../handlers/meta.js';

export async function registerRoutes(fastify: FastifyInstance) {
  registerFlagRoutes(fastify);
  registerInternalRoutes(fastify);
  registerMetaRoutes(fastify);
  registerReplayRoutes(fastify);
  registerSnapshotRoutes(fastify);
}
