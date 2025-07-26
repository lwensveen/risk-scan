import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockedFetch = vi.fn();

function enableCacheEnv() {
  process.env.NODE_ENV = 'development';
  process.env.CI = 'false';
  delete process.env.DISABLE_CACHE;
  process.env.UPSTASH_REDIS_REST_URL = 'https://dummy.upstash.io';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  process.env.CACHE_NAMESPACE = 'cache';
}

function clearUpstashEnv() {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.CACHE_NAMESPACE;
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
  mockedFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('invalidateCache (pipeline helper)', () => {
  it('returns 0 for empty keys array', async () => {
    enableCacheEnv();
    vi.stubGlobal('fetch', mockedFetch);

    const { invalidateCache } = await import('./cache.js');
    const result = await invalidateCache([]);
    expect(result).toBe(0);
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it('calls /pipeline with correct payload and returns the sum of deleted keys', async () => {
    enableCacheEnv();
    vi.stubGlobal('fetch', mockedFetch);
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: [[1], [0], [1]] }),
    } as any);

    const { invalidateCache } = await import('./cache.js');
    const result = await invalidateCache(['key1', 'key2', 'key3']);
    expect(result).toBe(2);

    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch).toHaveBeenCalledWith(
      'https://dummy.upstash.io/pipeline',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify([
          ['DEL', 'cache:key1'],
          ['DEL', 'cache:key2'],
          ['DEL', 'cache:key3'],
        ]),
      })
    );
  });

  it('throws if fetch response is not ok', async () => {
    enableCacheEnv();
    vi.stubGlobal('fetch', mockedFetch);
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

describe('cache client behavior', () => {
  it('warns once and uses no-op when env is missing', async () => {
    process.env.NODE_ENV = 'development';
    clearUpstashEnv();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', mockedFetch);

    const { cache, isCacheEnabled, cacheInfo } = await import('./cache.js');
    expect(isCacheEnabled).toBe(false);
    expect(cacheInfo.enabled).toBe(false);

    const g = await cache.get('k');
    await cache.set('k', 'v', 60);
    await cache.del('k');
    expect(g).toBeNull();
    expect(mockedFetch).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);

    await cache.get('k2');
    expect(warnSpy).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });

  it('get/set/del send namespaced keys and ttl, soft-fail on non-ok', async () => {
    enableCacheEnv();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', mockedFetch);

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'value' }),
    } as any);

    mockedFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'err',
    } as any);

    mockedFetch.mockRejectedValueOnce(new Error('aborted'));

    const { cache } = await import('./cache.js');

    const v = await cache.get('keyA');
    expect(v).toBe('value');

    await cache.set('keyB', 'payload', 60);
    await cache.del('keyC');

    const calls = mockedFetch.mock.calls;

    const getBody = JSON.parse((calls[0]![1] as any).body as string) as Record<
      string,
      unknown
    >;
    expect(getBody).toMatchObject({ method: 'GET', key: 'cache:keyA' });

    const setBody = JSON.parse((calls[1]![1] as any).body as string) as Record<
      string,
      unknown
    >;
    expect(setBody).toMatchObject({
      method: 'SET',
      key: 'cache:keyB',
      value: 'payload',
      ttlSeconds: 60,
    });

    const delBody = JSON.parse((calls[2]![1] as any).body as string) as Record<
      string,
      unknown
    >;
    expect(delBody).toMatchObject({ method: 'DEL', key: 'cache:keyC' });

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('isCacheEnabled and cacheInfo reflect env toggles', async () => {
    enableCacheEnv();
    vi.stubGlobal('fetch', mockedFetch);
    let mod = await import('./cache.js');
    expect(mod.isCacheEnabled).toBe(true);
    expect(mod.cacheInfo).toEqual({ enabled: true, namespace: 'cache' });

    vi.resetModules();
    process.env.DISABLE_CACHE = '1';
    mod = await import('./cache.js');
    expect(mod.isCacheEnabled).toBe(false);
    expect(mod.cacheInfo.enabled).toBe(false);
  });

  it('falls back to node-fetch when global fetch is unavailable', async () => {
    vi.unstubAllGlobals();
    delete (globalThis as any).fetch;

    const nodeFetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: null }),
    });
    vi.doMock('node-fetch', () => ({ default: nodeFetchMock }));

    enableCacheEnv();

    const mod = await import('./cache.js');

    await mod.cache.get('k1');
    expect(nodeFetchMock).toHaveBeenCalledTimes(1);

    const [, init] = nodeFetchMock.mock.calls[0]!;
    expect((init as any).method).toBe('POST');
    expect((init as any).headers).toMatchObject({
      Authorization: 'Bearer test-token',
      'Content-Type': 'application/json',
    });
  });
});
