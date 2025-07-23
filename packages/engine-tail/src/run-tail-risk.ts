import { RiskFlag, TailRiskConfig } from '@risk-scan/types';
import {
  fetchBDC,
  fetchHealthcareRollup,
  fetchOfficeREIT,
  fetchRegionalBank,
  fetchStablecoin,
} from '@risk-scan/etl';
import { checkOfficeREIT } from './rules/office-reit.js';
import { checkHealthcareRollup } from './rules/healthcare-rollup.js';
import { checkRegionalBank } from './rules/regional-bank.js';
import { checkBDC } from './rules/bdc.js';
import { checkStablecoin } from './rules/stablecoin.js';

export async function runTailRisk(cfg: TailRiskConfig): Promise<RiskFlag[]> {
  const out: (RiskFlag | null)[] = [];

  const push = (flag: RiskFlag | null) => {
    if (flag) out.push(flag);
  };

  await Promise.all(
    cfg.OfficeREIT.map(async (t) => {
      const data = await fetchOfficeREIT(t);
      push(checkOfficeREIT(data));
    })
  );

  await Promise.all(
    cfg.HealthcareRollup.map(async (t) => {
      const data = await fetchHealthcareRollup(t);
      push(checkHealthcareRollup(data));
    })
  );

  await Promise.all(
    cfg.RegionalBank.map(async (t) => {
      const data = await fetchRegionalBank(t);
      push(checkRegionalBank(data));
    })
  );

  await Promise.all(
    cfg.BDC.map(async (t) => {
      const data = await fetchBDC(t);
      push(checkBDC(data));
    })
  );

  await Promise.all(
    cfg.Stablecoin.map(async (s) => {
      const data = await fetchStablecoin(s);
      push(checkStablecoin(data));
    })
  );

  return out.filter((f): f is RiskFlag => f !== null);
}
