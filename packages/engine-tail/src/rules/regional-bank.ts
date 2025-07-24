import { RegionalBank, RiskFlagEnum } from '@risk-scan/types';
import { RiskFlag } from '@risk-scan/db';

export function checkRegionalBank(e: RegionalBank): RiskFlag | null {
  const flags: RiskFlagEnum[] = [];

  if ((e.creLoans ?? 0) / e.totalLoans > 0.5)
    flags.push(RiskFlagEnum.CREConcentration);

  if (e.liquidAssets / e.deposits < 0.2) flags.push(RiskFlagEnum.LowLiquidity);

  if ((e.npaMoM ?? 0) > 0) flags.push(RiskFlagEnum.RisingNPAs);

  if ((e.htmSecurities ?? 0) / e.totalAssets > 0.4)
    flags.push(RiskFlagEnum.HTMConcentration);

  if ((e.aoci ?? 0) / e.tier1Capital < -0.3)
    flags.push(RiskFlagEnum.UnrealisedLosses);

  if ((e.uninsuredDeposits ?? 0) / e.totalDeposits > 0.6)
    flags.push(RiskFlagEnum.UninsuredDeposits);

  return flags.length
    ? {
        category: 'RegionalBank',
        ticker: e.ticker,
        flags,
        severity: flags.length >= 2 ? 'high' : 'medium',
      }
    : null;
}
