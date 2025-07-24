import { beforeEach, vi } from 'vitest';

vi.stubEnv('PLACER_KEY', 'test-key');

export const quoteSummaryMock = vi.fn();
export const axiosGetMock = vi.fn((url: string, opts?: any) => {
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

vi.mock('axios', () => ({
  default: { get: axiosGetMock },
}));

vi.mock('yahoo-finance2', () => {
  const YahooFinanceCtor = vi.fn().mockImplementation(() => ({
    quoteSummary: quoteSummaryMock,
  }));
  return { default: YahooFinanceCtor };
});

vi.mock('../utils/utils.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/utils.js')>();
  return {
    ...actual,
    secConcept: vi.fn(),
    yoy: vi.fn(),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  quoteSummaryMock.mockReset();
  axiosGetMock.mockClear();
});
