import axios from 'axios';
import { CoreBankSchema } from '@risk-scan/types';
import { secConcept } from '@risk-scan/etl';
import { checkCoreBank } from './rules/check-core-bank';
import { RiskFlag } from '@risk-scan/db';

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
