import { OfficeReit, RiskFlagEnum } from '@risk-scan/types';
import { RiskFlag } from '@risk-scan/db';

export function checkOfficeREIT(e: OfficeReit): RiskFlag | null {
  const flags: RiskFlagEnum[] = [];

  if ((e.vacancyRateYoY ?? 0) > 0.1) flags.push(RiskFlagEnum.VacancySpike);

  if (e.debtDueNext2Y / e.totalDebt > 0.4)
    flags.push(RiskFlagEnum.MaturityWall);

  if (e.ffo < e.interestExpense) flags.push(RiskFlagEnum.FFOBelowInterest);

  return flags.length
    ? {
        category: 'OfficeREIT',
        ticker: e.ticker,
        flags,
        severity: flags.length >= 2 ? 'high' : 'medium',
      }
    : null;
}
