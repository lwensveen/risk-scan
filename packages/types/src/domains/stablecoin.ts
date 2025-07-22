import { z } from 'zod/v4';

export const StablecoinSchema = z.object({
  symbol: z.string(),
  collateralRatio: z.number(),
  topHolderShare: z.number(),
  tvlChange7d: z.number(),
});
export type Stablecoin = z.infer<typeof StablecoinSchema>;
