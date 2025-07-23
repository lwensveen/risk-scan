import {
  index,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  Bdc,
  HealthcareRollup,
  OfficeReit,
  RegionalBank,
  Stablecoin,
} from '@risk-scan/types';
import {
  categoryPgEnum,
  createTimestampColumn,
  severityPgEnum,
} from './utils.js';

export const entitySnapshotsTable = pgTable(
  'entity_snapshot',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    category: categoryPgEnum('category').notNull(),
    ticker: text('ticker').notNull(),
    payload: jsonb('payload')
      .$type<OfficeReit | HealthcareRollup | RegionalBank | Bdc | Stablecoin>()
      .notNull(),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (table) => [
    uniqueIndex('uniq_es_cat_ticker_ts').on(
      table.category,
      table.ticker,
      table.updatedAt
    ),
    index('idx_entity_snapshot_ticker').on(table.ticker),
  ]
);

export const riskFlagsTable = pgTable(
  'risk_flag',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    category: categoryPgEnum('category').notNull(),
    ticker: text('ticker').notNull(),
    flags: jsonb('flags').$type<string[]>().notNull(),
    severity: severityPgEnum('severity').notNull(),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (table) => [
    uniqueIndex('uniq_rf_cat_ticker_ts').on(
      table.category,
      table.ticker,
      table.updatedAt
    ),
    index('idx_risk_flag_severity').on(table.severity),
  ]
);

export const cikCacheTable = pgTable('cik_cache', {
  ticker: varchar('ticker', { length: 10 }).primaryKey(),
  cik: varchar('cik', { length: 10 }).notNull(),
  createdAt: createTimestampColumn('created_at'),
  updatedAt: createTimestampColumn('updated_at', true),
});

export type EntitySnapshotRow = typeof entitySnapshotsTable.$inferSelect;
export type RiskFlagRow = typeof riskFlagsTable.$inferSelect;
