import { HealthcareRollup, RiskFlag } from '@risk-scan/types';

export function checkHealthcareRollup(e: HealthcareRollup): RiskFlag | null {
  const flags: string[] = [];
  if (e.debt / e.ebitda > 6) flags.push('🚩 Over‑leveraged (>6× EBITDA)');
  if ((e.leaseObligationsOffBS ?? 0) / e.totalAssets > 0.3)
    flags.push('🚩 Hidden leases (>30 %)');
  if ((e.sameStoreVisitsYoY ?? 0) < 0) flags.push('🚩 Patient decline');

  return flags.length
    ? {
        category: 'HealthcareRollup',
        ticker: e.ticker,
        flags,
        severity: flags.length >= 2 ? 'high' : 'medium',
        ts: Date.now(),
      }
    : null;
}
