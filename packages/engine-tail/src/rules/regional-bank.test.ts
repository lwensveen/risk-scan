import { describe, expect, it } from 'vitest';
import { checkRegionalBank } from './regional-bank.js';
import type { RegionalBank } from '@risk-scan/types';

describe('checkRegionalBank', () => {
  const base: RegionalBank = {
    ticker: 'HBAN',
    creLoans: 400,
    totalLoans: 1000,
    liquidAssets: 300,
    deposits: 1000,
    npaMoM: 0,
  };

  it('returns null when no flags match', () => {
    const result = checkRegionalBank(base);
    expect(result).toBeNull();
  });

  it('flags CRE concentration if CRE loans > 50% of total loans', () => {
    const result = checkRegionalBank({ ...base, creLoans: 600 });
    expect(result?.flags).toContain('🚩 CRE concentration (>50 %)');
    expect(result?.severity).toBe('medium');
  });

  it('flags low liquidity if liquid assets < 20% of deposits', () => {
    const result = checkRegionalBank({ ...base, liquidAssets: 100 });
    expect(result?.flags).toContain('🚩 Low liquidity (<20 %)');
    expect(result?.severity).toBe('medium');
  });

  it('flags rising NPAs if MoM delta > 0', () => {
    const result = checkRegionalBank({ ...base, npaMoM: 5 });
    expect(result?.flags).toContain('🚩 Rising NPAs (MoM)');
    expect(result?.severity).toBe('medium');
  });

  it('returns high severity when multiple flags are present', () => {
    const result = checkRegionalBank({
      ...base,
      creLoans: 600,
      liquidAssets: 100,
      npaMoM: 10,
    });
    expect(result?.flags.length).toBeGreaterThanOrEqual(2);
    expect(result?.severity).toBe('high');
  });

  it('handles undefined optional fields safely', () => {
    const result = checkRegionalBank({
      ...base,
      creLoans: null,
      npaMoM: null,
    });
    expect(result).toBeNull();
  });
});
