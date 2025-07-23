import YahooFinance from 'yahoo-finance2';
import axios from 'axios';
import { secConcept, yoy } from './utils.js';
import {
  Bdc,
  HealthcareRollup,
  OfficeReit,
  RegionalBank,
  Stablecoin,
} from '@risk-scan/types';

const yf = new YahooFinance();

const m = (...mods: any[]): any[] => mods;
const num = (val: unknown): number => {
  if (typeof val === 'number') return val;

  if (
    val !== null &&
    typeof val === 'object' &&
    'raw' in val &&
    typeof (val as { raw: unknown }).raw === 'number'
  ) {
    return (val as { raw: number }).raw;
  }

  return 0;
};

const fetchVacancyRateYoY = async (ticker: string) => {
  const occ = await secConcept(ticker, 'OccupancyRate');
  if (occ.length === 0) return null;
  const vacancySeries = occ.map(({ val, end }) => ({ val: 100 - val, end }));
  return yoy(vacancySeries);
};

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

const fetchCRELoans = async (ticker: string) => {
  const { data } = await axios.get(
    'https://banks.data.fdic.gov/api/financials',
    {
      params: {
        filters: `ticker:${ticker}`,
        fields: 'RCON5636',
        sorts: 'DATE:desc',
        limit: 1,
      },
    }
  );
  return data?.data?.[0]?.RCON5636 ?? null;
};

const fetchNPAMoM = async (ticker: string) => {
  const { data } = await axios.get(
    'https://banks.data.fdic.gov/api/financials',
    {
      params: {
        filters: `ticker:${ticker}`,
        fields: 'RCON5525,DATE',
        sorts: 'DATE:desc',
        limit: 2,
      },
    }
  );
  const [latest, prev] = data.data;
  return latest && prev ? latest.RCON5525 - prev.RCON5525 : null;
};

const fetchNAVChangeYoY = async (ticker: string) =>
  yoy(await secConcept(ticker, 'NetAssetValue'));

const fetchBDCFlows = async (ticker: string) => {
  const inflowsSeries = await secConcept(
    ticker,
    'ProceedsFromIssuanceOfCommonStock'
  );
  const outSeries = await secConcept(
    ticker,
    'PaymentsForRepurchaseOfCommonStock'
  );
  return {
    redemptions: outSeries[0]?.val ?? null,
    newInflows: inflowsSeries[0]?.val ?? null,
  };
};

const fetchLoanLossReserves = async (ticker: string) =>
  (await secConcept(ticker, 'AllowanceForLoanAndLeaseLosses'))[0]?.val ?? null;

export async function fetchOfficeREIT(ticker: string): Promise<OfficeReit> {
  const qs = await yf.quoteSummary(ticker, {
    modules: m(
      'balanceSheetHistoryQuarterly',
      'incomeStatementHistoryQuarterly',
      'financialData'
    ),
  });

  const bs = qs.balanceSheetHistoryQuarterly?.balanceSheetStatements?.[0];
  const is = qs.incomeStatementHistoryQuarterly?.incomeStatementHistory?.[0];
  const fd = qs.financialData;
  if (!bs || !is || !fd) throw new Error(`Incomplete data for ${ticker}`);

  return {
    ticker,
    vacancyRateYoY: await fetchVacancyRateYoY(ticker),
    totalDebt: num(bs.totalLiab),
    debtDueNext2Y: num(bs.currentLiabilities),
    ffo: num(fd.ebitda),
    interestExpense: num(is.interestExpense),
  };
}

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

export async function fetchRegionalBank(ticker: string): Promise<RegionalBank> {
  const qs = await yf.quoteSummary(ticker, {
    modules: m(
      'balanceSheetHistoryQuarterly',
      'cashflowStatementHistoryQuarterly',
      'incomeStatementHistoryQuarterly'
    ),
  });

  const bs = qs.balanceSheetHistoryQuarterly?.balanceSheetStatements?.[0];
  if (!bs) throw new Error(`Incomplete data for ${ticker}`);

  return {
    ticker,
    creLoans: await fetchCRELoans(ticker),
    totalLoans: num(bs.totalLiab),
    liquidAssets: num(bs.cash),
    deposits: num(bs.totalLiab),
    npaMoM: await fetchNPAMoM(ticker),
  };
}

export async function fetchBDC(ticker: string): Promise<Bdc> {
  const qs = await yf.quoteSummary(ticker, {
    modules: m(
      'balanceSheetHistoryQuarterly',
      'incomeStatementHistoryQuarterly',
      'summaryDetail'
    ),
  });

  const bs = qs.balanceSheetHistoryQuarterly?.balanceSheetStatements?.[0];
  const sd = qs.summaryDetail;
  if (!bs || !sd) throw new Error(`Incomplete data for ${ticker}`);

  const { redemptions, newInflows } = await fetchBDCFlows(ticker);

  return {
    ticker,
    yieldPercent: num(sd.dividendYield),
    navChangeYoY: await fetchNAVChangeYoY(ticker),
    redemptions,
    newInflows,
    loanLossReserves: await fetchLoanLossReserves(ticker),
    totalLoans: num(bs.totalAssets),
  };
}

export async function fetchStablecoin(symbol: string): Promise<Stablecoin> {
  const res = await axios.get(
    `https://coins.llama.fi/prices/current/coingecko:${symbol.toLowerCase()}`
  );
  const doc = res.data?.coins?.[`coingecko:${symbol.toLowerCase()}`] ?? {};

  return {
    symbol,
    collateralRatio: doc.collateral_ratio ?? 0,
    topHolderShare: doc.top_holders_pct ?? 0,
    tvlChange7d: doc.tvl_7d_change ?? 0,
  };
}
