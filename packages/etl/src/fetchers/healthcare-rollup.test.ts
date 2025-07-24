import './test.setup.js';
import { describe, expect, it } from 'vitest';
import { secConcept } from '../utils/utils.js';
import { fetchHealthcareRollup } from './healthcare-rollup.js';
import { quoteSummaryMock } from './test.setup.js';

describe('fetchHealthcareRollup', () => {
  it('returns rollup object', async () => {
    quoteSummaryMock.mockResolvedValue({
      balanceSheetHistoryQuarterly: {
        balanceSheetStatements: [{ totalLiab: 500, totalAssets: 800 }],
      },
      incomeStatementHistoryQuarterly: {
        incomeStatementHistory: [{ ebitda: 300 }],
      },
    });

    (secConcept as any)
      .mockResolvedValueOnce([{ val: 100, end: '2023-12-31' }])
      .mockResolvedValueOnce([{ val: 80, end: '2023-12-31' }]);

    const result = await fetchHealthcareRollup('AMEH');
    expect(result).toMatchObject({
      leaseObligationsOffBS: 20,
      sameStoreVisitsYoY: 100,
    });
  });

  it('throws on missing data', async () => {
    quoteSummaryMock.mockResolvedValue({});
    await expect(fetchHealthcareRollup('AMEH')).rejects.toThrow(
      /Incomplete data/
    );
  });
});
