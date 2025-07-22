import { z } from 'zod/v4';

export const OfficeReitSchema = z.object({
  ticker: z.string(),
  vacancyRateYoY: z.number().nullable(),
  totalDebt: z.number(),
  debtDueNext2Y: z.number(),
  ffo: z.number(),
  interestExpense: z.number(),
});
export type OfficeReit = z.infer<typeof OfficeReitSchema>;
