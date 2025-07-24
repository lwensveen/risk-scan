import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('tickerToCIK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('returns the CIK and caches it', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ quotes: [{ cik: '0000123456' }] }),
    } as any);

    const { tickerToCIK } = await import('./ticker-to-cik.js');

    const t = 'HBAN';
    const first = await tickerToCIK(t);
    expect(first).toBe('0000123456');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const second = await tickerToCIK(t);
    expect(second).toBe('0000123456');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns null when no CIK is present', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ quotes: [] }),
    } as any);

    const { tickerToCIK } = await import('./ticker-to-cik.js');

    const cik = await tickerToCIK('NOPE');
    expect(cik).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
