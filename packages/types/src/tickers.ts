export const riskScanConfig = {
  BDC: ['ARCC', 'GBDC'],
  CoreBank: ['JPM', 'BAC', 'C', 'WFC'],
  HealthcareRollup: ['AMEH', 'OSH', 'ALHC'],
  OfficeREIT: ['BXP', 'SLG', 'VNO'],
  RegionalBank: ['FITB', 'HBAN', 'CFG'],
  Stablecoin: ['USDT', 'USDC'],
};

export type RiskScanCategory = keyof typeof riskScanConfig;

export type TailRiskConfig = {
  [K in RiskScanCategory]: string[];
};
