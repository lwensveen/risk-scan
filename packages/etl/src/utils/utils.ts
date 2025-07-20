import axios from 'axios';

type SecFact = { val: number; end: string };

const SEC_HEADERS = { 'User-Agent': 'RiskScan/1.0 lode@risk‑scan.com' };

interface SecTickerRow {
  cik_str: number;
  ticker: string;
  title?: string;
}

let TICKER_TO_CIK: Record<string, string> | null = null;

async function ensureTickerMap(): Promise<Record<string, string>> {
  if (TICKER_TO_CIK) return TICKER_TO_CIK;

  const res = await axios.get<Record<string, SecTickerRow>>(
    'https://www.sec.gov/files/company_tickers.json',
    { headers: SEC_HEADERS }
  );

  TICKER_TO_CIK = Object.fromEntries(
    Object.values(res.data).map((row) => [
      row.ticker.toUpperCase(),
      String(row.cik_str).padStart(10, '0'),
    ])
  );
  return TICKER_TO_CIK;
}

async function cikFor(ticker: string): Promise<string> {
  const map = await ensureTickerMap();
  const cik = map[ticker.toUpperCase()];
  if (!cik) throw new Error(`CIK not found for ${ticker}`);
  return cik;
}

export async function secConcept(
  ticker: string,
  concept: string,
  taxonomy = 'us-gaap'
): Promise<SecFact[]> {
  const cik = await cikFor(ticker);
  const url = `https://data.sec.gov/api/xbrl/companyconcept/${cik}/${taxonomy}/${concept}.json`;

  try {
    const { data } = await axios.get(url, { headers: SEC_HEADERS });
    const units = data?.facts?.[taxonomy]?.[concept]?.units ?? {};
    return units.USD ?? Object.values(units)[0] ?? [];
  } catch {
    return [];
  }
}

export function yoy(series: SecFact[]): number | null {
  if (series.length < 2) return null;

  const latest = series[0]!;
  const prev = series.find(
    (f) =>
      new Date(latest.end).getFullYear() - new Date(f.end).getFullYear() === 1
  );
  return prev ? latest.val - prev.val : null;
}
