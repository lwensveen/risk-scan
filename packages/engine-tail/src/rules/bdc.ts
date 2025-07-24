import { Bdc, RiskFlagEnum } from '@risk-scan/types';
import { RiskFlag } from '@risk-scan/db';

export function checkBDC(e: Bdc): RiskFlag | null {
  const flags: RiskFlagEnum[] = [];

  if (e.yieldPercent > 0.12 && (e.navChangeYoY ?? 0) <= 0)
    flags.push(RiskFlagEnum.UnsustainableYield);

  if ((e.redemptions ?? 0) > (e.newInflows ?? 0))
    flags.push(RiskFlagEnum.NetOutflows);

  if ((e.loanLossReserves ?? Infinity) / e.totalLoans < 0.03)
    flags.push(RiskFlagEnum.ThinLossReserves);

  return flags.length
    ? {
        category: 'BDC',
        ticker: e.ticker,
        flags,
        severity: flags.length >= 2 ? 'high' : 'medium',
      }
    : null;
}
