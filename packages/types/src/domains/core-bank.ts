import { z } from 'zod/v4';

export const CoreBankSchema = z.object({
  ticker: z.string(),
  durationGapYears: z.number().nullable(),
  ltvRatio: z.number().nullable(),
  tier1CapitalRatio: z.number().nullable(),
  interestCoverage: z.number().nullable(),
});
export type CoreBank = z.infer<typeof CoreBankSchema>;
