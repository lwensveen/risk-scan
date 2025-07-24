import { CoreBank } from '@risk-scan/types';
import { RiskFlag } from '@risk-scan/db';

export function checkCoreBank(b: CoreBank): RiskFlag | null {
  const r: string[] = [];
  if ((b.durationGapYears ?? 0) > 3) r.push('🚩 Duration gap > 3y');
  if ((b.ltvRatio ?? 0) > 0.9) r.push('🚩 High LTV');
  if ((b.tier1CapitalRatio ?? 1) < 0.08) r.push('🚩 Tier‑1 < 8 %');
  if ((b.interestCoverage ?? 1) < 1) r.push('🚩 NII negative');

  if (!r.length) return null;
  const sev = r.length >= 3 ? 'high' : r.length === 2 ? 'medium' : 'low';
  return {
    category: 'CoreBank',
    ticker: b.ticker,
    flags: r,
    severity: sev,
  } satisfies RiskFlag;
}
