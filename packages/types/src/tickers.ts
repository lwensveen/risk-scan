export const riskScanConfig = {
  OfficeREIT: ['BXP', 'SLG', 'VNO'],
  HealthcareRollup: ['AMEH', 'OSH', 'ALHC'],
  RegionalBank: ['FITB', 'HBAN', 'CFG'],
  BDC: ['ARCC', 'GBDC'],
  Stablecoin: ['USDT', 'USDC'],
  CoreBank: ['JPM', 'BAC', 'C', 'WFC'],
} as const;

export type RiskScanCategory = keyof typeof riskScanConfig;
