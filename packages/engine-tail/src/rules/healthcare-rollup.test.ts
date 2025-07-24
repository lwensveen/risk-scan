import { describe, expect, it } from 'vitest';
import { checkHealthcareRollup } from './healthcare-rollup.js';
import type { HealthcareRollup } from '@risk-scan/types';

describe('checkHealthcareRollup', () => {
  const base: HealthcareRollup = {
    ticker: 'AMEH',
    debt: 300,
    ebitda: 100,
    leaseObligationsOffBS: 20,
    totalAssets: 500,
    sameStoreVisitsYoY: 5,
  };

  it('returns null when no flags match', () => {
    const result = checkHealthcareRollup(base);
    expect(result).toBeNull();
  });

  it('flags over-leveraged if debt/ebitda > 6', () => {
    const result = checkHealthcareRollup({ ...base, debt: 700, ebitda: 100 });
    expect(result?.flags).toContain('🚩 Over‑leveraged (>6× EBITDA)');
    expect(result?.severity).toBe('medium');
  });

  it('flags hidden leases if off-BS leases > 30% of total assets', () => {
    const result = checkHealthcareRollup({
      ...base,
      leaseObligationsOffBS: 200,
    });
    expect(result?.flags).toContain('🚩 Hidden leases (>30 %)');
    expect(result?.severity).toBe('medium');
  });

  it('flags patient decline if sameStoreVisitsYoY < 0', () => {
    const result = checkHealthcareRollup({ ...base, sameStoreVisitsYoY: -5 });
    expect(result?.flags).toContain('🚩 Patient decline');
    expect(result?.severity).toBe('medium');
  });

  it('returns high severity when multiple flags are present', () => {
    const result = checkHealthcareRollup({
      ...base,
      debt: 1000,
      ebitda: 100,
      leaseObligationsOffBS: 200,
      sameStoreVisitsYoY: -10,
    });
    expect(result?.flags.length).toBeGreaterThanOrEqual(2);
    expect(result?.severity).toBe('high');
  });

  it('safely handles missing optional values', () => {
    const result = checkHealthcareRollup({
      ...base,
      leaseObligationsOffBS: null,
      sameStoreVisitsYoY: null,
    });
    expect(result).toBeNull();
  });
});
