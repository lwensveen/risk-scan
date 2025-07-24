import { describe, expect, it } from 'vitest';
import { checkBDC } from './bdc.js';
import { Bdc, RiskFlagEnum } from '@risk-scan/types';

describe('checkBDC', () => {
  const base: Bdc = {
    ticker: 'ARCC',
    yieldPercent: 0.1,
    navChangeYoY: 1,
    redemptions: 0,
    newInflows: 0,
    loanLossReserves: 50,
    totalLoans: 1000,
  };

  it('returns null when no flags match', () => {
    const result = checkBDC(base);
    expect(result).toBeNull();
  });

  it('flags unsustainable yield if yield > 12% and NAV is flat/down', () => {
    const result = checkBDC({ ...base, yieldPercent: 0.13, navChangeYoY: 0 });
    expect(result?.flags).toContain(RiskFlagEnum.UnsustainableYield);
    expect(result?.severity).toBe('medium');
  });

  it('flags net outflows when redemptions > inflows', () => {
    const result = checkBDC({ ...base, redemptions: 100, newInflows: 50 });
    expect(result?.flags).toContain(RiskFlagEnum.NetOutflows);
    expect(result?.severity).toBe('medium');
  });

  it('flags thin reserves when ratio < 3%', () => {
    const result = checkBDC({
      ...base,
      loanLossReserves: 20,
      totalLoans: 1000,
    });
    expect(result?.flags).toContain(RiskFlagEnum.ThinLossReserves);
    expect(result?.severity).toBe('medium');
  });

  it('returns high severity when multiple flags are present', () => {
    const result = checkBDC({
      ...base,
      yieldPercent: 0.13,
      navChangeYoY: -1,
      redemptions: 200,
      newInflows: 100,
      loanLossReserves: 10,
    });

    expect(result?.flags.length).toBeGreaterThanOrEqual(2);
    expect(result?.severity).toBe('high');
  });

  it('calculates reserve ratio safely when reserves are undefined', () => {
    const result = checkBDC({ ...base, loanLossReserves: null });
    expect(result).toBeNull();
  });

  it('calculates reserve ratio safely when totalLoans is zero', () => {
    const result = checkBDC({ ...base, totalLoans: 0, loanLossReserves: 0 });
    expect(result).toBeNull();
  });

  it('coalesces nullish fields (navChangeYoY/redemptions/newInflows) correctly', () => {
    const highYieldMissingNav = checkBDC({
      ticker: 'ARCC',
      yieldPercent: 0.13,
      navChangeYoY: null,
      redemptions: 0,
      newInflows: 0,
      loanLossReserves: 50,
      totalLoans: 1000,
    });
    expect(highYieldMissingNav?.flags).toContain(
      RiskFlagEnum.UnsustainableYield
    );

    const noOutflowFlag = checkBDC({
      ticker: 'ARCC',
      yieldPercent: 0.1,
      navChangeYoY: 1,
      redemptions: null,
      newInflows: 0,
      loanLossReserves: 50,
      totalLoans: 1000,
    });
    expect(noOutflowFlag).toBeNull();

    const outflowFlag = checkBDC({
      ticker: 'ARCC',
      yieldPercent: 0.1,
      navChangeYoY: 1,
      redemptions: 25,
      newInflows: null,
      loanLossReserves: 50,
      totalLoans: 1000,
    });
    expect(outflowFlag?.flags).toContain(RiskFlagEnum.NetOutflows);
  });
});
