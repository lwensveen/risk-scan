import { beforeEach, describe, expect, it, vi } from 'vitest';
import fetch from 'node-fetch';
import { RiskFlag } from '@risk-scan/db';

vi.mock('node-fetch', async () => ({
  default: vi.fn(),
}));

const mockedFetch = fetch as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.SLACK_WEBHOOK = 'https://dummy.slack.webhook';
  vi.clearAllMocks();
});

describe('sendSlackFlags', () => {
  it('should skip if no webhook URL is provided', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    delete process.env.SLACK_WEBHOOK;

    const { sendSlackFlags } = await import('./slack.js');

    await sendSlackFlags([]);
    expect(consoleWarn).toHaveBeenCalledWith(
      '[slack] No SLACK_WEBHOOK env; skipping alert'
    );
    expect(mockedFetch).not.toHaveBeenCalled();

    consoleWarn.mockRestore();
  });

  it('should skip if no flags are given', async () => {
    const { sendSlackFlags } = await import('./slack.js');

    await sendSlackFlags([]);
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it('should send a Slack message for valid flags', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: true } as any);

    const { sendSlackFlags } = await import('./slack.js');

    const flags: RiskFlag[] = [
      {
        id: '1',
        category: 'RegionalBank',
        ticker: 'HBAN',
        severity: 'high',
        flags: ['declining deposits', 'CRE exposure'],
      },
    ];

    await sendSlackFlags(flags);

    expect(mockedFetch).toHaveBeenCalledWith(
      'https://dummy.slack.webhook',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      })
    );

    const body = JSON.parse(mockedFetch.mock.calls[0]![1]!.body);
    expect(body.blocks[0].text.text).toContain(
      'RiskScan Tail‑Risk Flags detected: 1'
    );
    expect(body.blocks.some((b: any) => b.text?.text?.includes('HBAN'))).toBe(
      true
    );
  });

  it('should log Slack HTTP error response', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockedFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => 'bad request',
    } as any);

    const { sendSlackFlags } = await import('./slack.js');

    const flags: RiskFlag[] = [
      {
        id: '1',
        category: 'Stablecoin',
        ticker: 'USDT',
        severity: 'low',
        flags: ['liquidity risk'],
      },
    ];

    await sendSlackFlags(flags);

    expect(consoleError).toHaveBeenCalledWith(
      '[slack] Error posting to Slack',
      'bad request'
    );

    consoleError.mockRestore();
  });

  it('should catch and log fetch errors', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockedFetch.mockRejectedValueOnce(new Error('network failed'));

    const { sendSlackFlags } = await import('./slack.js');

    await sendSlackFlags([
      {
        id: '1',
        category: 'OfficeREIT',
        ticker: 'SLG',
        severity: 'medium',
        flags: ['high vacancy'],
      },
    ]);

    expect(consoleError).toHaveBeenCalledWith(
      '[slack] Network error',
      expect.any(Error)
    );

    consoleError.mockRestore();
  });
});
