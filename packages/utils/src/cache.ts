import nodeFetch from 'node-fetch';

const $fetch: typeof fetch =
  (globalThis as any).fetch ?? (nodeFetch as unknown as typeof fetch);

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const CACHE_NAMESPACE = process.env.CACHE_NAMESPACE || '';
const DISABLE_CACHE =
  process.env.DISABLE_CACHE === '1' ||
  process.env.NODE_ENV === 'test' ||
  process.env.CI === 'true';

const DEV = process.env.NODE_ENV !== 'production';

export interface CacheClient {
  get(key: string): Promise<string | null>;

  set(key: string, value: string, ttlSeconds?: number): Promise<void>;

  del(key: string): Promise<void>;
}

const noopClient: CacheClient = {
  async get() {
    return null;
  },
  async set() {
    /* no-op */
  },
  async del() {
    /* no-op */
  },
};

let warned = false;

function warnOnce(msg: string) {
  if (!warned && DEV) {
    console.warn(msg);
    warned = true;
  }
}

function withNs(key: string): string {
  return CACHE_NAMESPACE ? `${CACHE_NAMESPACE}:${key}` : key;
}

function upstashClient(url: string, token: string): CacheClient {
  async function call(
    method: 'GET' | 'SET' | 'DEL',
    body: Record<string, unknown> = {},
    timeoutMs = 5000
  ) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await $fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ method, ...body }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        warnOnce(
          `[cache] Upstash responded ${res.status}; continuing without hard failure`
        );
        return null;
      }

      return (await res.json()) as any;
    } catch (err) {
      warnOnce(
        `[cache] Upstash request failed (${(err as Error).message}); continuing`
      );
      return null;
    } finally {
      clearTimeout(id);
    }
  }

  return {
    async get(key) {
      const r = await call('GET', { key: withNs(key) });
      return r?.result ?? null;
    },
    async set(key, value, ttlSeconds) {
      await call('SET', { key: withNs(key), value, ttlSeconds });
    },
    async del(key) {
      await call('DEL', { key: withNs(key) });
    },
  };
}

export const cache: CacheClient =
  !DISABLE_CACHE && REST_URL && REST_TOKEN
    ? upstashClient(REST_URL, REST_TOKEN)
    : (() => {
        if (!DISABLE_CACHE && DEV) {
          warnOnce('[cache] Upstash env missing; using no-op cache');
        }
        return noopClient;
      })();

export const isCacheEnabled = !DISABLE_CACHE && Boolean(REST_URL && REST_TOKEN);

export const cacheInfo = {
  enabled: isCacheEnabled,
  namespace: CACHE_NAMESPACE || null,
};

export async function invalidateCache(keys: string[]): Promise<number> {
  if (!keys.length) return 0;
  if (!isCacheEnabled || !REST_URL || !REST_TOKEN) return 0;

  const commands = keys.map((k) => ['DEL', withNs(k)]);

  const res = await $fetch(`${REST_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(
      `Upstash pipeline error ${res.status}: ${msg || 'Unknown error'}`
    );
  }

  const data = (await res.json()) as { result?: unknown };
  const flat = Array.isArray((data as any)?.result)
    ? (data as any).result.flat()
    : [];
  return flat.reduce((sum: number, x: number) => sum + (x ? 1 : 0), 0);
}
