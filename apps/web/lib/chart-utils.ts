import { RiskFlag } from '@risk-scan/types';
import { toPng } from 'html-to-image';

export type ChartRow = { date: string; [ticker: string]: number | string };

export function groupFlagsByDate(
  flags: RiskFlag[],
  tickers: string[],
  mode: 'count' | 'avg'
): ChartRow[] {
  // map should always include every selected ticker
  const grouped: Record<string, Record<string, number>> = {};

  for (const f of flags) {
    const date = new Date(Number(f.ts)).toISOString().slice(0, 10);
    const row = (grouped[date] ??= {});
    row[f.ticker] = (row[f.ticker] ?? 0) + 1;
  }

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => {
      const entry: any = { date };
      tickers.forEach((t) => (entry[t] = counts[t] ?? 0));
      if (mode === 'avg') {
        const sum = tickers.reduce((s, t) => s + entry[t], 0);
        entry.avg = +(sum / tickers.length).toFixed(2);
      }
      return entry;
    });
}

export function groupFlagsByCategory(
  flags: RiskFlag[],
  tickers: string[],
  mode: 'count' | 'avg'
): Record<string, ChartRow[]> {
  const byCat: Record<string, RiskFlag[]> = {};
  flags.forEach((f) => (byCat[f.category] ??= []).push(f));

  const out: Record<string, any[]> = {};
  Object.entries(byCat).forEach(
    ([cat, fl]) => (out[cat] = groupFlagsByDate(fl, tickers, mode))
  );
  return out;
}

export function parseQueryTickers(
  query: string | string[] | undefined
): string[] {
  if (!query) return [];
  if (Array.isArray(query)) return query.flatMap((q) => q.split(','));
  return query.split(',');
}

export function stringifyTickers(tickers: string[]): string {
  return tickers.join(',');
}

/* ------------------------------------------------------------------------- */
/* 🎨  Color palette used across charts & badges                              */
/* ------------------------------------------------------------------------- */
export const COLOR_PALETTE = [
  '#4f46e5', // indigo‑600
  '#22c55e', // green‑500
  '#ec4899', // pink‑500
  '#f59e0b', // amber‑500
  '#06b6d4', // cyan‑500
  '#a855f7', // violet‑500
  '#f43f5e', // rose‑500
  '#10b981', // emerald‑500
];

/* ------------------------------------------------------------------------- */
/* 📤  CSV export                                                            */

/* ------------------------------------------------------------------------- */
export function exportToCSV(
  rows: Record<string, any>[],
  tickers: string[],
  filename = `risk-flags-${Date.now()}.csv`
) {
  if (!rows?.length) return;

  const headers = ['date', ...tickers];
  const csvRows = rows.map((r) => headers.map((h) => r[h] ?? '').join(','));
  const csv = [headers.join(','), ...csvRows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------------- */
/* 🖼️  PNG export (capture any DOM node)                                     */

/* ------------------------------------------------------------------------- */
export async function exportToPNG(
  chartRef: React.RefObject<HTMLElement | null>,
  filename = `risk-flags-${Date.now()}.png`
) {
  if (!chartRef.current) return;
  try {
    const dataUrl = await toPng(chartRef.current, { pixelRatio: 2 });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  } catch (err) {
    console.error('PNG export failed:', err);
    alert('Failed to export PNG. See console for details.');
  }
}
