import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import {
  jsonb,
  pgTable,
  serial,
  timestamp as pgTimestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  fetchBDC,
  fetchHealthcareRollup,
  fetchOfficeREIT,
  fetchRegionalBank,
  fetchStablecoin,
} from './fetch.js';
import { drizzle } from 'drizzle-orm/neon-serverless';
import {
  Bdc,
  BdcSchema,
  HealthcareRollup,
  HealthcareRollupSchema,
  OfficeReit,
  OfficeReitSchema,
  RegionalBank,
  RegionalBankSchema,
  RiskCategoryEnum,
  Stablecoin,
  StablecoinSchema,
} from '@risk-scan/types';

export const entitySnapshots = pgTable('entity_snapshot', {
  id: serial('id').primaryKey(),
  category: varchar('category', { length: 32 }).notNull(),
  ticker: varchar('ticker', { length: 16 }).notNull(),
  payload: jsonb('payload')
    .$type<OfficeReit | HealthcareRollup | RegionalBank | Bdc | Stablecoin>()
    .notNull(),
  ts: pgTimestamp('ts', { withTimezone: true }).defaultNow().notNull(),
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const officeTickers = ['BXP', 'FRT'];
const healthcareTickers = ['GH', 'OVV'];
const bankTickers = ['FRC', 'SIVB'];
const bdcTickers = ['MAIN', 'FSK'];
const stablecoins = ['UST', 'DAI'];

async function upsertSnapshot(category: string, ticker: string, payload: any) {
  await db
    .insert(entitySnapshots)
    .values({ category, ticker, payload })
    .onConflictDoUpdate({
      target: [entitySnapshots.category, entitySnapshots.ticker],
      set: { payload, ts: new Date() },
    });
}

export async function runEtl() {
  for (const t of officeTickers) {
    const raw = await fetchOfficeREIT(t);
    const parsed = OfficeReitSchema.parse(raw);
    await upsertSnapshot(RiskCategoryEnum.enum.OfficeREIT, t, parsed);
  }

  for (const t of healthcareTickers) {
    const raw = await fetchHealthcareRollup(t);
    const parsed = HealthcareRollupSchema.parse(raw);
    await upsertSnapshot(RiskCategoryEnum.enum.HealthcareRollup, t, parsed);
  }

  for (const t of bankTickers) {
    const raw = await fetchRegionalBank(t);
    const parsed = RegionalBankSchema.parse(raw);
    await upsertSnapshot(RiskCategoryEnum.enum.RegionalBank, t, parsed);
  }

  for (const t of bdcTickers) {
    const raw = await fetchBDC(t);
    const parsed = BdcSchema.parse(raw);
    await upsertSnapshot(RiskCategoryEnum.enum.BDC, t, parsed);
  }

  for (const s of stablecoins) {
    const raw = await fetchStablecoin(s);
    const parsed = StablecoinSchema.parse(raw);
    await upsertSnapshot(RiskCategoryEnum.enum.Stablecoin, s, parsed);
  }

  console.log('✅ ETL run complete');
}

if (require.main === module) {
  runEtl().then(() => process.exit(0));
}
