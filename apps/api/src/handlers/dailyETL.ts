import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Receiver } from '@upstash/qstash';
import { persistFlags, runEtl } from '@risk-scan/etl';
import { runCoreBankRisk } from '@risk-scan/engine-core';
import { runTailRisk } from '@risk-scan/engine-tail';
import { invalidateCache, sendSlackFlags } from '@risk-scan/utils';
import getRawBody from 'raw-body';

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

      await runEtl();

      const [coreFlags, tailFlags] = await Promise.all([
        runCoreBankRisk(),
        runTailRisk({
          officeReitTickers: ['BXP', 'SLG', 'VNO'],
          healthcareTickers: ['AMEH', 'OSH', 'ALHC'],
          regionalBankTickers: ['FITB', 'HBAN', 'CFG'],
          bdcTickers: ['ARCC', 'GBDC'],
          stablecoinSymbols: ['USDT', 'USDC'],
        }),
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
}
