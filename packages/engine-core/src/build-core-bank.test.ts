import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { secConcept } from '@risk-scan/etl';
import { checkCoreBank } from './rules/check-core-bank';
import { CoreBankSchema } from '@risk-scan/types';
import { runCoreBankRisk } from './build-core-bank';

vi.mock('@risk-scan/etl', () => ({
  secConcept: vi.fn(),
}));

vi.mock('./rules/check-core-bank', () => ({
  checkCoreBank: vi.fn(),
}));

vi.mock('@risk-scan/types', async (importOriginal) => {
  const mod = await importOriginal<any>();
  return {
    ...mod,
    CoreBankSchema: {
      parse: vi.fn(),
    },
  };
});

const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('runCoreBankRisk', () => {
  it('returns flags from parsed and validated core bank data', async () => {
    (secConcept as any).mockImplementation(
      async (_ticker: string, concept: string) => {
        const values: Record<string, number> = {
          TierOneRiskBasedCapitalRatio: 0.15,
          InterestIncomeExpenseNet: 200,
          InterestExpense: 100,
          AvailableForSaleSecuritiesDebtFairValue: 500_000_000,
          InterestBearingDeposits: 300_000_000,
          LoansAndLeasesReceivableNetReported: 100_000_000,
        };
        return values[concept] != null
          ? [{ val: values[concept], end: '2023-12-31' }]
          : [];
      }
    );

    mockedAxios.get = vi.fn().mockResolvedValue({
      data: {
        observations: [{ value: '450' }],
      },
    });

    (CoreBankSchema.parse as any).mockImplementation((core: any) => core);

    (checkCoreBank as any).mockImplementation((data: { ticker: any }) => ({
      id: 1,
      category: 'CoreBank',
      ticker: data.ticker,
      date: new Date().toISOString(),
      severity: 'medium',
      flags: ['mock flag'],
    }));

    const result = await runCoreBankRisk();
    expect(result).toHaveLength(4);
    expect(result.every((f) => f.category === 'CoreBank')).toBe(true);
  });

  it('skips and logs if CoreBankSchema.parse throws', async () => {
    (secConcept as any).mockResolvedValue([{ val: 1, end: '2023-12-31' }]);
    mockedAxios.get = vi
      .fn()
      .mockResolvedValue({ data: { observations: [{ value: '400' }] } });

    (CoreBankSchema.parse as any).mockImplementation(() => {
      throw new Error('invalid shape');
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await runCoreBankRisk();
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('returns only non-null RiskFlags', async () => {
    (secConcept as any).mockResolvedValue([{ val: 1, end: '2023-12-31' }]);
    mockedAxios.get = vi
      .fn()
      .mockResolvedValue({ data: { observations: [{ value: '400' }] } });

    (CoreBankSchema.parse as any).mockImplementation((core: any) => core);

    (checkCoreBank as any)
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => ({
        id: 2,
        category: 'CoreBank',
        ticker: 'BAC',
        date: new Date().toISOString(),
        severity: 'medium',
        flags: ['example'],
      }))
      .mockImplementation(() => null);

    const result = await runCoreBankRisk();
    expect(result).toHaveLength(1);
    expect(result[0]!.ticker).toBe('BAC');
  });
});

it('covers null branches: icov/durationGap/ltv and axios error path', async () => {
  const conceptMap: Record<string, Partial<Record<string, number | null>>> = {
    JPM: {
      TierOneRiskBasedCapitalRatio: 0.12,
      InterestIncomeExpenseNet: 200,
      InterestExpense: 100,
      AvailableForSaleSecuritiesDebtFairValue: 500_000_000,
      InterestBearingDeposits: 300_000_000,
      LoansAndLeasesReceivableNetReported: 100_000_000,
    },
    BAC: {
      TierOneRiskBasedCapitalRatio: 0.13,
      InterestIncomeExpenseNet: null,
      InterestExpense: 50,
      AvailableForSaleSecuritiesDebtFairValue: 400_000_000,
      InterestBearingDeposits: 300_000_000,
      LoansAndLeasesReceivableNetReported: 90_000_000,
    },
    C: {
      TierOneRiskBasedCapitalRatio: 0.14,
      InterestIncomeExpenseNet: 150,
      InterestExpense: 75,
      AvailableForSaleSecuritiesDebtFairValue: null,
      InterestBearingDeposits: 200_000_000,
      LoansAndLeasesReceivableNetReported: 80_000_000,
    },
    WFC: {
      TierOneRiskBasedCapitalRatio: 0.11,
      InterestIncomeExpenseNet: 120,
      InterestExpense: 40,
      AvailableForSaleSecuritiesDebtFairValue: 350_000_000,
      InterestBearingDeposits: 100_000_000,
      LoansAndLeasesReceivableNetReported: 70_000_000,
    },
  };

  (secConcept as any).mockImplementation(
    async (ticker: string, concept: string) => {
      const v = conceptMap[ticker]?.[concept];
      return v == null ? [] : [{ val: v, end: '2023-12-31' }];
    }
  );

  mockedAxios.get = vi
    .fn()
    .mockResolvedValueOnce({ data: { observations: [{ value: '450' }] } })
    .mockResolvedValueOnce({ data: { observations: [{ value: '455' }] } })
    .mockResolvedValueOnce({ data: { observations: [{ value: '460' }] } })
    .mockRejectedValueOnce(new Error('fred down'));

  const parses: any[] = [];
  (CoreBankSchema.parse as any).mockImplementation((core: any) => {
    parses.push(core);
    return core;
  });
  (checkCoreBank as any).mockReturnValue(null);

  const res = await runCoreBankRisk();
  expect(res).toEqual([]);

  expect(parses).toHaveLength(4);

  const byTicker = (t: string) => parses.find((p) => p.ticker === t);

  expect(byTicker('JPM')).toMatchObject({
    interestCoverage: expect.any(Number),
    durationGapYears: expect.any(Number),
    ltvRatio: expect.any(Number),
  });

  expect(byTicker('BAC')).toMatchObject({
    interestCoverage: null,
  });

  expect(byTicker('C')).toMatchObject({
    durationGapYears: null,
  });

  expect(byTicker('WFC')).toMatchObject({
    ltvRatio: null,
  });

  expect(mockedAxios.get).toHaveBeenCalledTimes(4);
});
