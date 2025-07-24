import axios from 'axios';
import { Stablecoin } from '@risk-scan/types';

export async function fetchStablecoin(symbol: string): Promise<Stablecoin> {
  const res = await axios.get(
    `https://coins.llama.fi/prices/current/coingecko:${symbol.toLowerCase()}`
  );
  const doc = res.data?.coins?.[`coingecko:${symbol.toLowerCase()}`] ?? {};

  return {
    symbol,
    collateralRatio: doc.collateral_ratio ?? 0,
    topHolderShare: doc.top_holders_pct ?? 0,
    tvlChange7d: doc.tvl_7d_change ?? 0,
  };
}
