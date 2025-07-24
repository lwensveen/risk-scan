import { RegionalBank } from '@risk-scan/types';
import { RiskFlag } from '@risk-scan/db';

export function checkRegionalBank(e: RegionalBank): RiskFlag | null {
  const flags: string[] = [];
  if ((e.creLoans ?? 0) / e.totalLoans > 0.5)
    flags.push('🚩 CRE concentration (>50 %)');
  if (e.liquidAssets / e.deposits < 0.2) flags.push('🚩 Low liquidity (<20 %)');
  if ((e.npaMoM ?? 0) > 0) flags.push('🚩 Rising NPAs (MoM)');

  return flags.length
    ? {
        category: 'RegionalBank',
        ticker: e.ticker,
        flags,
        severity: flags.length >= 2 ? 'high' : 'medium',
      }
    : null;
}
