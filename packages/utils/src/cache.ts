import fetch from 'node-fetch';

const {
  UPSTASH_REDIS_REST_URL: REST_URL,
  UPSTASH_REDIS_REST_TOKEN: REST_TOKEN,
} = process.env;

if (!REST_URL || !REST_TOKEN) {
  throw new Error('Upstash env vars missing (UPSTASH_REDIS_REST_URL/TOKEN)');
}

const PREFIX = 'cache:';

const toRedisKey = (k: string) => `${PREFIX}${k}`;

export async function invalidateCache(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;

  const pipeline = keys.flatMap((k) => ['DEL', toRedisKey(k)]);

  const res = await fetch(`${REST_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([pipeline]),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upstash pipeline error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as { result: number[][] };
  return json.result.reduce((sum, arr) => sum + (arr?.[0] ?? 0), 0);
}
