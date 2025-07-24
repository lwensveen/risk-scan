import './test.setup.js';
import { describe, expect, it } from 'vitest';
import { secConcept, yoy } from '../utils/utils.js';
import { fetchBDC } from './bdc.js';
import { quoteSummaryMock } from './test.setup.js';

describe('fetchBDC', () => {
  it('returns BDC object', async () => {
    quoteSummaryMock.mockResolvedValue({
      balanceSheetHistoryQuarterly: {
        balanceSheetStatements: [{ totalAssets: 900 }],
      },
      incomeStatementHistoryQuarterly: {
        incomeStatementHistory: [{ ebitda: 400 }],
      },
      summaryDetail: { dividendYield: { raw: 0.08 } },
    });

    (secConcept as any)
      .mockResolvedValueOnce([{ val: 300, end: '2023' }])
      .mockResolvedValueOnce([{ val: 100, end: '2023' }])
      .mockResolvedValueOnce([{ val: 30, end: '2023' }])
      .mockResolvedValueOnce([{ val: 12, end: '2023' }]);

    (yoy as any).mockReturnValue(20);

    const result = await fetchBDC('ARCC');
    expect(result).toMatchObject({
      ticker: 'ARCC',
      yieldPercent: 0.08,
      navChangeYoY: 20,
      redemptions: 100,
      newInflows: 300,
      loanLossReserves: 12,
    });
  });

  it('throws on missing data', async () => {
    quoteSummaryMock.mockResolvedValue({});
    await expect(fetchBDC('ARCC')).rejects.toThrow(/Incomplete data/);
  });
});
