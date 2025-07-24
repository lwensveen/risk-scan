import YahooFinance from 'yahoo-finance2';
import { Bdc } from '@risk-scan/types';
import { m, num, secConcept, yoy } from '../utils/utils.js';

const yf = new YahooFinance();

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

const fetchNAVChangeYoY = async (ticker: string) =>
  yoy(await secConcept(ticker, 'NetAssetValue'));

const fetchLoanLossReserves = async (ticker: string) =>
  (await secConcept(ticker, 'AllowanceForLoanAndLeaseLosses'))[0]?.val ?? null;

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
