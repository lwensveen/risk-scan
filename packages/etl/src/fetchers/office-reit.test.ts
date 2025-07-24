import './test.setup.js';
import { describe, expect, it } from 'vitest';
import { secConcept, yoy } from '../utils/utils.js';
import { quoteSummaryMock } from './test.setup.js';
import { fetchOfficeREIT } from './office-reit.js';

describe('fetchOfficeREIT', () => {
  it('returns OfficeREIT object', async () => {
    quoteSummaryMock.mockResolvedValue({
      balanceSheetHistoryQuarterly: {
        balanceSheetStatements: [{ totalLiab: 1_000, currentLiabilities: 400 }],
      },
      incomeStatementHistoryQuarterly: {
        incomeStatementHistory: [{ interestExpense: 50 }],
      },
      financialData: { ebitda: { raw: 200 } },
    });

    (secConcept as any).mockResolvedValueOnce([{ val: 80, end: '2023-12-31' }]);
    (yoy as any).mockReturnValue(20);

    const out = await fetchOfficeREIT('SLG');
    expect(out).toMatchObject({
      ticker: 'SLG',
      vacancyRateYoY: 20,
      totalDebt: 1_000,
      debtDueNext2Y: 400,
      ffo: 200,
      interestExpense: 50,
    });
  });

  it('throws on missing data', async () => {
    quoteSummaryMock.mockResolvedValue({ balanceSheetHistoryQuarterly: {} });
    await expect(fetchOfficeREIT('SLG')).rejects.toThrow(/Incomplete data/);
  });
});
