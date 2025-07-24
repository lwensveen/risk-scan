import { describe, expect, it } from 'vitest';
import { checkStablecoin } from './stablecoin.js';
import { RiskFlagEnum, Stablecoin } from '@risk-scan/types';

describe('checkStablecoin', () => {
  const base: Stablecoin = {
    symbol: 'USDT',
    collateralRatio: 2.0,
    topHolderShare: 0.1,
    tvlChange7d: 0.01,
  };

  it('returns null when no flags match', () => {
    const result = checkStablecoin(base);
    expect(result).toBeNull();
  });

  it('flags under-collateralisation if ratio < 1.5', () => {
    const result = checkStablecoin({ ...base, collateralRatio: 1.4 });
    expect(result?.flags).toContain(RiskFlagEnum.UnderCollateralised);
    expect(result?.severity).toBe('medium');
  });

  it('flags concentrated supply if topHolderShare > 20%', () => {
    const result = checkStablecoin({ ...base, topHolderShare: 0.25 });
    expect(result?.flags).toContain(RiskFlagEnum.ConcentratedSupply);
    expect(result?.severity).toBe('medium');
  });

  it('flags TVL outflows if tvlChange7d < -5%', () => {
    const result = checkStablecoin({ ...base, tvlChange7d: -0.06 });
    expect(result?.flags).toContain(RiskFlagEnum.TVLOutflows);
    expect(result?.severity).toBe('medium');
  });

  it('returns high severity when multiple flags are present', () => {
    const result = checkStablecoin({
      ...base,
      collateralRatio: 1.2,
      topHolderShare: 0.3,
      tvlChange7d: -0.1,
    });
    expect(result?.flags.length).toBeGreaterThanOrEqual(2);
    expect(result?.severity).toBe('high');
  });

  it('handles exact thresholds correctly', () => {
    const result = checkStablecoin({
      ...base,
      collateralRatio: 1.5,
      topHolderShare: 0.2,
      tvlChange7d: -0.05,
    });
    expect(result).toBeNull();
  });
});
