import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ingestTicker } from './ingest-ticker.js';
import {
  RiskCategoryEnum,
  RiskCategoryTS,
  RiskFlagEnum,
  riskScanConfig,
} from '@risk-scan/types';

const { upsertSnapshotMock, upsertFlagMock } = vi.hoisted(() => {
  return {
    upsertSnapshotMock: vi.fn(),
    upsertFlagMock: vi.fn(),
  };
});

vi.mock('../etl.js', () => ({
  upsertSnapshot: upsertSnapshotMock,
  upsertFlag: upsertFlagMock,
}));

vi.mock('../fetchers/office-reit.js', () => ({
  fetchOfficeREIT: vi.fn(async (t: string) => ({ ticker: t, foo: 'bar' })),
}));

vi.mock('../fetchers/healthcare-rollup.js', () => ({
  fetchHealthcareRollup: vi.fn(async () => ({})),
}));

vi.mock('../fetchers/regional-bank.js', () => ({
  fetchRegionalBank: vi.fn(async () => ({})),
}));

vi.mock('../fetchers/bdc.js', () => ({
  fetchBDC: vi.fn(async () => ({})),
}));

vi.mock('../fetchers/stablecoin.js', () => ({
  fetchStablecoin: vi.fn(async () => ({})),
}));

vi.mock('../queries/fetch-10k-footnote.js', () => ({
  fetchLatest10KFootnote: vi.fn(async () => false),
}));

vi.mock('@risk-scan/types', async () => {
  const real = await vi.importActual<any>('@risk-scan/types');
  const pass = { parse: (x: any) => x };
  return {
    ...real,
    OfficeReitSchema: pass,
    HealthcareRollupSchema: pass,
    RegionalBankSchema: pass,
    BdcSchema: pass,
    StablecoinSchema: pass,
  };
});

const TICKER = riskScanConfig.OfficeREIT[0]!;

describe('ingestTicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes snapshot (no going‑concern)', async () => {
    await ingestTicker(TICKER);

    expect(upsertSnapshotMock).toHaveBeenCalledWith(
      RiskCategoryEnum.enum.OfficeREIT,
      TICKER,
      { ticker: TICKER, foo: 'bar' }
    );
    expect(upsertFlagMock).not.toHaveBeenCalled();
  });

  it('adds GoingConcern flag when footnote detector is true', async () => {
    const { fetchLatest10KFootnote } = await import(
      '../queries/fetch-10k-footnote.js'
    );
    (fetchLatest10KFootnote as any).mockResolvedValueOnce(true);

    await ingestTicker(TICKER);

    expect(upsertFlagMock).toHaveBeenCalledWith(
      TICKER,
      RiskCategoryTS.OfficeREIT,
      RiskFlagEnum.GoingConcern
    );
  });

  it('throws on unknown ticker', async () => {
    await expect(ingestTicker('XXXX')).rejects.toThrow(/Unknown ticker/i);
  });
});
