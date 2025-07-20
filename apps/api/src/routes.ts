import { FastifyInstance } from 'fastify';
import { registerDailyETLHandler } from './handlers/dailyETL.js';
import { registerFlagsHandlers } from './handlers/flags.js';
import { registerSnapshotRoutes } from './handlers/snapshot.js';

export async function registerRoutes(fastify: FastifyInstance) {
  // Public data routes
  registerFlagsHandlers(fastify);
  registerSnapshotRoutes(fastify);

  // Internal scheduled ETL route
  registerDailyETLHandler(fastify);
}
