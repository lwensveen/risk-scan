import { RiskFlagEnum, Stablecoin } from '@risk-scan/types';
import { RiskFlag } from '@risk-scan/db';

export function checkStablecoin(e: Stablecoin): RiskFlag | null {
  const flags: RiskFlagEnum[] = [];

  if (e.collateralRatio < 1.5) flags.push(RiskFlagEnum.UnderCollateralised);

  if (e.topHolderShare > 0.2) flags.push(RiskFlagEnum.ConcentratedSupply);

  if (e.tvlChange7d < -0.05) flags.push(RiskFlagEnum.TVLOutflows);

  return flags.length
    ? {
        category: 'Stablecoin',
        ticker: e.symbol,
        flags,
        severity: flags.length >= 2 ? 'high' : 'medium',
      }
    : null;
}
