import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Receiver } from '@upstash/qstash';
import {
  detectCategoryFromTicker,
  ingestSnapshots,
  upsertFlag,
} from '@risk-scan/etl';
import { runCoreBankRisk } from '@risk-scan/engine-core';
import getRawBody from 'raw-body';
import { runTailRisk } from '@risk-scan/engine-tail';
import { RiskFlagEnum, riskScanConfig } from '@risk-scan/types';
import { invalidateCache, sendSlackFlags } from '@risk-scan/utils';
import { fetchLatest10KFootnote } from '@risk-scan/etl/dist/queries/fetch-10k-footnote.js';
import { detectGoingConcern } from '@risk-scan/ai';
import { persistFlags } from '@risk-scan/db';

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey:
    process.env.QSTASH_NEXT_SIGNING_KEY ??
    process.env.QSTASH_CURRENT_SIGNING_KEY!,
});

export function registerDailyETLHandler(app: FastifyInstance) {
  app.post(
    '/internal/riskscan-daily',
    {
      preHandler: async (req: FastifyRequest, reply: FastifyReply) => {
        const raw = await getRawBody(req.raw);
        const sig = req.headers['upstash-signature'];
        if (typeof sig !== 'string') {
          return reply.code(401).send({ error: 'Missing signature' });
        }
        const valid = await receiver.verify({
          signature: sig,
          body: raw.toString('utf8'),
          url: req.url,
        });
        if (!valid) return reply.code(401).send({ error: 'Invalid signature' });
      },
      schema: { response: { 204: { type: 'null' } } },
    },
    async (_req, reply) => {
      app.log.info('[qstash] daily ETL started');

      await ingestSnapshots();

      const [coreFlags, tailFlags] = await Promise.all([
        runCoreBankRisk(),
        runTailRisk(riskScanConfig),
      ]);

      const flags = [...coreFlags, ...tailFlags];
      if (flags.length) {
        await persistFlags(flags);

        const tickers = [...new Set(flags.map((f) => f.ticker))];
        const keys = [
          'flags_latest',
          ...tickers.map((t) => `flags_${t}`),
          ...tickers.map((t) => `snapshot_${t}`),
        ];

        await invalidateCache(keys);
        await sendSlackFlags(flags);
      }

      reply.code(204).send();
    }
  );

  app.post(
    '/internal/check-gc',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['ticker'],
          properties: {
            ticker: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              ticker: { type: 'string' },
              goingConcern: { type: 'boolean' },
              flagged: { type: 'boolean' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (req, res) => {
      const { ticker } = req.query as { ticker: string };

      try {
        const footnote = await fetchLatest10KFootnote(ticker);
        if (!footnote) {
          return res.status(404).send({ error: 'No footnote found' });
        }

        const goingConcern = await detectGoingConcern(footnote);
        if (!goingConcern) {
          return res.send({ ticker, goingConcern: false, flagged: false });
        }

        await upsertFlag(
          ticker,
          detectCategoryFromTicker(ticker),
          RiskFlagEnum.GoingConcern
        );

        return res.send({ ticker, goingConcern: true, flagged: true });
      } catch (err) {
        req.log.error(err, 'GC scan failed');
        return res.status(500).send({ error: 'GC scan failed' });
      }
    }
  );
}
