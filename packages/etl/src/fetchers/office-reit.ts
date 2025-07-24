import YahooFinance from 'yahoo-finance2';
import { OfficeReit } from '@risk-scan/types';
import { m, num, secConcept, yoy } from '../utils/utils.js';

const yf = new YahooFinance();

const fetchVacancyRateYoY = async (ticker: string) => {
  const occ = await secConcept(ticker, 'OccupancyRate');
  if (occ.length === 0) return null;
  const vacancySeries = occ.map(({ val, end }) => ({ val: 100 - val, end }));
  return yoy(vacancySeries);
};

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
