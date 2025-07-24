import { ingestTicker } from '../cli/ingest-ticker.js';

await Promise.all(['VIRC', 'RMNI', 'NVDA'].map((t) => ingestTicker(t)));

console.log('✔  Demo data ingested');
