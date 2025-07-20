import { FastifyInstance } from 'fastify';
import { RiskFlagSchema } from '@risk-scan/types';
import { getFlagsByTicker, getLatestFlags } from '@risk-scan/etl';

export function registerFlagsHandlers(app: FastifyInstance) {
  app.get(
    '/flags/latest',
    {
      config: { expiresIn: 60 },
      schema: {
        response: { 200: { type: 'array', items: RiskFlagSchema } },
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
        response: { 200: { type: 'array', items: RiskFlagSchema } },
      },
    },
    (req) => getFlagsByTicker((req.params as any).ticker)
  );
}
