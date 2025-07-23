import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import {
  fetchBDC,
  fetchHealthcareRollup,
  fetchOfficeREIT,
  fetchRegionalBank,
  fetchStablecoin,
} from './utils/fetch.js';
import { drizzle } from 'drizzle-orm/neon-serverless';
import {
  BdcSchema,
  HealthcareRollupSchema,
  OfficeReitSchema,
  RegionalBankSchema,
  RiskCategory,
  RiskCategoryEnum,
  StablecoinSchema,
} from '@risk-scan/types';
import { entitySnapshotsTable } from './db/schema.js';
import { riskScanConfig } from '@risk-scan/types/dist/tickers.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function upsertSnapshot(
  category: RiskCategory,
  ticker: string,
  payload: any
) {
  await db
    .insert(entitySnapshotsTable)
    .values({ category, ticker, payload })
    .onConflictDoUpdate({
      target: [entitySnapshotsTable.category, entitySnapshotsTable.ticker],
      set: { payload, updatedAt: new Date() },
    });
}

export async function ingestSnapshots() {
  for (const t of riskScanConfig.OfficeREIT) {
    const raw = await fetchOfficeREIT(t);
    const parsed = OfficeReitSchema.parse(raw);
    await upsertSnapshot(RiskCategoryEnum.enum.OfficeREIT, t, parsed);
  }

  for (const t of riskScanConfig.HealthcareRollup) {
    const raw = await fetchHealthcareRollup(t);
    const parsed = HealthcareRollupSchema.parse(raw);
    await upsertSnapshot(RiskCategoryEnum.enum.HealthcareRollup, t, parsed);
  }

  for (const t of riskScanConfig.RegionalBank) {
    const raw = await fetchRegionalBank(t);
    const parsed = RegionalBankSchema.parse(raw);
    await upsertSnapshot(RiskCategoryEnum.enum.RegionalBank, t, parsed);
  }

  for (const t of riskScanConfig.BDC) {
    const raw = await fetchBDC(t);
    const parsed = BdcSchema.parse(raw);
    await upsertSnapshot(RiskCategoryEnum.enum.BDC, t, parsed);
  }

  for (const s of riskScanConfig.Stablecoin) {
    const raw = await fetchStablecoin(s);
    const parsed = StablecoinSchema.parse(raw);
    await upsertSnapshot(RiskCategoryEnum.enum.Stablecoin, s, parsed);
  }

  console.log('✅ ETL run complete');
}

if (require.main === module) {
  ingestSnapshots().then(() => process.exit(0));
}
