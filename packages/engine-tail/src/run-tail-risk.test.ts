import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TailRiskConfig } from '@risk-scan/types';
import { RiskFlag } from '@risk-scan/db';
import {
  fetchBDC,
  fetchHealthcareRollup,
  fetchOfficeREIT,
  fetchRegionalBank,
  fetchStablecoin,
} from '@risk-scan/etl';
import { checkOfficeREIT } from './rules/office-reit.js';
import { checkHealthcareRollup } from './rules/healthcare-rollup.js';
import { checkRegionalBank } from './rules/regional-bank.js';
import { checkBDC } from './rules/bdc.js';
import { checkStablecoin } from './rules/stablecoin.js';
import { runTailRisk } from './run-tail-risk.js';

vi.mock('@risk-scan/etl', () => ({
  fetchOfficeREIT: vi.fn(),
  fetchHealthcareRollup: vi.fn(),
  fetchRegionalBank: vi.fn(),
  fetchBDC: vi.fn(),
  fetchStablecoin: vi.fn(),
}));

vi.mock('./rules/office-reit.js', () => ({
  checkOfficeREIT: vi.fn(),
}));

vi.mock('./rules/healthcare-rollup.js', () => ({
  checkHealthcareRollup: vi.fn(),
}));

vi.mock('./rules/regional-bank.js', () => ({
  checkRegionalBank: vi.fn(),
}));

vi.mock('./rules/bdc.js', () => ({
  checkBDC: vi.fn(),
}));

vi.mock('./rules/stablecoin.js', () => ({
  checkStablecoin: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('runTailRisk', () => {
  it('runs all configured checks and returns non-null flags', async () => {
    const config: TailRiskConfig = {
      OfficeREIT: ['SLG'],
      HealthcareRollup: ['AMEH'],
      RegionalBank: ['HBAN'],
      BDC: ['ARCC'],
      Stablecoin: ['USDT'],
      CoreBank: [],
    };

    const mockFlag = (t: string): RiskFlag => ({
      id: '1',
      category: 'OfficeREIT',
      ticker: t,
      severity: 'high',
      flags: ['mock'],
    });

    (fetchOfficeREIT as any).mockResolvedValue({ ticker: 'SLG' });
    (checkOfficeREIT as any).mockReturnValue(mockFlag('SLG'));

    (fetchHealthcareRollup as any).mockResolvedValue({ ticker: 'AMEH' });
    (checkHealthcareRollup as any).mockReturnValue(null);

    (fetchRegionalBank as any).mockResolvedValue({ ticker: 'HBAN' });
    (checkRegionalBank as any).mockReturnValue(mockFlag('HBAN'));

    (fetchBDC as any).mockResolvedValue({ ticker: 'ARCC' });
    (checkBDC as any).mockReturnValue(mockFlag('ARCC'));

    (fetchStablecoin as any).mockResolvedValue({ symbol: 'USDT' });
    (checkStablecoin as any).mockReturnValue(mockFlag('USDT'));

    const result = await runTailRisk(config);
    expect(result).toHaveLength(4);
    expect(result.every((r) => r && true)).toBe(true);
  });

  it('returns an empty array if all checks return null', async () => {
    const config: TailRiskConfig = {
      OfficeREIT: ['A'],
      HealthcareRollup: ['B'],
      RegionalBank: ['C'],
      BDC: ['D'],
      Stablecoin: ['E'],
      CoreBank: [],
    };

    (fetchOfficeREIT as any).mockResolvedValue({});
    (fetchHealthcareRollup as any).mockResolvedValue({});
    (fetchRegionalBank as any).mockResolvedValue({});
    (fetchBDC as any).mockResolvedValue({});
    (fetchStablecoin as any).mockResolvedValue({});

    (checkOfficeREIT as any).mockReturnValue(null);
    (checkHealthcareRollup as any).mockReturnValue(null);
    (checkRegionalBank as any).mockReturnValue(null);
    (checkBDC as any).mockReturnValue(null);
    (checkStablecoin as any).mockReturnValue(null);

    const result = await runTailRisk(config);
    expect(result).toEqual([]);
  });
});
