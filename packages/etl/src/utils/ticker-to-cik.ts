const cikCache = new Map<string, string>();

export async function tickerToCIK(t: string): Promise<string | null> {
  if (cikCache.has(t)) return cikCache.get(t)!;

  const res = await fetch(
    `https://query2.finance.yahoo.com/v1/finance/search?q=${t}&quotesCount=1`
  );

  const cik = (await res.json()).quotes?.[0]?.cik ?? null;

  if (cik) cikCache.set(t, cik);

  return cik;
}
