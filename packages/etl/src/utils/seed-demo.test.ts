import { describe, expect, it, vi } from 'vitest';

const ingestTickerMock = vi.fn();

vi.mock('../cli/ingest-ticker.js', () => ({
  ingestTicker: ingestTickerMock,
}));

describe('demo ingest script', () => {
  it('calls ingestTicker for hardcoded tickers and logs success', async () => {
    const consoleLogMock = vi
      .spyOn(console, 'log')
      .mockImplementation(() => {});

    await import('./seed-demo.js');

    expect(ingestTickerMock).toHaveBeenCalledTimes(3);
    expect(ingestTickerMock).toHaveBeenCalledWith('VIRC');
    expect(ingestTickerMock).toHaveBeenCalledWith('RMNI');
    expect(ingestTickerMock).toHaveBeenCalledWith('NVDA');
    expect(consoleLogMock).toHaveBeenCalledWith('✔  Demo data ingested');

    consoleLogMock.mockRestore();
  });
});
