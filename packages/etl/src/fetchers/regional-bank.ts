import YahooFinance from 'yahoo-finance2';
import axios from 'axios';
import { RegionalBank } from '@risk-scan/types';
import { fetchSECFact } from '../utils/fetch-sec-fact.js';
import { m, num } from '../utils/utils.js';
import { tickerToCIK } from '../utils/ticker-to-cik.js';

const yf = new YahooFinance();

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

  const cik = await tickerToCIK(ticker);
  const [
    htmSecurities,
    aoci,
    tier1Capital,
    uninsuredDeposits,
    totalDeposits,
    totalAssets,
  ] = cik
    ? await Promise.all([
        fetchSECFact(cik, 'us-gaap', 'HeldToMaturitySecurities'),
        fetchSECFact(cik, 'us-gaap', 'AccumulatedOtherComprehensiveIncome'),
        fetchSECFact(cik, 'us-gaap', 'Tier1Capital'),
        fetchSECFact(cik, 'us-gaap', 'DepositLiabilitiesUninsured'),
        fetchSECFact(cik, 'us-gaap', 'DepositLiabilities'),
        fetchSECFact(cik, 'us-gaap', 'Assets'),
      ])
    : Array(6).fill(null);

  return {
    ticker,
    creLoans: await fetchCRELoans(ticker),
    totalLoans: num(bs.totalLiab),
    liquidAssets: num(bs.cash),
    deposits: num(bs.totalLiab),
    npaMoM: await fetchNPAMoM(ticker),
    htmSecurities,
    aoci,
    tier1Capital: tier1Capital ?? 0,
    uninsuredDeposits,
    totalDeposits: totalDeposits ?? num(bs.totalLiab),
    totalAssets: totalAssets ?? num(bs.totalAssets),
  };
}
