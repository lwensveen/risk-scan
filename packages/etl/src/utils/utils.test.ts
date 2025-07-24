import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';

vi.mock('axios');

vi.mock('@risk-scan/types', async (importOriginal) => {
  const mod = await importOriginal<any>();
  return {
    ...mod,
    riskScanConfig: {
      BDC: ['ARCC'],
      CoreBank: ['JPM', 'BAC'],
      RegionalBank: ['HBAN'],
    },
  };
});

const mockedAxios = axios as unknown as { get: ReturnType<typeof vi.fn> };

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe('secConcept', () => {
  it('returns USD facts when available', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { 0: { ticker: 'AAPL', cik_str: 320193 } },
      })
      .mockResolvedValueOnce({
        data: {
          facts: {
            'us-gaap': {
              Revenue: {
                units: {
                  USD: [
                    { val: 1000, end: '2023-12-31' },
                    { val: 900, end: '2022-12-31' },
                  ],
                },
              },
            },
          },
        },
      });

    const { secConcept } = await import('./utils.js');
    const facts = await secConcept('AAPL', 'Revenue');
    expect(facts).toHaveLength(2);
    expect(facts[0]!.val).toBe(1000);
  });

  it('returns [] on network error', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { 0: { ticker: 'AAPL', cik_str: 320193 } },
      })
      .mockRejectedValueOnce(new Error('fail'));

    const { secConcept } = await import('./utils.js');
    const result = await secConcept('AAPL', 'Revenue');
    expect(result).toEqual([]);
  });

  it('throws for unknown ticker', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { 0: { ticker: 'MSFT', cik_str: 789012 } },
    });

    const { secConcept } = await import('./utils.js');
    await expect(secConcept('UNKNOWN', 'Revenue')).rejects.toThrow(
      'CIK not found for UNKNOWN'
    );
  });
});

describe('yoy', () => {
  const now = new Date('2023-12-31');
  const lastYear = new Date('2022-12-31');

  it('returns null with < 2 entries', async () => {
    const { yoy } = await import('./utils.js');
    expect(yoy([])).toBeNull();
    expect(yoy([{ val: 100, end: now.toISOString() }])).toBeNull();
  });

  it('returns correct YoY delta', async () => {
    const { yoy } = await import('./utils.js');
    const result = yoy([
      { val: 1200, end: now.toISOString() },
      { val: 1000, end: lastYear.toISOString() },
    ]);
    expect(result).toBe(200);
  });

  it('returns null if no previous‑year match', async () => {
    const { yoy } = await import('./utils.js');
    const result = yoy([
      { val: 1200, end: now.toISOString() },
      { val: 1000, end: '2020-12-31' },
    ]);
    expect(result).toBeNull();
  });
});

describe('detectCategoryFromTicker', () => {
  it('detects the correct category', async () => {
    const { detectCategoryFromTicker } = await import('./utils.js');
    expect(detectCategoryFromTicker('JPM')).toBe('CoreBank');
    expect(detectCategoryFromTicker('HBAN')).toBe('RegionalBank');
  });

  it('throws on unknown ticker', async () => {
    const { detectCategoryFromTicker } = await import('./utils.js');
    expect(() => detectCategoryFromTicker('XXXX')).toThrow(
      'Unknown category for ticker: XXXX'
    );
  });
});
