import { z } from 'zod/v4';

export const RegionalBankSchema = z.object({
  ticker: z.string(),
  creLoans: z.number().nullable(),
  totalLoans: z.number(),
  liquidAssets: z.number(),
  deposits: z.number(),
  npaMoM: z.number().nullable(),
});
export type RegionalBank = z.infer<typeof RegionalBankSchema>;
