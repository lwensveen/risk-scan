import axios from 'axios';
import { and, eq, sql } from 'drizzle-orm';
import { cikCacheTable } from '../db/schema.js';
import { db } from '../db/client.js';

async function loadMasterList(): Promise<Record<string, string>> {
  const { data } = await axios.get(
    'https://www.sec.gov/files/company_tickers.json',
    { responseType: 'json', headers: { 'User-Agent': 'risk-scan 0.1' } }
  );
  return Object.fromEntries(
    Object.values(data).map((d: any) => [
      d.ticker,
      String(d.cik_str).padStart(10, '0'),
    ])
  );
}

let masterList: Record<string, string> | null = null;

export async function resolveCik(ticker: string): Promise<string> {
  const cached = await db
    .select()
    .from(cikCacheTable)
    .where(
      and(
        eq(cikCacheTable.ticker, ticker.toUpperCase()),
        sql`${cikCacheTable.updatedAt} >= NOW() - INTERVAL '90 days'`
      )
    )
    .limit(1);

  if (cached.length) return cached[0]!.cik;

  if (!masterList) masterList = await loadMasterList();

  const cik = masterList[ticker.toUpperCase()];
  if (!cik) throw new Error(`CIK not found for ticker ${ticker}`);

  db.insert(cikCacheTable)
    .values({ ticker: ticker.toUpperCase(), cik })
    .onConflictDoUpdate({
      target: cikCacheTable.ticker,
      set: { cik, updatedAt: new Date() },
    })
    .catch(console.error);

  return cik;
}
