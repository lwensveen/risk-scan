import { beforeEach, describe, expect, it, vi } from 'vitest';
import { persistFlags } from './persist-flags.js';
import { riskFlagsTable } from './schema.js';
import { RiskFlag } from './types.js';

vi.mock('pg', () => ({
  Pool: vi.fn(() => ({
    query: vi.fn(),
    end: vi.fn(),
  })),
}));

const insertSpy = vi.fn(() => ({
  values: vi.fn(() => ({
    onConflictDoUpdate: vi.fn(() => Promise.resolve()),
  })),
}));

vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: vi.fn(() => ({
    insert: insertSpy,
  })),
}));

describe('persistFlags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 0 inserted if flags array is empty', async () => {
    const result = await persistFlags([]);
    expect(result).toEqual({ inserted: 0 });
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it('inserts flags and returns correct count', async () => {
    const flags: RiskFlag[] = [
      {
        category: 'OfficeREIT',
        ticker: 'O1',
        flags: ['GoingConcern'],
        severity: 'medium',
      },
      {
        category: 'BDC',
        ticker: 'B1',
        flags: ['GoingConcern'],
        severity: 'high',
      },
    ];

    const result = await persistFlags(flags);

    expect(insertSpy).toHaveBeenCalledWith(riskFlagsTable);
    const call = insertSpy.mock.calls[0]!;
    expect(result).toEqual({ inserted: 2 });
  });
});
