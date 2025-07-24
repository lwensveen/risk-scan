export async function fetchSECFact(
  cik: string,
  taxonomy: string,
  tag: string
): Promise<number | null> {
  const url = `https://data.sec.gov/api/xbrl/companyfacts/${cik}.json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'risk-scan' } });

  if (!res.ok) return null;

  const json = await res.json().catch(() => null);
  const fact =
    json?.facts?.[taxonomy]?.[tag]?.units?.USD?.[0]?.val ??
    json?.facts?.[taxonomy]?.[tag]?.units?.USD?.at(-1)?.val;

  return typeof fact === 'number' ? fact : null;
}
