import { z } from 'zod';

export const SeverityEnum = z.enum(['low', 'medium', 'high']);
export type Severity = z.infer<typeof SeverityEnum>;

export const RiskCategoryEnum = z.enum([
  'BDC',
  'CoreBank',
  'HealthcareRollup',
  'OfficeREIT',
  'RegionalBank',
  'Stablecoin',
]);
export type RiskCategory = z.infer<typeof RiskCategoryEnum>;

export const RiskFlagSchema = z.object({
  id: z.string().optional(), // db id – optional at creation time
  category: RiskCategoryEnum,
  ticker: z.string(),
  flags: z.array(z.string()).min(1),
  severity: SeverityEnum,
  ts: z.number().int(), // epoch milliseconds
});
export type RiskFlag = z.infer<typeof RiskFlagSchema>;

export const OfficeReitSchema = z.object({
  ticker: z.string(),
  vacancyRateYoY: z.number().nullable(), // ⬅ can be missing
  totalDebt: z.number(),
  debtDueNext2Y: z.number(),
  ffo: z.number(),
  interestExpense: z.number(),
});
export type OfficeReit = z.infer<typeof OfficeReitSchema>;

export const HealthcareRollupSchema = z.object({
  ticker: z.string(),
  debt: z.number(),
  ebitda: z.number(),
  leaseObligationsOffBS: z.number().nullable(), // ⬅
  totalAssets: z.number(),
  sameStoreVisitsYoY: z.number().nullable(), // ⬅
});
export type HealthcareRollup = z.infer<typeof HealthcareRollupSchema>;

export const RegionalBankSchema = z.object({
  ticker: z.string(),
  creLoans: z.number().nullable(), // ⬅
  totalLoans: z.number(),
  liquidAssets: z.number(),
  deposits: z.number(),
  npaMoM: z.number().nullable(), // ⬅
});
export type RegionalBank = z.infer<typeof RegionalBankSchema>;

export const BdcSchema = z.object({
  ticker: z.string(),
  yieldPercent: z.number(),
  navChangeYoY: z.number().nullable(), // ⬅
  redemptions: z.number().nullable(), // ⬅
  newInflows: z.number().nullable(), // ⬅
  loanLossReserves: z.number().nullable(), // ⬅
  totalLoans: z.number(),
});
export type Bdc = z.infer<typeof BdcSchema>;

export const StablecoinSchema = z.object({
  symbol: z.string(),
  collateralRatio: z.number(),
  topHolderShare: z.number(),
  tvlChange7d: z.number(),
});
export type Stablecoin = z.infer<typeof StablecoinSchema>;
