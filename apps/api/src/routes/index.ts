import { FastifyInstance } from 'fastify';
import { registerInternalRoutes } from './daily-etl.js';
import { registerFlagRoutes } from './flags.js';
import { registerReplayRoutes } from './replay.js';
import { registerSnapshotRoutes } from './snapshot.js';
import { registerMetaRoutes } from './meta.js';

export async function registerRoutes(fastify: FastifyInstance) {
  registerFlagRoutes(fastify);
  registerInternalRoutes(fastify);
  registerMetaRoutes(fastify);
  registerReplayRoutes(fastify);
  registerSnapshotRoutes(fastify);
}
