import { z } from 'zod/v4';

export const HealthcareRollupSchema = z.object({
  ticker: z.string(),
  debt: z.number(),
  ebitda: z.number(),
  leaseObligationsOffBS: z.number().nullable(),
  totalAssets: z.number(),
  sameStoreVisitsYoY: z.number().nullable(),
});
export type HealthcareRollup = z.infer<typeof HealthcareRollupSchema>;
