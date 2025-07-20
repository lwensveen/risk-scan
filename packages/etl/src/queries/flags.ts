import { desc, eq } from 'drizzle-orm';
import { entitySnapshotTable, riskFlagTable } from '../db/schema.js';
import { db } from '../db/client.js';

export function getLatestFlags(limit = 100) {
  return db
    .select()
    .from(riskFlagTable)
    .orderBy(desc(riskFlagTable.ts))
    .limit(limit);
}

export function getFlagsByTicker(ticker: string) {
  return db
    .select()
    .from(riskFlagTable)
    .where(eq(riskFlagTable.ticker, ticker))
    .orderBy(desc(riskFlagTable.ts));
}

export function getSnapshotByTicker(ticker: string) {
  return db
    .select()
    .from(entitySnapshotTable)
    .where(eq(entitySnapshotTable.ticker, ticker))
    .orderBy(desc(entitySnapshotTable.ts))
    .limit(1);
}
