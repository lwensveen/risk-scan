import { OfficeReit, RiskFlag } from '@risk-scan/types';

export function checkOfficeREIT(e: OfficeReit): RiskFlag | null {
  const flags: string[] = [];
  if ((e.vacancyRateYoY ?? 0) > 0.1) flags.push('🚩 Vacancy spike (>10 % YoY)');
  if (e.debtDueNext2Y / e.totalDebt > 0.4)
    flags.push('🚩 Maturity wall (>40 % due <2 y)');
  if (e.ffo < e.interestExpense) flags.push('🚩 FFO < interest');

  return flags.length
    ? {
        category: 'OfficeREIT',
        ticker: e.ticker,
        flags,
        severity: flags.length >= 2 ? 'high' : 'medium',
        ts: Date.now(),
      }
    : null;
}
