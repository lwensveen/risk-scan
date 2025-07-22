import z from 'zod/v4';

export const severityValues = ['low', 'medium', 'high'] as const;
export const SeverityEnum = z.enum(severityValues);
export type Severity = z.infer<typeof SeverityEnum>;

export const categoryValues = [
  'BDC',
  'CoreBank',
  'HealthcareRollup',
  'OfficeREIT',
  'RegionalBank',
  'Stablecoin',
] as const;
export const RiskCategoryEnum = z.enum(categoryValues);
export type RiskCategory = z.infer<typeof RiskCategoryEnum>;
