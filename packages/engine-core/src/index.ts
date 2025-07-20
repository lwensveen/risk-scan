import axios from 'axios';
import { z } from 'zod';
import { RiskFlag } from '@risk-scan/types';
import { secConcept } from '@risk-scan/etl';

const first = async (t: string, c: string) =>
  (await secConcept(t, c))[0]?.val ?? null;

async function buildCoreBank(ticker: string) {
  const tier1 = await first(ticker, 'TierOneRiskBasedCapitalRatio');
  const nii = await first(ticker, 'InterestIncomeExpenseNet');
  const iexp = await first(ticker, 'InterestExpense');
  const icov = nii !== null && iexp ? nii / iexp : null;
  const secLong = await first(
    ticker,
    'AvailableForSaleSecuritiesDebtFairValue'
  );
  const depShort = await first(ticker, 'InterestBearingDeposits');
  const durGap =
    secLong !== null && depShort !== null
      ? (secLong / 1_000_000 - depShort / 1_000_000) * 0.25
      : null;

  const mortgages = await first(ticker, 'LoansAndLeasesReceivableNetReported');
  let hpi: number | null = null;
  try {
    const { data } = await axios.get(
      'https://api.stlouisfed.org/fred/series/observations',
      {
        params: {
          series_id: 'ZHPIUSQ',
          api_key: process.env.FRED_KEY,
          file_type: 'json',
          sort_order: 'desc',
          limit: 1,
        },
      }
    );
    hpi = Number(data?.observations?.[0]?.value) || null;
  } catch {
    /* ignore — leave null */
  }
  const ltv = mortgages !== null && hpi ? mortgages / (hpi * 10 ** 9) : null;

  return {
    ticker,
    durationGapYears: durGap,
    ltvRatio: ltv,
    tier1CapitalRatio: tier1,
    interestCoverage: icov,
  };
}

export const CoreBankSchema = z.object({
  ticker: z.string(),
  durationGapYears: z.number().nullable(),
  ltvRatio: z.number().nullable(),
  tier1CapitalRatio: z.number().nullable(),
  interestCoverage: z.number().nullable(),
});
export type CoreBank = z.infer<typeof CoreBankSchema>;

function checkCoreBank(b: CoreBank): RiskFlag | null {
  const r: string[] = [];
  if ((b.durationGapYears ?? 0) > 3) r.push('🚩 Duration gap > 3y');
  if ((b.ltvRatio ?? 0) > 0.9) r.push('🚩 High LTV');
  if ((b.tier1CapitalRatio ?? 1) < 0.08) r.push('🚩 Tier‑1 < 8 %');
  if ((b.interestCoverage ?? 1) < 1) r.push('🚩 NII negative');

  if (!r.length) return null;
  const sev = r.length >= 3 ? 'high' : r.length === 2 ? 'medium' : 'low';
  return {
    category: 'CoreBank',
    ticker: b.ticker,
    ts: Date.now(),
    flags: r,
    severity: sev,
  } satisfies RiskFlag;
}

export async function runCoreBankRisk(): Promise<RiskFlag[]> {
  const bankTickers = ['JPM', 'BAC', 'C', 'WFC'];
  const out: (RiskFlag | null)[] = [];

  for (const t of bankTickers) {
    try {
      const core = CoreBankSchema.parse(await buildCoreBank(t));
      const f = checkCoreBank(core);
      if (f) out.push(f);
    } catch (e) {
      console.error(`[core‑bank] ${t}:`, e);
    }
  }
  return out.filter((f): f is RiskFlag => f !== null);
}
