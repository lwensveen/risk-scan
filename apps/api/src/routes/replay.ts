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
import { checkCoreBank } from '@risk-scan/engine-core';
import {
  BdcSchema,
  CoreBankSchema,
  HealthcareRollupSchema,
  OfficeReitSchema,
  RegionalBankSchema,
  RiskCategoryEnum,
  StablecoinSchema,
} from '@risk-scan/types';
import { RiskFlagInsertSchema } from '@risk-scan/db';

export function registerReplayRoutes(app: FastifyInstance) {
  const ReplayParams = z.object({
    ticker: z.string().min(1),
    category: z.enum(RiskCategoryEnum.enum),
  });

  const ReplayBody = z.object({
    category: z.enum(RiskCategoryEnum.enum),
    payload: z.unknown(),
  });

  const ReplayResponse = z.union([RiskFlagInsertSchema, z.null()]);

  app.get<{
    Params: z.infer<typeof ReplayParams>;
    Reply: z.infer<typeof ReplayResponse>;
  }>(
    '/replay/:ticker/:category',
    {
      config: { cache: { expiresIn: 300 } },
      schema: {
        params: ReplayParams,
        response: { 200: ReplayResponse },
      },
    },
    async (req) => {
      const { ticker, category } = req.params;
      const [snapshot] = await getSnapshotByTicker(ticker);
      if (!snapshot || snapshot.category !== category) return null;

      switch (category) {
        case RiskCategoryEnum.enum.OfficeREIT:
          return checkOfficeREIT(OfficeReitSchema.parse(snapshot.payload));
        case RiskCategoryEnum.enum.HealthcareRollup:
          return checkHealthcareRollup(
            HealthcareRollupSchema.parse(snapshot.payload)
          );
        case RiskCategoryEnum.enum.RegionalBank:
          return checkRegionalBank(RegionalBankSchema.parse(snapshot.payload));
        case RiskCategoryEnum.enum.BDC:
          return checkBDC(BdcSchema.parse(snapshot.payload));
        case RiskCategoryEnum.enum.Stablecoin:
          return checkStablecoin(StablecoinSchema.parse(snapshot.payload));
        default:
          return null;
      }
    }
  );

  app.post<{
    Body: z.infer<typeof ReplayBody>;
    Reply: z.infer<typeof ReplayResponse>;
  }>(
    '/replay',
    {
      schema: {
        body: ReplayBody,
        response: { 200: ReplayResponse },
      },
    },
    async (req) => {
      const { category, payload } = req.body;
      switch (category) {
        case RiskCategoryEnum.enum.OfficeREIT:
          return checkOfficeREIT(OfficeReitSchema.parse(payload));
        case RiskCategoryEnum.enum.HealthcareRollup:
          return checkHealthcareRollup(HealthcareRollupSchema.parse(payload));
        case RiskCategoryEnum.enum.RegionalBank:
          return checkRegionalBank(RegionalBankSchema.parse(payload));
        case RiskCategoryEnum.enum.BDC:
          return checkBDC(BdcSchema.parse(payload));
        case RiskCategoryEnum.enum.Stablecoin:
          return checkStablecoin(StablecoinSchema.parse(payload));
        case RiskCategoryEnum.enum.CoreBank:
          return checkCoreBank(CoreBankSchema.parse(payload));
        default:
          return null;
      }
    }
  );
}
