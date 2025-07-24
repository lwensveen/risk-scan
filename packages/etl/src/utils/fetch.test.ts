import { beforeEach, describe, expect, it, vi } from 'vitest';
import { secConcept, yoy } from './utils.js';
import {
  fetchBDC,
  fetchHealthcareRollup,
  fetchOfficeREIT,
  fetchRegionalBank,
  fetchStablecoin,
} from './fetch.js';

const { quoteSummaryMock, axiosGetMock } = vi.hoisted(() => {
  vi.stubEnv('PLACER_KEY', 'test-key');

  const quoteSummaryMock = vi.fn();

  const axiosGetMock = vi.fn((url: string, opts?: any) => {
    if (url.includes('placer.ai')) {
      return Promise.resolve({ data: { current: 200, prior: 100 } });
    }

    if (
      url.includes('fdic.gov') &&
      (opts?.params?.fields ?? '').includes('RCON5636')
    ) {
      return Promise.resolve({ data: { data: [{ RCON5636: 500 }] } });
    }

    if (
      url.includes('fdic.gov') &&
      (opts?.params?.fields ?? '').includes('RCON5525')
    ) {
      return Promise.resolve({
        data: { data: [{ RCON5525: 10 }, { RCON5525: 5 }] },
      });
    }

    if (url.includes('coins.llama.fi')) {
      return Promise.resolve({
        data: {
          coins: {
            'coingecko:usdt': {
              collateral_ratio: 1.02,
              top_holders_pct: 45,
              tvl_7d_change: -2.5,
            },
          },
        },
      });
    }

    return Promise.resolve({ data: {} });
  });

  return { quoteSummaryMock, axiosGetMock };
});

vi.mock('axios', () => ({
  default: { get: axiosGetMock },
}));

vi.mock('yahoo-finance2', () => {
  const YahooFinanceCtor = vi.fn().mockImplementation(() => ({
    quoteSummary: quoteSummaryMock,
  }));
  return { default: YahooFinanceCtor };
});

vi.mock('./utils.js', () => ({
  secConcept: vi.fn(),
  yoy: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  quoteSummaryMock.mockReset();
  axiosGetMock.mockClear();
});

describe('fetchOfficeREIT', () => {
  it('returns OfficeREIT object', async () => {
    quoteSummaryMock.mockResolvedValue({
      balanceSheetHistoryQuarterly: {
        balanceSheetStatements: [{ totalLiab: 1_000, currentLiabilities: 400 }],
      },
      incomeStatementHistoryQuarterly: {
        incomeStatementHistory: [{ interestExpense: 50 }],
      },
      financialData: { ebitda: { raw: 200 } },
    });

    (secConcept as any).mockResolvedValueOnce([{ val: 80, end: '2023-12-31' }]);
    (yoy as any).mockReturnValue(20);

    const out = await fetchOfficeREIT('SLG');
    expect(out).toMatchObject({
      ticker: 'SLG',
      vacancyRateYoY: 20,
      totalDebt: 1_000,
      debtDueNext2Y: 400,
      ffo: 200,
      interestExpense: 50,
    });
  });

  it('throws on missing data', async () => {
    quoteSummaryMock.mockResolvedValue({ balanceSheetHistoryQuarterly: {} });
    await expect(fetchOfficeREIT('SLG')).rejects.toThrow(/Incomplete data/);
  });
});

describe('fetchHealthcareRollup', () => {
  it('returns rollup object', async () => {
    quoteSummaryMock.mockResolvedValue({
      balanceSheetHistoryQuarterly: {
        balanceSheetStatements: [{ totalLiab: 500, totalAssets: 800 }],
      },
      incomeStatementHistoryQuarterly: {
        incomeStatementHistory: [{ ebitda: 300 }],
      },
    });

    (secConcept as any)
      .mockResolvedValueOnce([{ val: 100, end: '2023-12-31' }])
      .mockResolvedValueOnce([{ val: 80, end: '2023-12-31' }]);

    const result = await fetchHealthcareRollup('AMEH');
    expect(result).toMatchObject({
      leaseObligationsOffBS: 20,
      sameStoreVisitsYoY: 100,
    });
  });

  it('throws on missing data', async () => {
    quoteSummaryMock.mockResolvedValue({});
    await expect(fetchHealthcareRollup('AMEH')).rejects.toThrow(
      /Incomplete data/
    );
  });
});

describe('fetchRegionalBank', () => {
  it('returns bank object', async () => {
    quoteSummaryMock.mockResolvedValue({
      balanceSheetHistoryQuarterly: {
        balanceSheetStatements: [{ totalLiab: 1000, cash: 200 }],
      },
    });

    const result = await fetchRegionalBank('HBAN');
    expect(result).toMatchObject({
      ticker: 'HBAN',
      creLoans: 500,
      totalLoans: 1000,
      liquidAssets: 200,
      npaMoM: 5,
    });
  });
});

describe('fetchBDC', () => {
  it('returns BDC object', async () => {
    quoteSummaryMock.mockResolvedValue({
      balanceSheetHistoryQuarterly: {
        balanceSheetStatements: [{ totalAssets: 900 }],
      },
      incomeStatementHistoryQuarterly: {
        incomeStatementHistory: [{ ebitda: 400 }],
      },
      summaryDetail: { dividendYield: { raw: 0.08 } },
    });

    (secConcept as any)
      .mockResolvedValueOnce([{ val: 300, end: '2023' }])
      .mockResolvedValueOnce([{ val: 100, end: '2023' }])
      .mockResolvedValueOnce([{ val: 30, end: '2023' }])
      .mockResolvedValueOnce([{ val: 12, end: '2023' }]);

    (yoy as any).mockReturnValue(20);

    const result = await fetchBDC('ARCC');
    expect(result).toMatchObject({
      ticker: 'ARCC',
      yieldPercent: 0.08,
      navChangeYoY: 20,
      redemptions: 100,
      newInflows: 300,
      loanLossReserves: 12,
    });
  });

  it('throws on missing data', async () => {
    quoteSummaryMock.mockResolvedValue({});
    await expect(fetchBDC('ARCC')).rejects.toThrow(/Incomplete data/);
  });
});

describe('fetchStablecoin', () => {
  it('returns stablecoin stats', async () => {
    const result = await fetchStablecoin('USDT');
    expect(result).toMatchObject({
      symbol: 'USDT',
      collateralRatio: 1.02,
      topHolderShare: 45,
      tvlChange7d: -2.5,
    });
  });
});
