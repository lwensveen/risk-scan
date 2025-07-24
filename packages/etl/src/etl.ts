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
  RiskCategoryTS,
  RiskFlagEnum,
  riskScanConfig,
  RiskSeverityEnum,
  StablecoinSchema,
} from '@risk-scan/types';
import { entitySnapshotsTable, riskFlagsTable } from '@risk-scan/db';
import { fetchLatest10KFootnote } from './queries/fetch-10k-footnote.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export async function upsertFlag(
  ticker: string,
  category: RiskCategory,
  flag: RiskFlagEnum,
  severity: RiskSeverityEnum = RiskSeverityEnum.Medium
) {
  await db
    .insert(riskFlagsTable)
    .values({
      category,
      ticker,
      flags: [flag],
      severity,
      updatedAt: new Date(),
    })
    .onConflictDoNothing();
}

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

    const gc = await fetchLatest10KFootnote(t);
    if (gc)
      await upsertFlag(t, RiskCategoryTS.OfficeREIT, RiskFlagEnum.GoingConcern);
  }

  for (const t of riskScanConfig.HealthcareRollup) {
    const raw = await fetchHealthcareRollup(t);
    const parsed = HealthcareRollupSchema.parse(raw);
    await upsertSnapshot(RiskCategoryEnum.enum.HealthcareRollup, t, parsed);

    const gc = await fetchLatest10KFootnote(t);
    if (gc)
      await upsertFlag(
        t,
        RiskCategoryTS.HealthcareRollup,
        RiskFlagEnum.GoingConcern
      );
  }

  for (const t of riskScanConfig.RegionalBank) {
    const raw = await fetchRegionalBank(t);
    const parsed = RegionalBankSchema.parse(raw);
    await upsertSnapshot(RiskCategoryEnum.enum.RegionalBank, t, parsed);

    const gc = await fetchLatest10KFootnote(t);
    if (gc)
      await upsertFlag(
        t,
        RiskCategoryTS.RegionalBank,
        RiskFlagEnum.GoingConcern
      );
  }

  for (const t of riskScanConfig.BDC) {
    const raw = await fetchBDC(t);
    const parsed = BdcSchema.parse(raw);
    await upsertSnapshot(RiskCategoryEnum.enum.BDC, t, parsed);

    const gc = await fetchLatest10KFootnote(t);
    if (gc) await upsertFlag(t, RiskCategoryTS.BDC, RiskFlagEnum.GoingConcern);
  }

  for (const s of riskScanConfig.Stablecoin) {
    const raw = await fetchStablecoin(s);
    const parsed = StablecoinSchema.parse(raw);
    await upsertSnapshot(RiskCategoryEnum.enum.Stablecoin, s, parsed);

    const gc = await fetchLatest10KFootnote(s);
    if (gc)
      await upsertFlag(s, RiskCategoryTS.Stablecoin, RiskFlagEnum.GoingConcern);
  }

  console.log('✅ ETL run complete');
}

export async function main() {
  await ingestSnapshots();
  process.exit(0);
}

if (typeof require !== 'undefined' && require.main === module) {
  main();
}
