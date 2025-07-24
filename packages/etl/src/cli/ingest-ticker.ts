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
  StablecoinSchema,
} from '@risk-scan/types';
import { upsertFlag, upsertSnapshot } from '../etl.js';
import { fetchOfficeREIT } from '../fetchers/office-reit.js';
import { fetchHealthcareRollup } from '../fetchers/healthcare-rollup.js';
import { fetchRegionalBank } from '../fetchers/regional-bank.js';
import { fetchBDC } from '../fetchers/bdc.js';
import { fetchStablecoin } from '../fetchers/stablecoin.js';

const LOOKUP: Record<
  string,
  {
    category: RiskCategory;
    catTS: RiskCategoryTS;
    fetch: (t: string) => Promise<unknown>;
    schema: any;
  }
> = {};

for (const t of riskScanConfig.OfficeREIT)
  LOOKUP[t] = {
    category: RiskCategoryEnum.enum.OfficeREIT,
    catTS: RiskCategoryTS.OfficeREIT,
    fetch: fetchOfficeREIT,
    schema: OfficeReitSchema,
  };

for (const t of riskScanConfig.HealthcareRollup)
  LOOKUP[t] = {
    category: RiskCategoryEnum.enum.HealthcareRollup,
    catTS: RiskCategoryTS.HealthcareRollup,
    fetch: fetchHealthcareRollup,
    schema: HealthcareRollupSchema,
  };

for (const t of riskScanConfig.RegionalBank)
  LOOKUP[t] = {
    category: RiskCategoryEnum.enum.RegionalBank,
    catTS: RiskCategoryTS.RegionalBank,
    fetch: fetchRegionalBank,
    schema: RegionalBankSchema,
  };

for (const t of riskScanConfig.BDC)
  LOOKUP[t] = {
    category: RiskCategoryEnum.enum.BDC,
    catTS: RiskCategoryTS.BDC,
    fetch: fetchBDC,
    schema: BdcSchema,
  };

for (const t of riskScanConfig.Stablecoin)
  LOOKUP[t] = {
    category: RiskCategoryEnum.enum.Stablecoin,
    catTS: RiskCategoryTS.Stablecoin,
    fetch: fetchStablecoin,
    schema: StablecoinSchema,
  };

export async function ingestTicker(ticker: string) {
  const entry = LOOKUP[ticker.toUpperCase()];
  if (!entry) throw new Error(`Unknown ticker ${ticker}`);

  const raw = await entry.fetch(ticker);
  const parsed = entry.schema.parse(raw);
  await upsertSnapshot(entry.category, ticker, parsed);

  const gc = await import('../queries/fetch-10k-footnote.js').then((m) =>
    m.fetchLatest10KFootnote(ticker)
  );
  if (gc) await upsertFlag(ticker, entry.catTS, RiskFlagEnum.GoingConcern);

  console.log(`✅  Ingested ${ticker}`);
}
