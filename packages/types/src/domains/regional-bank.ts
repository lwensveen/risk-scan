import { z } from 'zod/v4';

export const RegionalBankSchema = z.object({
  ticker: z.string(),
  creLoans: z.number().nullable(),
  totalLoans: z.number(),
  liquidAssets: z.number(),
  deposits: z.number(),
  npaMoM: z.number().nullable(),
  htmSecurities: z.number().nullable(),
  totalAssets: z.number(),
  aoci: z.number().nullable(),
  tier1Capital: z.number(),
  uninsuredDeposits: z.number().nullable(),
  totalDeposits: z.number(),
});
export type RegionalBank = z.infer<typeof RegionalBankSchema>;
