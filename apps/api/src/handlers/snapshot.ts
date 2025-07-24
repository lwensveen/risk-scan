import { FastifyInstance } from 'fastify';
import { getSnapshotByTicker, getSnapshotsFiltered } from '@risk-scan/etl';
import { SnapshotQuerySchema } from '@risk-scan/types';

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

  fastify.get(
    '/snapshot',
    {
      schema: {
        querystring: SnapshotQuerySchema,
        response: { 200: { type: 'array', items: { type: 'object' } } },
      },
    },
    async (req) => {
      const parsed = SnapshotQuerySchema.parse(req.query);
      return getSnapshotsFiltered(parsed);
    }
  );
}
