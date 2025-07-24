import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Receiver } from '@upstash/qstash';
import { z } from 'zod';
import {
  detectCategoryFromTicker,
  ingestSnapshots,
  upsertFlag,
} from '@risk-scan/etl';
import { runCoreBankRisk } from '@risk-scan/engine-core';
import { runTailRisk } from '@risk-scan/engine-tail';
import { RiskFlagEnum, riskScanConfig } from '@risk-scan/types';
import { invalidateCache, sendSlackFlags } from '@risk-scan/utils';
import { fetchLatest10KFootnote } from '@risk-scan/etl/dist/queries/fetch-10k-footnote.js';
import { detectGoingConcern } from '@risk-scan/ai';
import { persistFlags } from '@risk-scan/db';
import getRawBody from 'raw-body';

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey:
    process.env.QSTASH_NEXT_SIGNING_KEY ??
    process.env.QSTASH_CURRENT_SIGNING_KEY!,
});

const CheckGcQuery = z.object({ ticker: z.string().min(1) });

export function registerInternalRoutes(fastify: FastifyInstance) {
  fastify.post<{
    Reply: null;
  }>(
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
      schema: {
        response: { 204: z.null() },
      },
    },
    async (_req, reply) => {
      fastify.log.info('[qstash] daily ETL started');

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

  fastify.post<{
    Querystring: z.infer<typeof CheckGcQuery>;
    Reply:
      | { ticker: string; goingConcern: boolean; flagged: boolean }
      | { error: string };
  }>(
    '/internal/check-gc',
    {
      schema: {
        querystring: CheckGcQuery,
        response: {
          200: z.object({
            ticker: z.string(),
            goingConcern: z.boolean(),
            flagged: z.boolean(),
          }),
          404: z.object({ error: z.string() }),
          500: z.object({ error: z.string() }),
        },
      },
    },
    async (req, res) => {
      const { ticker } = req.query;

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
