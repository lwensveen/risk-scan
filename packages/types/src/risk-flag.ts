import z from 'zod/v4';
import { RiskCategoryEnum, SeverityEnum } from './enums.js';

export const RiskFlagSchema = z.object({
  id: z.string().optional(),
  category: RiskCategoryEnum,
  ticker: z.string(),
  flags: z.array(z.string()).min(1),
  severity: SeverityEnum,
  ts: z.number().int(),
});
export type RiskFlag = z.infer<typeof RiskFlagSchema>;
