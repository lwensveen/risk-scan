import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { db, entitySnapshotsTable, riskFlagsTable } from '@risk-scan/db';
import { RiskCategory } from '@risk-scan/types';

export interface FlagsFilter {
  tickers?: string[];
  category?: RiskCategory;
  from?: Date | number;
  to?: Date | number;
  useCreatedAt?: boolean;
}

export interface SnapshotFilter {
  ticker?: string;
  from?: Date | number;
  to?: Date | number;
}

export function getLatestFlags(limit = 100) {
  return db
    .select()
    .from(riskFlagsTable)
    .orderBy(desc(riskFlagsTable.updatedAt))
    .limit(limit);
}

export function getFlagsByTicker(ticker: string) {
  return db
    .select()
    .from(riskFlagsTable)
    .where(eq(riskFlagsTable.ticker, ticker))
    .orderBy(desc(riskFlagsTable.updatedAt));
}

export function getSnapshotByTicker(ticker: string) {
  return db
    .select()
    .from(entitySnapshotsTable)
    .where(eq(entitySnapshotsTable.ticker, ticker))
    .orderBy(desc(entitySnapshotsTable.updatedAt))
    .limit(1);
}

export async function getFlagsFiltered(filters: FlagsFilter) {
  const { tickers, category, from, to, useCreatedAt } = filters;
  const where = [];

  const tsColumn = useCreatedAt
    ? riskFlagsTable.createdAt
    : riskFlagsTable.updatedAt;

  if (tickers?.length) where.push(inArray(riskFlagsTable.ticker, tickers));
  if (category) where.push(eq(riskFlagsTable.category, category));
  if (from) where.push(gte(tsColumn, new Date(from)));
  if (to) where.push(lte(tsColumn, new Date(to)));

  return db
    .select()
    .from(riskFlagsTable)
    .where(where.length ? and(...where) : undefined);
}

export async function getLatestFlagsForTicker(ticker: string) {
  return db
    .select()
    .from(riskFlagsTable)
    .where(eq(riskFlagsTable.ticker, ticker))
    .orderBy(desc(riskFlagsTable.createdAt))
    .limit(10);
}

export async function getSnapshotsFiltered(filters: SnapshotFilter) {
  const { ticker, from, to } = filters;
  const where = [];

  if (ticker) where.push(eq(entitySnapshotsTable.ticker, ticker));
  if (from) where.push(gte(entitySnapshotsTable.updatedAt, new Date(from)));
  if (to) where.push(lte(entitySnapshotsTable.updatedAt, new Date(to)));

  return db
    .select()
    .from(entitySnapshotsTable)
    .where(where.length ? and(...where) : undefined);
}
