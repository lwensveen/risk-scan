import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ingestSnapshots } from './etl.js';
import { fetchLatest10KFootnote } from './queries/fetch-10k-footnote.js';
import * as fetchers from './utils/fetch.js';
import { riskScanConfig } from '@risk-scan/types';

const { mockDb, insertSpy, parseSpyMap } = vi.hoisted(() => {
  const insertSpy = vi.fn();
  const valuesSpy = vi.fn();
  const onConflictDoUpdateSpy = vi.fn();
  const onConflictDoNothingSpy = vi.fn();

  const mockDb = {
    insert: insertSpy.mockReturnValue({
      values: valuesSpy.mockReturnValue({
        onConflictDoUpdate: onConflictDoUpdateSpy.mockReturnValue(undefined),
        onConflictDoNothing: onConflictDoNothingSpy.mockReturnValue(undefined),
      }),
    }),
  };

  const parseSpyMap: Record<string, ReturnType<typeof vi.fn>> = {
    OfficeREIT: vi.fn((x) => x),
    HealthcareRollup: vi.fn((x) => x),
    RegionalBank: vi.fn((x) => x),
    BDC: vi.fn((x) => x),
    Stablecoin: vi.fn((x) => x),
  };

  const exitSpy = vi
    .spyOn(process, 'exit')
    .mockImplementation(() => undefined as never);

  const fakeRequire = { main: { filename: '/abs/path/etl.js' } };

  return {
    mockDb,
    insertSpy,
    valuesSpy,
    onConflictDoUpdateSpy,
    onConflictDoNothingSpy,
    parseSpyMap,
    exitSpy,
    fakeRequire,
  };
});

vi.mock('dotenv/config', () => ({}));
vi.mock('@neondatabase/serverless', () => ({
  Pool: vi.fn(() => ({})),
}));
vi.mock('drizzle-orm/neon-serverless', () => ({
  drizzle: vi.fn(() => mockDb),
}));

vi.mock('./utils/fetch.js', () => ({
  fetchOfficeREIT: vi.fn(async (t: string) => ({
    ticker: t,
    vacancyRateYoY: 10,
    totalDebt: 1,
    debtDueNext2Y: 1,
    ffo: 1,
    interestExpense: 1,
  })),
  fetchHealthcareRollup: vi.fn(async (t: string) => ({
    ticker: t,
    debt: 1,
    ebitda: 1,
    leaseObligationsOffBS: 1,
    totalAssets: 1,
    sameStoreVisitsYoY: 1,
  })),
  fetchRegionalBank: vi.fn(async (t: string) => ({
    ticker: t,
    creLoans: 1,
    totalLoans: 1,
    liquidAssets: 1,
    deposits: 1,
    npaMoM: 1,
  })),
  fetchBDC: vi.fn(async (t: string) => ({
    ticker: t,
    yieldPercent: 1,
    navChangeYoY: 1,
    redemptions: 1,
    newInflows: 1,
    loanLossReserves: 1,
    totalLoans: 1,
  })),
  fetchStablecoin: vi.fn(async (s: string) => ({
    symbol: s,
    collateralRatio: 1,
    topHolderShare: 1,
    tvlChange7d: 1,
  })),
}));

vi.mock('./queries/fetch-10k-footnote.js', () => ({
  fetchLatest10KFootnote: vi.fn(async (id: string) =>
    /[1]$/.test(id) ? 'footnote text' : null
  ),
}));

vi.mock('@risk-scan/db', () => ({
  entitySnapshotsTable: 'entitySnapshotsTable',
  riskFlagsTable: 'riskFlagsTable',
}));

vi.mock('@risk-scan/types', () => {
  const categoryValues = [
    'BDC',
    'CoreBank',
    'HealthcareRollup',
    'OfficeREIT',
    'RegionalBank',
    'Stablecoin',
  ] as const;

  return {
    riskScanConfig: {
      OfficeREIT: ['O1', 'O2'],
      HealthcareRollup: ['H1', 'H2'],
      RegionalBank: ['R1', 'R2'],
      BDC: ['B1', 'B2'],
      Stablecoin: ['S1', 'S2'],
      CoreBank: [],
    },
    RiskCategoryEnum: {
      enum: {
        OfficeREIT: 'OfficeREIT',
        HealthcareRollup: 'HealthcareRollup',
        RegionalBank: 'RegionalBank',
        BDC: 'BDC',
        Stablecoin: 'Stablecoin',
        CoreBank: 'CoreBank',
      },
    },
    RiskCategoryTS: {
      OfficeREIT: 'OfficeREIT',
      HealthcareRollup: 'HealthcareRollup',
      RegionalBank: 'RegionalBank',
      BDC: 'BDC',
      Stablecoin: 'Stablecoin',
      CoreBank: 'CoreBank',
    },
    RiskFlagEnum: { GoingConcern: 'GoingConcern' },
    RiskSeverityEnum: { Low: 'low', Medium: 'medium', High: 'high' },
    RiskCategory: undefined,
    categoryValues,
    OfficeReitSchema: { parse: parseSpyMap.OfficeREIT },
    HealthcareRollupSchema: { parse: parseSpyMap.HealthcareRollup },
    RegionalBankSchema: { parse: parseSpyMap.RegionalBank },
    BdcSchema: { parse: parseSpyMap.BDC },
    StablecoinSchema: { parse: parseSpyMap.Stablecoin },
  };
});

describe('ingestSnapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ingests snapshots and hits both branches of gc checks', async () => {
    await ingestSnapshots();

    const totalSnapshots =
      riskScanConfig.OfficeREIT.length +
      riskScanConfig.HealthcareRollup.length +
      riskScanConfig.RegionalBank.length +
      riskScanConfig.BDC.length +
      riskScanConfig.Stablecoin.length;

    const snapshotInserts = insertSpy.mock.calls.filter(
      ([table]) => table === 'entitySnapshotsTable'
    );
    expect(snapshotInserts).toHaveLength(totalSnapshots);

    const flagInserts = insertSpy.mock.calls.filter(
      ([table]) => table === 'riskFlagsTable'
    );
    expect(flagInserts).toHaveLength(5);

    expect(parseSpyMap.OfficeREIT).toHaveBeenCalledTimes(2);
    expect(parseSpyMap.HealthcareRollup).toHaveBeenCalledTimes(2);
    expect(parseSpyMap.RegionalBank).toHaveBeenCalledTimes(2);
    expect(parseSpyMap.BDC).toHaveBeenCalledTimes(2);
    expect(parseSpyMap.Stablecoin).toHaveBeenCalledTimes(2);

    expect(fetchers.fetchOfficeREIT).toHaveBeenCalledWith('O1');
    expect(fetchers.fetchOfficeREIT).toHaveBeenCalledWith('O2');
    expect(fetchers.fetchHealthcareRollup).toHaveBeenCalledWith('H1');
    expect(fetchers.fetchHealthcareRollup).toHaveBeenCalledWith('H2');
    expect(fetchers.fetchRegionalBank).toHaveBeenCalledWith('R1');
    expect(fetchers.fetchRegionalBank).toHaveBeenCalledWith('R2');
    expect(fetchers.fetchBDC).toHaveBeenCalledWith('B1');
    expect(fetchers.fetchBDC).toHaveBeenCalledWith('B2');
    expect(fetchers.fetchStablecoin).toHaveBeenCalledWith('S1');
    expect(fetchers.fetchStablecoin).toHaveBeenCalledWith('S2');

    expect(
      (fetchLatest10KFootnote as any).mock.calls.map((c: any[]) => c[0])
    ).toEqual(['O1', 'O2', 'H1', 'H2', 'R1', 'R2', 'B1', 'B2', 'S1', 'S2']);
  });
});

describe('calls process.exit(0) when run as main module', () => {
  it('calls process.exit(0)', async () => {
    const EXIT = new Error('__EXIT__');

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw EXIT;
    });

    try {
      await import('./etl.js').then((m) => m.main());
    } catch (err) {
      if (err !== EXIT) throw err;
    }

    expect(exitSpy).toHaveBeenCalledWith(0);
    exitSpy.mockRestore();
  });
});
