import z from 'zod/v4';

export const severityValues = ['low', 'medium', 'high'] as const;
export const SeverityEnum = z.enum(severityValues);
export type Severity = z.infer<typeof SeverityEnum>;

export enum RiskSeverityEnum {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export const categoryValues = [
  'BDC',
  'CoreBank',
  'HealthcareRollup',
  'OfficeREIT',
  'RegionalBank',
  'Stablecoin',
] as const;

export const RiskCategoryEnum = z.enum(categoryValues);

export enum RiskCategoryTS {
  BDC = 'BDC',
  CoreBank = 'CoreBank',
  HealthcareRollup = 'HealthcareRollup',
  OfficeREIT = 'OfficeREIT',
  RegionalBank = 'RegionalBank',
  Stablecoin = 'Stablecoin',
}

export type RiskCategory = (typeof categoryValues)[number];

export enum RiskFlagEnum {
  GoingConcern = 'GoingConcern',
}
