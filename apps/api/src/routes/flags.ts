import { FastifyInstance } from 'fastify';
import { z } from 'zod/v4';
import {
  getFlagsByTicker,
  getFlagsFiltered,
  getLatestFlags,
  getLatestFlagsForTicker,
} from '@risk-scan/etl';
import { FlagsQuerySchema } from '@risk-scan/types';
import { RiskFlagSelectSchema } from '@risk-scan/db';

export function registerFlagRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: z.infer<typeof FlagsQuerySchema>;
    Reply: z.infer<typeof RiskFlagSelectSchema>[];
  }>(
    '/flags',
    {
      schema: {
        querystring: FlagsQuerySchema,
        response: { 200: RiskFlagSelectSchema.array() },
      },
    },
    async (req) => {
      const tickers = req.query.tickers?.split(',');
      return getFlagsFiltered({ ...req.query, tickers });
    }
  );

  app.get<{
    Reply: z.infer<typeof RiskFlagSelectSchema>[];
  }>(
    '/flags/latest',
    {
      config: { cache: { expiresIn: 600 } },
      schema: { response: { 200: RiskFlagSelectSchema.array() } },
    },
    () => getLatestFlags()
  );

  app.get<{
    Params: { ticker: string };
    Reply: z.infer<typeof RiskFlagSelectSchema>[];
  }>(
    '/flags/:ticker',
    {
      config: { cache: { expiresIn: 600 } },
      schema: {
        params: z.object({ ticker: z.string().min(1) }),
        response: { 200: RiskFlagSelectSchema.array() },
      },
    },
    (req) => getFlagsByTicker(req.params.ticker)
  );

  app.get<{
    Params: { ticker: string };
    Reply: z.infer<typeof RiskFlagSelectSchema>[];
  }>(
    '/flags/:ticker/latest',
    {
      config: { cache: { expiresIn: 600 } },
      schema: {
        params: z.object({ ticker: z.string().min(1) }),
        response: { 200: RiskFlagSelectSchema.array() },
      },
    },
    async (req, res) => {
      const flags = await getLatestFlagsForTicker(req.params.ticker);
      return res.send(flags);
    }
  );
}
