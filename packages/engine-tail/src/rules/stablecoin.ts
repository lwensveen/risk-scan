import { RiskFlag, Stablecoin } from '@risk-scan/types';

export function checkStablecoin(e: Stablecoin): RiskFlag | null {
  const flags: string[] = [];
  if (e.collateralRatio < 1.5) flags.push('🚩 Under‑collateralised (<150 %)');
  if (e.topHolderShare > 0.2) flags.push('🚩 Concentrated supply (>20 %)');
  if (e.tvlChange7d < -0.05) flags.push('🚩 TVL outflows (>5 %)');

  return flags.length
    ? {
        category: 'Stablecoin',
        ticker: e.symbol,
        flags,
        severity: flags.length >= 2 ? 'high' : 'medium',
        ts: Date.now(),
      }
    : null;
}
