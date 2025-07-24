import axios from 'axios';
import { resolveCik } from './resolve-cik.js';

export async function fetchLatest10KFootnote(
  ticker: string
): Promise<string | null> {
  const cik = await resolveCik(ticker);
  if (!cik) throw new Error(`CIK not found for ${ticker}`);

  const { data: sub } = await axios.get(
    `https://data.sec.gov/submissions/CIK${cik.padStart(10, '0')}.json`,
    { headers: { 'User-Agent': 'risk-scan-demo/0.1 lwensveen@gmail.com' } }
  );

  const idx = sub.filings.recent.form.indexOf('10-K');
  if (idx === -1) throw new Error(`No 10‑K found for ${ticker}`);

  const accession = sub.filings.recent.accessionNumber[idx].replace(/-/g, '');
  const primaryDoc = sub.filings.recent.primaryDocument[idx];
  const filingUrl =
    `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/` +
    `${accession}/${primaryDoc}`;

  const { data: html } = await axios.get(filingUrl, {
    headers: { 'User-Agent': 'risk-scan-demo/0.1 lwensveen@gmail.com' },
  });

  const parts = html.split(/<TABLE[^>]*>/i);
  if (parts.length === 1) return null;

  const footnote = parts
    .pop()!
    .replace(/<[^>]+>/g, ' ')
    .trim();

  return footnote || null;
}
