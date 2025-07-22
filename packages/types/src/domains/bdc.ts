import { z } from 'zod/v4';

export const BdcSchema = z.object({
  ticker: z.string(),
  yieldPercent: z.number(),
  navChangeYoY: z.number().nullable(),
  redemptions: z.number().nullable(),
  newInflows: z.number().nullable(),
  loanLossReserves: z.number().nullable(),
  totalLoans: z.number(),
});
export type Bdc = z.infer<typeof BdcSchema>;
