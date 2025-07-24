import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchSECFact } from './fetch-sec-fact.js';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch as any;

const jsonResponse = (val: number | null) => ({
  facts: {
    'us-gaap': {
      SomeTag: {
        units: {
          USD: val !== null ? [{ val }] : [],
        },
      },
    },
  },
});

describe('fetchSECFact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the fact when available', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(jsonResponse(123)),
    });

    const result = await fetchSECFact('0000320193', 'us-gaap', 'SomeTag');
    expect(result).toBe(123);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://data.sec.gov/api/xbrl/companyfacts/0000320193.json',
      expect.objectContaining({ headers: { 'User-Agent': 'risk-scan' } })
    );
  });

  it('returns null when fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const result = await fetchSECFact('bad-cik', 'us-gaap', 'Tag');
    expect(result).toBeNull();
  });

  it('returns null when JSON is malformed', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new Error('bad json')),
    });

    const result = await fetchSECFact('0000320193', 'us-gaap', 'SomeTag');
    expect(result).toBeNull();
  });

  it('returns null if value is not a number', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          facts: {
            'us-gaap': {
              SomeTag: {
                units: {
                  USD: [{ val: 'not-a-number' }],
                },
              },
            },
          },
        }),
    });

    const result = await fetchSECFact('0000320193', 'us-gaap', 'SomeTag');
    expect(result).toBeNull();
  });
});
