import { FastifyInstance } from 'fastify';
import { z } from 'zod/v4';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { getSnapshotByTicker, getSnapshotsFiltered } from '@risk-scan/etl';
import { SnapshotQuerySchema } from '@risk-scan/types';
import { EntitySnapshotSelectSchema } from '@risk-scan/db';

const SnapshotParamsSchema = z.object({
  ticker: z.string().min(1),
});

export function registerSnapshotRoutes(app: FastifyInstance) {
  const fastify = app.withTypeProvider<ZodTypeProvider>();

  fastify.get<{
    Params: z.infer<typeof SnapshotParamsSchema>;
    Reply: z.infer<typeof EntitySnapshotSelectSchema>[];
  }>(
    '/snapshot/:ticker',
    {
      config: { cache: { expiresIn: 600 } },
      schema: {
        params: SnapshotParamsSchema,
        response: { 200: EntitySnapshotSelectSchema.array() },
      },
    },
    async (req) => {
      return getSnapshotByTicker(req.params.ticker);
    }
  );

  fastify.get<{
    Querystring: z.infer<typeof SnapshotQuerySchema>;
    Reply: z.infer<typeof EntitySnapshotSelectSchema>[];
  }>(
    '/snapshot',
    {
      schema: {
        querystring: SnapshotQuerySchema,
        response: { 200: EntitySnapshotSelectSchema.array() },
      },
    },
    async (req) => {
      return getSnapshotsFiltered(req.query);
    }
  );
}
