import { beforeEach, describe, expect, it, vi } from 'vitest';
import fetch from 'node-fetch';

vi.mock('node-fetch', async () => ({
  default: vi.fn(),
}));

const mockedFetch = fetch as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.UPSTASH_REDIS_REST_URL = 'https://dummy.upstash.io';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  vi.clearAllMocks();
});

describe('invalidateCache', () => {
  it('should return 0 for empty keys array', async () => {
    const { invalidateCache } = await import('./cache.js');
    const result = await invalidateCache([]);
    expect(result).toBe(0);
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it('should call fetch with correct payload and return the sum of deleted keys', async () => {
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: [[1], [0], [1]],
      }),
    } as any);

    const { invalidateCache } = await import('./cache.js');

    const result = await invalidateCache(['key1', 'key2', 'key3']);
    expect(result).toBe(2);

    expect(mockedFetch).toHaveBeenCalledWith(
      'https://dummy.upstash.io/pipeline',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify([
          ['DEL', 'cache:key1', 'DEL', 'cache:key2', 'DEL', 'cache:key3'],
        ]),
      })
    );
  });

  it('should throw if fetch response is not ok', async () => {
    mockedFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Error',
    } as any);

    const { invalidateCache } = await import('./cache.js');

    await expect(invalidateCache(['key1'])).rejects.toThrow(
      'Upstash pipeline error 500: Internal Error'
    );
  });
});
