import {
  bigint,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { categoryValues, severityValues } from '@risk-scan/types';

export const severityPgEnum = pgEnum('severity', severityValues);
export const categoryPgEnum = pgEnum('risk_category', categoryValues);

export const entitySnapshotTable = pgTable(
  'entity_snapshot',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    category: categoryPgEnum('category').notNull(),
    ticker: text('ticker').notNull(),
    ts: bigint('ts', { mode: 'number' }).notNull(), // epoch‑ms
    payload: jsonb('payload').notNull(),
  },
  (table) => [
    uniqueIndex('uniq_es_cat_ticker_ts').on(
      table.category,
      table.ticker,
      table.ts
    ),
    index('idx_entity_snapshot_ticker').on(table.ticker),
  ]
);

export const riskFlagTable = pgTable(
  'risk_flag',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    category: categoryPgEnum('category').notNull(),
    ticker: text('ticker').notNull(),
    ts: bigint('ts', { mode: 'number' }).notNull(),
    flags: jsonb('flags').$type<string[]>().notNull(),
    severity: severityPgEnum('severity').notNull(),
  },
  (table) => [
    uniqueIndex('uniq_rf_cat_ticker_ts').on(
      table.category,
      table.ticker,
      table.ts
    ),
    index('idx_risk_flag_severity').on(table.severity),
  ]
);
export type EntitySnapshotRow = typeof entitySnapshotTable.$inferSelect;
export type RiskFlagRow = typeof riskFlagTable.$inferSelect;
