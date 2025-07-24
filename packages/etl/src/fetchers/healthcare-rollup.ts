import YahooFinance from 'yahoo-finance2';
import axios from 'axios';
import { HealthcareRollup } from '@risk-scan/types';
import { m, num, secConcept } from '../utils/utils.js';

const yf = new YahooFinance();

const fetchLeaseObligationsOffBS = async (ticker: string) => {
  const undiscounted = await secConcept(
    ticker,
    'OperatingLeaseLiabilityUndiscounted'
  );
  const discounted = await secConcept(ticker, 'OperatingLeaseLiability');
  if (undiscounted.length === 0 || discounted.length === 0) return null;
  return undiscounted[0]!.val - discounted[0]!.val;
};

const PLACER_KEY = process.env.PLACER_KEY!;
const fetchSameStoreVisitsYoY = async (ticker: string) => {
  if (!PLACER_KEY) return null;
  try {
    const { data } = await axios.get(
      `https://api.placer.ai/v2/organizations/${ticker}/same-store-visits`,
      {
        params: { rollup: 'year' },
        headers: { 'x-api-key': PLACER_KEY },
      }
    );
    const { current, prior } = data;
    return ((current - prior) / prior) * 100;
  } catch {
    return null;
  }
};

export async function fetchHealthcareRollup(
  ticker: string
): Promise<HealthcareRollup> {
  const qs = await yf.quoteSummary(ticker, {
    modules: m(
      'balanceSheetHistoryQuarterly',
      'incomeStatementHistoryQuarterly',
      'financialData'
    ),
  });

  const bs = qs.balanceSheetHistoryQuarterly?.balanceSheetStatements?.[0];
  const is = qs.incomeStatementHistoryQuarterly?.incomeStatementHistory?.[0];
  if (!bs || !is) throw new Error(`Incomplete data for ${ticker}`);

  return {
    ticker,
    debt: num(bs.totalLiab),
    ebitda: num(is.ebitda),
    leaseObligationsOffBS: await fetchLeaseObligationsOffBS(ticker),
    totalAssets: num(bs.totalAssets),
    sameStoreVisitsYoY: await fetchSameStoreVisitsYoY(ticker),
  };
}
