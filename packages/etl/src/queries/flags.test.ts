import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@risk-scan/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@risk-scan/db')>();
  const chain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  };
  return {
    ...actual,
    db: chain,
  };
});
let db: any;
let getLatestFlags: any;
let getFlagsByTicker: any;
let getSnapshotByTicker: any;
let getLatestFlagsForTicker: any;
let getFlagsFiltered: any;
let getSnapshotsFiltered: any;

beforeEach(async () => {
  vi.clearAllMocks();

  const dbMod = await import('@risk-scan/db');
  db = dbMod.db;

  const flagsMod = await import('./flags.js');
  getLatestFlags = flagsMod.getLatestFlags;
  getFlagsByTicker = flagsMod.getFlagsByTicker;
  getSnapshotByTicker = flagsMod.getSnapshotByTicker;
  getLatestFlagsForTicker = flagsMod.getLatestFlagsForTicker;
  getFlagsFiltered = flagsMod.getFlagsFiltered;
  getSnapshotsFiltered = flagsMod.getSnapshotsFiltered;
});

describe('flags module', () => {
  it('getLatestFlags should query with default limit', () => {
    getLatestFlags();
    expect(db.select).toHaveBeenCalled();
    expect(db.from).toHaveBeenCalled();
    expect(db.orderBy).toHaveBeenCalled();
    expect(db.limit).toHaveBeenCalledWith(100);
  });

  it('getFlagsByTicker should filter by ticker', () => {
    getFlagsByTicker('TSLA');
    expect(db.where).toHaveBeenCalled();
  });

  it('getSnapshotByTicker should query snapshot with limit 1', () => {
    getSnapshotByTicker('TSLA');
    expect(db.limit).toHaveBeenCalledWith(1);
  });

  it('getLatestFlagsForTicker should query latest flags and limit 10', async () => {
    await getLatestFlagsForTicker('AAPL');
    expect(db.orderBy).toHaveBeenCalled();
    expect(db.limit).toHaveBeenCalledWith(10);
  });

  it('getFlagsFiltered should build dynamic where clauses', async () => {
    await getFlagsFiltered({
      tickers: ['AAPL', 'TSLA'],
      category: 'CoreBank',
      from: 1_700_000_000_000,
      to: 1_800_000_000_000,
      useCreatedAt: true,
    });
    expect(db.where).toHaveBeenCalled();
  });

  it('getFlagsFiltered with no filters should not use where clause', async () => {
    await getFlagsFiltered({});
    expect(db.where).toHaveBeenCalledWith(undefined);
  });

  it('getSnapshotsFiltered should apply date and ticker filters', async () => {
    await getSnapshotsFiltered({
      ticker: 'BXP',
      from: 1_700_000_000_000,
      to: 1_800_000_000_000,
    });
    expect(db.from).toHaveBeenCalled();
    expect(db.where).toHaveBeenCalled();
  });

  it('getSnapshotsFiltered with no filters should pass undefined to where', async () => {
    await getSnapshotsFiltered({});
    expect(db.where).toHaveBeenCalledWith(undefined);
  });
});
