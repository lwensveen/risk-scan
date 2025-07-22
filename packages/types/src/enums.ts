import z from 'zod/v4';

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
