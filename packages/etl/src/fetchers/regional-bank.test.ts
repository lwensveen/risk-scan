import './test.setup.js';
import { describe, expect, it, vi } from 'vitest';
import { fetchRegionalBank } from './regional-bank.js';
import { quoteSummaryMock } from './test.setup.js';
import * as tickerToCikModule from '../utils/ticker-to-cik.js';
import * as fetchSecFactModule from '../utils/fetch-sec-fact.js';

describe('fetchRegionalBank', () => {
  it('returns bank object (normal case)', async () => {
    quoteSummaryMock.mockResolvedValue({
      balanceSheetHistoryQuarterly: {
        balanceSheetStatements: [
          { totalLiab: 1000, cash: 200, totalAssets: 1500 },
        ],
      },
    });

    vi.spyOn(tickerToCikModule, 'tickerToCIK').mockResolvedValue('00001234');

    vi.spyOn(fetchSecFactModule, 'fetchSECFact').mockImplementation(
      async (cik, taxonomy, tag) => {
        switch (tag) {
          case 'HeldToMaturitySecurities':
            return 100;
          case 'AccumulatedOtherComprehensiveIncome':
            return -50;
          case 'Tier1Capital':
            return 200;
          case 'DepositLiabilitiesUninsured':
            return 300;
          case 'DepositLiabilities':
            return 1200;
          case 'Assets':
            return 1600;
          default:
            return null;
        }
      }
    );

    const result = await fetchRegionalBank('HBAN');

    expect(result).toMatchObject({
      ticker: 'HBAN',
      creLoans: 500,
      totalLoans: 1000,
      liquidAssets: 200,
      deposits: 1000,
      npaMoM: 5,
      htmSecurities: 100,
      aoci: -50,
      tier1Capital: 200,
      uninsuredDeposits: 300,
      totalDeposits: 1200,
      totalAssets: 1600,
    });
  });

  it('handles missing CIK and SEC facts fallback', async () => {
    quoteSummaryMock.mockResolvedValue({
      balanceSheetHistoryQuarterly: {
        balanceSheetStatements: [
          { totalLiab: 900, cash: 100, totalAssets: 1200 },
        ],
      },
    });

    vi.spyOn(tickerToCikModule, 'tickerToCIK').mockResolvedValue(null);

    const result = await fetchRegionalBank('ZZZZ');

    expect(result).toMatchObject({
      ticker: 'ZZZZ',
      creLoans: 500,
      totalLoans: 900,
      liquidAssets: 100,
      deposits: 900,
      npaMoM: 5,
      htmSecurities: null,
      aoci: null,
      tier1Capital: 0,
      uninsuredDeposits: null,
      totalDeposits: 900,
      totalAssets: 1200,
    });
  });
});
