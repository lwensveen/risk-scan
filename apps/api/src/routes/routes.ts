import { FastifyInstance } from 'fastify';
import { registerDailyETLHandler } from '../handlers/daily-etl.js';
import { registerFlagsHandlers } from '../handlers/flags.js';
import { registerSnapshotRoutes } from '../handlers/snapshot.js';
import { registerReplayRoute } from '../handlers/replay.js';

export async function registerRoutes(fastify: FastifyInstance) {
  registerFlagsHandlers(fastify);
  registerSnapshotRoutes(fastify);
  registerReplayRoute(fastify);
  registerDailyETLHandler(fastify);
}
