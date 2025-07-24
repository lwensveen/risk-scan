import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { db } from '@risk-scan/db';

vi.mock('axios');

vi.mock('@risk-scan/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@risk-scan/db')>();

  const chain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),

    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          catch: vi.fn(),
        }),
      }),
    }),
  };

  return {
    ...actual,
    db: chain,
  };
});

const mockedAxios = axios as unknown as { get: ReturnType<typeof vi.fn> };

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('resolveCik', () => {
  it('returns cached CIK from db if present and fresh', async () => {
    (db.select as any).mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () => [{ cik: '0000123456' }],
        }),
      }),
    });

    const { resolveCik } = await import('./resolve-cik.js');
    const cik = await resolveCik('AAPL');
    expect(cik).toBe('0000123456');
  });

  it('fetches from SEC and caches when not in db', async () => {
    (db.select as any).mockReturnValue({
      from: () => ({ where: () => ({ limit: () => [] }) }),
    });

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        0: { ticker: 'AAPL', cik_str: 123456 },
        1: { ticker: 'TSLA', cik_str: 999999 },
      },
    });

    const { resolveCik } = await import('./resolve-cik.js');
    const cik = await resolveCik('AAPL');

    expect(cik).toBe('0000123456');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://www.sec.gov/files/company_tickers.json',
      expect.objectContaining({
        headers: expect.objectContaining({ 'User-Agent': 'risk-scan 0.1' }),
      })
    );
    expect(db.insert).toHaveBeenCalled();
  });

  it('throws if ticker is not found in SEC list', async () => {
    (db.select as any).mockReturnValue({
      from: () => ({ where: () => ({ limit: () => [] }) }),
    });

    mockedAxios.get.mockResolvedValueOnce({
      data: { 0: { ticker: 'MSFT', cik_str: 54321 } },
    });

    const { resolveCik } = await import('./resolve-cik.js');
    await expect(resolveCik('XXXX')).rejects.toThrow(
      'CIK not found for ticker XXXX'
    );
  });
});
