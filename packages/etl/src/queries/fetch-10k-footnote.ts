import axios from 'axios';
import { resolveCik } from './resolve-cik.js';

export async function fetchLatest10KFootnote(
  ticker: string
): Promise<string | null> {
  const cik = await resolveCik(ticker);
  if (!cik) throw new Error(`CIK not found for ${ticker}`);

  const url = `https://data.sec.gov/submissions/CIK${cik.padStart(10, '0')}.json`;
  const { data } = await axios.get(url, {
    headers: { 'User-Agent': 'risk-scan-demo/0.1 lwensveen@gmail.com' },
  });

  const idx = data.filings.recent.form.indexOf('10-K');
  if (idx === -1) throw new Error(`No 10‑K found for ${ticker}`);
  const accession = data.filings.recent.accessionNumber[idx].replace(/-/g, '');
  const primaryDoc = data.filings.recent.primaryDocument[idx];

  const filingUrl = `https://www.sec.gov/Archives/edgar/data/${parseInt(
    cik,
    10
  )}/${accession}/${primaryDoc}`;
  const { data: html } = await axios.get(filingUrl, {
    headers: { 'User-Agent': 'risk-scan-demo/0.1 lwensveen@gmail.com' },
  });

  const footnote = html
    .split(/<TABLE[^>]*>/i)
    .pop()
    ?.replace(/<[^>]+>/g, ' ')
    .trim();

  return footnote || null;
}
