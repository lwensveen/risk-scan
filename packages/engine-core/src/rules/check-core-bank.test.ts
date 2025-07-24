import { describe, expect, it } from 'vitest';
import { checkCoreBank } from './check-core-bank';
import type { CoreBank } from '@risk-scan/types';

describe('checkCoreBank', () => {
  const base: CoreBank = {
    ticker: 'JPM',
    durationGapYears: 1,
    ltvRatio: 0.5,
    tier1CapitalRatio: 0.1,
    interestCoverage: 1.2,
  };

  it('returns null if no conditions are triggered', () => {
    const result = checkCoreBank(base);
    expect(result).toBeNull();
  });

  it('flags duration gap > 3y', () => {
    const result = checkCoreBank({ ...base, durationGapYears: 4 });
    expect(result?.flags).toContain('🚩 Duration gap > 3y');
    expect(result?.severity).toBe('low');
  });

  it('flags high LTV > 0.9', () => {
    const result = checkCoreBank({ ...base, ltvRatio: 0.95 });
    expect(result?.flags).toContain('🚩 High LTV');
    expect(result?.severity).toBe('low');
  });

  it('flags Tier-1 < 8%', () => {
    const result = checkCoreBank({ ...base, tier1CapitalRatio: 0.07 });
    expect(result?.flags).toContain('🚩 Tier‑1 < 8 %');
    expect(result?.severity).toBe('low');
  });

  it('flags negative NII (interestCoverage < 1)', () => {
    const result = checkCoreBank({ ...base, interestCoverage: 0.5 });
    expect(result?.flags).toContain('🚩 NII negative');
    expect(result?.severity).toBe('low');
  });

  it('assigns medium severity for two flags', () => {
    const result = checkCoreBank({
      ...base,
      durationGapYears: 5,
      ltvRatio: 0.95,
    });
    expect(result?.flags.length).toBe(2);
    expect(result?.severity).toBe('medium');
  });

  it('assigns high severity for three or more flags', () => {
    const result = checkCoreBank({
      ...base,
      durationGapYears: 6,
      ltvRatio: 0.96,
      tier1CapitalRatio: 0.05,
      interestCoverage: 0.2,
    });
    expect(result?.flags.length).toBeGreaterThanOrEqual(3);
    expect(result?.severity).toBe('high');
  });

  it('safely handles undefined optional fields', () => {
    const result = checkCoreBank({
      ticker: 'C',
      durationGapYears: null,
      ltvRatio: null,
      tier1CapitalRatio: null,
      interestCoverage: null,
    });
    expect(result).toBeNull();
  });
});
