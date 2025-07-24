import { FastifyInstance } from 'fastify';
import { z } from 'zod/v4';
import {
  getFlagsByTicker,
  getFlagsFiltered,
  getLatestFlags,
  getLatestFlagsForTicker,
} from '@risk-scan/etl';
import { RiskFlagSelectSchema } from '@risk-scan/db';
import { FlagsQuerySchema } from '@risk-scan/types';

export function registerFlagsHandlers(app: FastifyInstance) {
  app.get(
    '/flags',
    {
      schema: {
        querystring: FlagsQuerySchema,
        response: { 200: { type: 'array', items: RiskFlagSelectSchema } },
      },
    },
    async (req) => {
      const parsed = FlagsQuerySchema.parse(req.query);
      const tickers = parsed.tickers?.split(',');
      return getFlagsFiltered({ ...parsed, tickers });
    }
  );

  app.get(
    '/flags/latest',
    {
      config: { expiresIn: 60 },
      schema: {
        response: { 200: { type: 'array', items: RiskFlagSelectSchema } },
      },
    },
    () => getLatestFlags()
  );

  app.get(
    '/flags/:ticker',
    {
      config: { expiresIn: 300 },
      schema: {
        params: { ticker: { type: 'string' } },
        response: { 200: { type: 'array', items: RiskFlagSelectSchema } },
      },
    },
    (req) => getFlagsByTicker((req.params as any).ticker)
  );

  app.get(
    '/flags/:ticker/latest',
    {
      config: { expiresIn: 300 },
      schema: {
        params: z.object({ ticker: z.string() }),
        response: { 200: { type: 'array', items: RiskFlagSelectSchema } },
      },
    },
    async (req, res) => {
      const { ticker } = req.params as { ticker: string };
      const flags = await getLatestFlagsForTicker(ticker);
      return res.send(flags);
    }
  );
}
