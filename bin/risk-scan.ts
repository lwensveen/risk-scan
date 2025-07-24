#!/usr/bin/env bun
import { ingestTicker } from '@risk-scan/etl';

(async () => {
  const [, , ticker] = process.argv;
  if (!ticker) {
    console.error('Usage: risk-scan <TICKER>');
    process.exit(1);
  }

  await ingestTicker(ticker);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
