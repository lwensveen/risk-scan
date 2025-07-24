import './test.setup.js';
import { describe, expect, it, vi } from 'vitest';
import { fetchStablecoin } from './stablecoin.js';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = axios as unknown as { get: ReturnType<typeof vi.fn> };

describe('fetchStablecoin', () => {
  it('returns stablecoin stats from full response', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
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

    const result = await fetchStablecoin('USDT');
    expect(result).toEqual({
      symbol: 'USDT',
      collateralRatio: 1.02,
      topHolderShare: 45,
      tvlChange7d: -2.5,
    });
  });

  it('returns defaults if some fields are missing', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      data: {
        coins: {
          'coingecko:usdc': {
            collateral_ratio: 1.01,
          },
        },
      },
    });

    const result = await fetchStablecoin('USDC');
    expect(result).toEqual({
      symbol: 'USDC',
      collateralRatio: 1.01,
      topHolderShare: 0,
      tvlChange7d: 0,
    });
  });

  it('returns all defaults if coin not found', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      data: {
        coins: {},
      },
    });

    const result = await fetchStablecoin('DAI');
    expect(result).toEqual({
      symbol: 'DAI',
      collateralRatio: 0,
      topHolderShare: 0,
      tvlChange7d: 0,
    });
  });
});
