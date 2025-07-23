import { Bdc, RiskFlag } from '@risk-scan/types';

export function checkBDC(e: Bdc): RiskFlag | null {
  const flags: string[] = [];
  if (e.yieldPercent > 0.12 && (e.navChangeYoY ?? 0) <= 0)
    flags.push('🚩 Unsustainable yield');
  if ((e.redemptions ?? 0) > (e.newInflows ?? 0)) flags.push('🚩 Net outflows');
  if ((e.loanLossReserves ?? Infinity) / e.totalLoans < 0.03)
    flags.push('🚩 Thin loss reserves (<3 %)');

  return flags.length
    ? {
        category: 'BDC',
        ticker: e.ticker,
        flags,
        severity: flags.length >= 2 ? 'high' : 'medium',
        ts: Date.now(),
      }
    : null;
}
