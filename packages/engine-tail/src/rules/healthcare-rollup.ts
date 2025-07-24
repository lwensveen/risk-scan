import { HealthcareRollup, RiskFlagEnum } from '@risk-scan/types';
import { RiskFlag } from '@risk-scan/db';

export function checkHealthcareRollup(e: HealthcareRollup): RiskFlag | null {
  const flags: RiskFlagEnum[] = [];

  if (e.debt / e.ebitda > 6) flags.push(RiskFlagEnum.OverLeveraged);

  if ((e.leaseObligationsOffBS ?? 0) / e.totalAssets > 0.3)
    flags.push(RiskFlagEnum.HiddenLeases);

  if ((e.sameStoreVisitsYoY ?? 0) < 0) flags.push(RiskFlagEnum.PatientDecline);

  return flags.length
    ? {
        category: 'HealthcareRollup',
        ticker: e.ticker,
        flags,
        severity: flags.length >= 2 ? 'high' : 'medium',
      }
    : null;
}
