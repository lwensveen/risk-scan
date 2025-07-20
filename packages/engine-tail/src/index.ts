import {
  Bdc,
  HealthcareRollup,
  OfficeReit,
  RegionalBank,
  RiskFlag,
  Stablecoin,
} from '@risk-scan/types';
import {
  fetchBDC,
  fetchHealthcareRollup,
  fetchOfficeREIT,
  fetchRegionalBank,
  fetchStablecoin,
} from '@risk-scan/etl';

export function checkOfficeREIT(e: OfficeReit): RiskFlag | null {
  const flags: string[] = [];
  if ((e.vacancyRateYoY ?? 0) > 0.1) flags.push('🚩 Vacancy spike (>10 % YoY)');
  if (e.debtDueNext2Y / e.totalDebt > 0.4)
    flags.push('🚩 Maturity wall (>40 % due <2 y)');
  if (e.ffo < e.interestExpense) flags.push('🚩 FFO < interest');

  return flags.length
    ? {
        category: 'OfficeREIT',
        ticker: e.ticker,
        flags,
        severity: flags.length >= 2 ? 'high' : 'medium',
        ts: Date.now(),
      }
    : null;
}

export function checkHealthcareRollup(e: HealthcareRollup): RiskFlag | null {
  const flags: string[] = [];
  if (e.debt / e.ebitda > 6) flags.push('🚩 Over‑leveraged (>6× EBITDA)');
  if ((e.leaseObligationsOffBS ?? 0) / e.totalAssets > 0.3)
    flags.push('🚩 Hidden leases (>30 %)');
  if ((e.sameStoreVisitsYoY ?? 0) < 0) flags.push('🚩 Patient decline');

  return flags.length
    ? {
        category: 'HealthcareRollup',
        ticker: e.ticker,
        flags,
        severity: flags.length >= 2 ? 'high' : 'medium',
        ts: Date.now(),
      }
    : null;
}

export function checkRegionalBank(e: RegionalBank): RiskFlag | null {
  const flags: string[] = [];
  if ((e.creLoans ?? 0) / e.totalLoans > 0.5)
    flags.push('🚩 CRE concentration (>50 %)');
  if (e.liquidAssets / e.deposits < 0.2) flags.push('🚩 Low liquidity (<20 %)');
  if ((e.npaMoM ?? 0) > 0) flags.push('🚩 Rising NPAs (MoM)');

  return flags.length
    ? {
        category: 'RegionalBank',
        ticker: e.ticker,
        flags,
        severity: flags.length >= 2 ? 'high' : 'medium',
        ts: Date.now(),
      }
    : null;
}

export function checkBDC(e: Bdc): RiskFlag | null {
  const flags: string[] = [];
  if (e.yieldPercent > 0.12 && (e.navChangeYoY ?? 0) <= 0)
    flags.push('🚩 Unsustainable yield');
  if ((e.redemptions ?? 0) > (e.newInflows ?? 0)) flags.push('🚩 Net outflows');
  if ((e.loanLossReserves ?? Infinity) / e.totalLoans < 0.03)
    flags.push('🚩 Thin loss reserves (<3 %)');

  return flags.length
    ? {
        category: 'BDC',
        ticker: e.ticker,
        flags,
        severity: flags.length >= 2 ? 'high' : 'medium',
        ts: Date.now(),
      }
    : null;
}

export function checkStablecoin(e: Stablecoin): RiskFlag | null {
  const flags: string[] = [];
  if (e.collateralRatio < 1.5) flags.push('🚩 Under‑collateralised (<150 %)');
  if (e.topHolderShare > 0.2) flags.push('🚩 Concentrated supply (>20 %)');
  if (e.tvlChange7d < -0.05) flags.push('🚩 TVL outflows (>5 %)');

  return flags.length
    ? {
        category: 'Stablecoin',
        ticker: e.symbol,
        flags,
        severity: flags.length >= 2 ? 'high' : 'medium',
        ts: Date.now(),
      }
    : null;
}

export interface TailRiskConfig {
  officeReitTickers: string[];
  healthcareTickers: string[];
  regionalBankTickers: string[];
  bdcTickers: string[];
  stablecoinSymbols: string[];
}

export async function runTailRisk(cfg: TailRiskConfig): Promise<RiskFlag[]> {
  const out: (RiskFlag | null)[] = [];

  const push = (flag: RiskFlag | null) => {
    if (flag) out.push(flag);
  };

  await Promise.all(
    cfg.officeReitTickers.map(async (t) => {
      const data = await fetchOfficeREIT(t);
      push(checkOfficeREIT(data));
    })
  );

  await Promise.all(
    cfg.healthcareTickers.map(async (t) => {
      const data = await fetchHealthcareRollup(t);
      push(checkHealthcareRollup(data));
    })
  );

  await Promise.all(
    cfg.regionalBankTickers.map(async (t) => {
      const data = await fetchRegionalBank(t);
      push(checkRegionalBank(data));
    })
  );

  await Promise.all(
    cfg.bdcTickers.map(async (t) => {
      const data = await fetchBDC(t);
      push(checkBDC(data));
    })
  );

  await Promise.all(
    cfg.stablecoinSymbols.map(async (s) => {
      const data = await fetchStablecoin(s);
      push(checkStablecoin(data));
    })
  );

  return out.filter((f): f is RiskFlag => f !== null);
}
