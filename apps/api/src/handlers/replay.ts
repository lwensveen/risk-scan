import { FastifyInstance } from 'fastify';
import { z } from 'zod/v4';
import { getSnapshotByTicker } from '@risk-scan/etl';
import {
  checkBDC,
  checkHealthcareRollup,
  checkOfficeREIT,
  checkRegionalBank,
  checkStablecoin,
} from '@risk-scan/engine-tail';
import {
  BdcSchema,
  CoreBankSchema,
  HealthcareRollupSchema,
  OfficeReitSchema,
  RegionalBankSchema,
  RiskCategory,
  RiskCategoryEnum,
  StablecoinSchema,
} from '@risk-scan/types';
import { checkCoreBank } from '@risk-scan/engine-core';
import { RiskFlagSelectSchema } from '@risk-scan/db';

export function registerReplayRoute(app: FastifyInstance) {
  app.get(
    '/replay/:ticker/:category',
    {
      schema: {
        params: z
          .object({
            ticker: z.string(),
            category: RiskCategoryEnum,
          })
          .strict(),
        response: {
          200: {
            anyOf: [RiskFlagSelectSchema, { type: 'null' }],
          },
        },
      },
    },
    async (req) => {
      const { ticker, category } = req.params as {
        ticker: string;
        category: string;
      };
      const [snapshot] = await getSnapshotByTicker(ticker);

      if (!snapshot || snapshot.category !== category) return null;

      switch (category) {
        case 'OfficeREIT':
          return checkOfficeREIT(OfficeReitSchema.parse(snapshot.payload));
        case 'HealthcareRollup':
          return checkHealthcareRollup(
            HealthcareRollupSchema.parse(snapshot.payload)
          );
        case 'RegionalBank':
          return checkRegionalBank(RegionalBankSchema.parse(snapshot.payload));
        case 'BDC':
          return checkBDC(BdcSchema.parse(snapshot.payload));
        case 'Stablecoin':
          return checkStablecoin(StablecoinSchema.parse(snapshot.payload));
        default:
          return null;
      }
    }
  );

  app.post(
    '/replay',
    {
      schema: {
        body: z.object({
          category: RiskCategoryEnum,
          payload: z.unknown(),
        }),
        response: {
          200: {
            anyOf: [RiskFlagSelectSchema, { type: 'null' }],
          },
        },
      },
    },
    async (req) => {
      const { category, payload } = req.body as {
        category: RiskCategory;
        payload: unknown;
      };

      switch (category) {
        case 'OfficeREIT':
          return checkOfficeREIT(OfficeReitSchema.parse(payload));
        case 'HealthcareRollup':
          return checkHealthcareRollup(HealthcareRollupSchema.parse(payload));
        case 'RegionalBank':
          return checkRegionalBank(RegionalBankSchema.parse(payload));
        case 'BDC':
          return checkBDC(BdcSchema.parse(payload));
        case 'Stablecoin':
          return checkStablecoin(StablecoinSchema.parse(payload));
        case 'CoreBank':
          return checkCoreBank(CoreBankSchema.parse(payload));
        default:
          return null;
      }
    }
  );
}
