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
  // ── BDC ───────────────────────────
  UnsustainableYield = 'UnsustainableYield',
  NetOutflows = 'NetOutflows',
  ThinLossReserves = 'ThinLossReserves',

  // ── Healthcare Roll‑ups ───────────
  OverLeveraged = 'OverLeveraged',
  HiddenLeases = 'HiddenLeases',
  PatientDecline = 'PatientDecline',

  // ── Office REIT ───────────────────
  VacancySpike = 'VacancySpike',
  MaturityWall = 'MaturityWall',
  FFOBelowInterest = 'FFOBelowInterest',

  // ── Regional Bank ────────────────
  CREConcentration = 'CREConcentration',
  LowLiquidity = 'LowLiquidity',
  RisingNPAs = 'RisingNPAs',
  HTMConcentration = 'HTMConcentration',
  UnrealisedLosses = 'UnrealisedLosses',
  UninsuredDeposits = 'UninsuredDeposits',

  // ── Stablecoin ───────────────────
  UnderCollateralised = 'UnderCollateralised',
  ConcentratedSupply = 'ConcentratedSupply',
  TVLOutflows = 'TVLOutflows',

  // ── Cross‑sector ─────────────────
  GoingConcern = 'GoingConcern',
}

export const RiskFlagLabel: Record<RiskFlagEnum, string> = {
  // BDC
  [RiskFlagEnum.UnsustainableYield]: '🚩 Unsustainable yield',
  [RiskFlagEnum.NetOutflows]: '🚩 Net outflows',
  [RiskFlagEnum.ThinLossReserves]: '🚩 Thin loss reserves (<3 %)',

  // Healthcare Roll‑up
  [RiskFlagEnum.OverLeveraged]: '🚩 Over‑leveraged (>6× EBITDA)',
  [RiskFlagEnum.HiddenLeases]: '🚩 Hidden leases (>30 %)',
  [RiskFlagEnum.PatientDecline]: '🚩 Patient decline',

  // Office REIT
  [RiskFlagEnum.VacancySpike]: '🚩 Vacancy spike (>10 % YoY)',
  [RiskFlagEnum.MaturityWall]: '🚩 Maturity wall (>40 % due <2 y)',
  [RiskFlagEnum.FFOBelowInterest]: '🚩 FFO < interest',

  // Regional Bank
  [RiskFlagEnum.CREConcentration]: '🚩 CRE concentration (>50 %)',
  [RiskFlagEnum.LowLiquidity]: '🚩 Low liquidity (<20 %)',
  [RiskFlagEnum.RisingNPAs]: '🚩 Rising NPAs (MoM)',
  [RiskFlagEnum.HTMConcentration]: '🚩 HTM concentration (>40 % assets)',
  [RiskFlagEnum.UnrealisedLosses]: '🚩 Unrealised losses >30 % capital',
  [RiskFlagEnum.UninsuredDeposits]: '🚩 Uninsured deposits >60 %',

  // Stablecoin
  [RiskFlagEnum.UnderCollateralised]: '🚩 Under‑collateralised (<150 %)',
  [RiskFlagEnum.ConcentratedSupply]: '🚩 Concentrated supply (>20 %)',
  [RiskFlagEnum.TVLOutflows]: '🚩 TVL outflows (>5 %)',

  // Cross‑sector
  [RiskFlagEnum.GoingConcern]: '🚩 Going‑concern doubt',
};
