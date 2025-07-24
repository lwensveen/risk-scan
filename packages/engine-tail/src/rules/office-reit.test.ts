import { describe, expect, it } from 'vitest';
import { checkOfficeREIT } from './office-reit.js';
import { OfficeReit, RiskFlagEnum } from '@risk-scan/types';

describe('checkOfficeREIT', () => {
  const base: OfficeReit = {
    ticker: 'SLG',
    vacancyRateYoY: 0,
    totalDebt: 1000,
    debtDueNext2Y: 300,
    ffo: 150,
    interestExpense: 100,
  };

  it('returns null when no flags match', () => {
    const result = checkOfficeREIT(base);
    expect(result).toBeNull();
  });

  it('flags vacancy spike if vacancyRateYoY > 10%', () => {
    const result = checkOfficeREIT({ ...base, vacancyRateYoY: 0.15 });
    expect(result?.flags).toContain(RiskFlagEnum.VacancySpike);
    expect(result?.severity).toBe('medium');
  });

  it('flags maturity wall if >40% debt due in 2 years', () => {
    const result = checkOfficeREIT({ ...base, debtDueNext2Y: 500 });
    expect(result?.flags).toContain(RiskFlagEnum.MaturityWall);
    expect(result?.severity).toBe('medium');
  });

  it('flags FFO < interest', () => {
    const result = checkOfficeREIT({ ...base, ffo: 80, interestExpense: 100 });
    expect(result?.flags).toContain(RiskFlagEnum.FFOBelowInterest);
    expect(result?.severity).toBe('medium');
  });

  it('returns high severity when multiple flags are present', () => {
    const result = checkOfficeREIT({
      ...base,
      vacancyRateYoY: 0.2,
      debtDueNext2Y: 600,
      ffo: 50,
      interestExpense: 100,
    });
    expect(result?.flags.length).toBeGreaterThanOrEqual(2);
    expect(result?.severity).toBe('high');
  });

  it('safely handles undefined vacancyRateYoY', () => {
    const result = checkOfficeREIT({ ...base, vacancyRateYoY: null });
    expect(result).toBeNull();
  });
});
