import fetch from 'node-fetch';
import { RiskFlag } from '@risk-scan/types';

export async function sendSlackFlags(
  flags: RiskFlag[],
  webhookUrl: string = process.env.SLACK_WEBHOOK || ''
): Promise<void> {
  if (!webhookUrl) {
    console.warn('[slack] No SLACK_WEBHOOK env; skipping alert');
    return;
  }
  if (!flags.length) return;

  const blocks: any[] = [];
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*⚠️  RiskScan Tail‑Risk Flags detected: ${flags.length}*`,
    },
  });
  blocks.push({ type: 'divider' });

  flags.slice(0, 20).forEach((f) => {
    const emoji =
      f.severity === 'high' ? '🔥' : f.severity === 'medium' ? '⚠️' : '❗';
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${emoji} *${f.category}* • *${f.ticker}*\n${f.flags.join(', ')}`,
      },
    });
  });

  if (flags.length > 20) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `…and ${flags.length - 20} more (see dashboard)`,
        },
      ],
    });
  }

  const payload = {
    blocks,
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error('[slack] Error posting to Slack', await res.text());
    }
  } catch (err) {
    console.error('[slack] Network error', err);
  }
}
