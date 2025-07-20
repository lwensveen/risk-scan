import { FastifyInstance } from 'fastify';
import { getSnapshotByTicker } from '@risk-scan/etl';

export function registerSnapshotRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/snapshot/:ticker',
    {
      config: { expiresIn: 600 },
      schema: {
        params: { ticker: { type: 'string' } },
        response: { 200: { type: 'array', items: { type: 'object' } } },
      },
    },
    (req) => getSnapshotByTicker((req.params as any).ticker)
  );
}
