import { describe, expect, it } from 'vitest';
import { calculateRiskMetrics } from './risk.js';

describe('calculateRiskMetrics', () => {
  it('computes VaR and CVaR correctly', () => {
    const returns = [-0.01, -0.03, 0.02, -0.02, 0.01, -0.05, 0.03];
    const confidenceLevel = 0.95;

    const { VaR, CVaR } = calculateRiskMetrics(returns, confidenceLevel);

    expect(VaR).toBeLessThanOrEqual(0);
    expect(CVaR).toBeLessThanOrEqual(VaR);
  });

  it('throws on invalid inputs', () => {
    expect(() => calculateRiskMetrics([], 0.95)).toThrow();
    expect(() => calculateRiskMetrics([0.01], 0)).toThrow();
    expect(() => calculateRiskMetrics([0.01], 1)).toThrow();
  });

  it('handles all positive returns (low risk)', () => {
    const { VaR, CVaR } = calculateRiskMetrics([0.01, 0.02, 0.03], 0.95);
    expect(VaR).toBeGreaterThanOrEqual(0);
    expect(CVaR).toBeGreaterThanOrEqual(0);
  });

  it('handles all negative returns (high risk)', () => {
    const returns = [-0.01, -0.02, -0.03, -0.04, -0.05];
    const { VaR, CVaR } = calculateRiskMetrics(returns, 0.95);
    expect(VaR).toBeLessThanOrEqual(returns[0]!);
    expect(CVaR).toBeLessThanOrEqual(VaR);
  });
});
