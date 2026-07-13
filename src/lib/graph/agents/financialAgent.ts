/* eslint-disable @typescript-eslint/no-explicit-any */
import { yahooFinance } from "@/lib/yahooFinance";
import type { ResearchGraphState } from "../state";
import type { Financials, FinancialHealthScore } from "@/types/research";

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmt(value: number | undefined | null, prefix = ""): string {
  if (value == null || isNaN(value)) return "N/A";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${prefix}${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${prefix}${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${prefix}${(value / 1e6).toFixed(2)}M`;
  return `${prefix}${value.toFixed(2)}`;
}

function fmtPercent(value: number | undefined | null): string {
  if (value == null || isNaN(value)) return "N/A";
  return `${(value * 100).toFixed(1)}%`;
}

function fmtGrowth(value: number | undefined | null): string {
  if (value == null || isNaN(value)) return "N/A";
  const pct = (value * 100).toFixed(1);
  return value >= 0 ? `+${pct}%` : `${pct}%`;
}

function safeNum(value: any): number | null {
  const n = Number(value);
  return isFinite(n) ? n : null;
}

// ─── Health Score ─────────────────────────────────────────────────────────────

/**
 * Computes a 0–100 Financial Health Score using a deterministic weighted model.
 *
 * Design decision: No LLM here. The Health Score is a pure function of
 * quantitative metrics. LLM narrative synthesis belongs in the Reasoning Agent.
 *
 * Scoring dimensions (weights add to 100):
 *   1. Operating Margin (25pts)  — profitability efficiency
 *   2. Free Cash Flow  (20pts)  — cash generation quality
 *   3. Debt/Equity     (20pts)  — balance sheet safety
 *   4. ROE             (20pts)  — returns for shareholders
 *   5. Revenue Growth  (15pts)  — topline momentum
 */
function computeHealthScore(params: {
  operatingMargin: number | null;
  freeCashFlow: number | null;
  debtToEquity: number | null;
  roe: number | null;
  revenueGrowth: number | null;
}): FinancialHealthScore {
  const { operatingMargin, freeCashFlow, debtToEquity, roe, revenueGrowth } = params;
  let score = 0;
  const reasons: string[] = [];

  // 1. Operating Margin (25pts)
  if (operatingMargin != null) {
    if (operatingMargin >= 0.30) { score += 25; reasons.push("exceptional operating margin"); }
    else if (operatingMargin >= 0.20) { score += 20; reasons.push("strong operating margin"); }
    else if (operatingMargin >= 0.10) { score += 14; reasons.push("moderate operating margin"); }
    else if (operatingMargin > 0) { score += 7; reasons.push("thin operating margin"); }
    else { reasons.push("operating losses detected"); }
  }

  // 2. Free Cash Flow (20pts) — scaled relative to sign and magnitude
  if (freeCashFlow != null) {
    if (freeCashFlow >= 10e9) { score += 20; reasons.push("exceptional free cash flow"); }
    else if (freeCashFlow >= 1e9) { score += 16; reasons.push("strong free cash flow"); }
    else if (freeCashFlow >= 100e6) { score += 11; reasons.push("positive free cash flow"); }
    else if (freeCashFlow > 0) { score += 6; reasons.push("marginal free cash flow"); }
    else { reasons.push("negative free cash flow"); }
  }

  // 3. Debt/Equity (20pts) — lower is safer
  if (debtToEquity != null) {
    if (debtToEquity <= 0.25) { score += 20; reasons.push("very low leverage"); }
    else if (debtToEquity <= 0.75) { score += 15; reasons.push("manageable leverage"); }
    else if (debtToEquity <= 1.50) { score += 9; reasons.push("moderate leverage"); }
    else if (debtToEquity <= 3.00) { score += 4; reasons.push("elevated leverage"); }
    else { reasons.push("high leverage — elevated balance sheet risk"); }
  }

  // 4. ROE (20pts)
  if (roe != null) {
    if (roe >= 0.25) { score += 20; reasons.push("excellent return on equity"); }
    else if (roe >= 0.15) { score += 15; reasons.push("solid return on equity"); }
    else if (roe >= 0.08) { score += 9; reasons.push("adequate return on equity"); }
    else if (roe > 0) { score += 4; reasons.push("below-average return on equity"); }
    else { reasons.push("negative return on equity"); }
  }

  // 5. Revenue Growth YoY (15pts)
  if (revenueGrowth != null) {
    if (revenueGrowth >= 0.20) { score += 15; reasons.push("high revenue growth"); }
    else if (revenueGrowth >= 0.10) { score += 11; reasons.push("solid revenue growth"); }
    else if (revenueGrowth >= 0.03) { score += 7; reasons.push("moderate revenue growth"); }
    else if (revenueGrowth >= 0) { score += 3; reasons.push("flat revenue"); }
    else { reasons.push("revenue contraction"); }
  }

  const capped = Math.min(100, Math.max(0, Math.round(score)));

  let label: FinancialHealthScore["label"];
  if (capped >= 75) label = "Excellent";
  else if (capped >= 55) label = "Good";
  else if (capped >= 35) label = "Fair";
  else label = "Poor";

  const top3 = reasons.slice(0, 3).join(", ");
  const reasoning = `Score ${capped}/100 (${label}). Key drivers: ${top3 || "insufficient data"}.`;

  return { score: capped, label, reasoning };
}

// ─── Revenue Growth ───────────────────────────────────────────────────────────

/**
 * Calculates YoY revenue growth from income statement history.
 * Returns null if insufficient data.
 */
function calcRevenueGrowth(incomeHistory: any): number | null {
  const statements = incomeHistory?.incomeStatementHistory;
  if (!Array.isArray(statements) || statements.length < 2) return null;

  const latest = safeNum(statements[0]?.totalRevenue);
  const prior = safeNum(statements[1]?.totalRevenue);

  if (latest == null || prior == null || prior === 0) return null;
  return (latest - prior) / Math.abs(prior);
}

// ─── Financial Agent Node ─────────────────────────────────────────────────────

/**
 * Financial Agent — Node 2 of the Invest AI pipeline.
 *
 * Single responsibility: fetch and return a fully typed Financials object
 * including a computed Financial Health Score.
 *
 * Data sources (Yahoo Finance modules):
 *   - financialData          → margins, ROE, ROA, cash flow, debt
 *   - defaultKeyStatistics   → P/E ratio, EPS, price-to-book
 *   - incomeStatementHistory → YoY revenue growth calculation
 *
 * Outputs written to state:
 *   - financials
 *   - pipeline (financial step → complete)
 *
 * Does NOT touch profile, market data, news, or risk. Those are other agents.
 */
export async function financialAgent(
  state: ResearchGraphState
): Promise<Partial<ResearchGraphState>> {
  const ticker = state.ticker;
  console.log(`[FinancialAgent] Fetching financial data for: ${ticker}`);

  // Mark this step as processing in the pipeline tracker
  const processingPipeline = state.pipeline.map((step) =>
    step.id === "financial" ? { ...step, status: "processing" as const } : step
  );

  // ── 1. Fetch all needed modules in a single API call ──────────────────────
  const summary = await yahooFinance.quoteSummary(
    ticker,
    {
      modules: [
        "financialData",
        "defaultKeyStatistics",
        "incomeStatementHistory",
      ],
    },
    { validateResult: false }
  ) as any;

  const fd = summary.financialData as any;
  const ks = summary.defaultKeyStatistics as any;
  const ih = summary.incomeStatementHistory as any;

  // ── 2. Extract raw numeric values ─────────────────────────────────────────
  const operatingMarginRaw = safeNum(fd?.operatingMargins);
  const netMarginRaw       = safeNum(fd?.profitMargins);
  const roeRaw             = safeNum(fd?.returnOnEquity);
  const roaRaw             = safeNum(fd?.returnOnAssets);
  const debtToEquityRaw    = safeNum(fd?.debtToEquity);   // Yahoo returns as %, divide by 100
  const freeCashFlowRaw    = safeNum(fd?.freeCashflow);
  const totalRevenueRaw    = safeNum(fd?.totalRevenue);
  const netIncomeRaw       = safeNum(fd?.netIncomeToCommon);
  const operatingIncomeRaw = (totalRevenueRaw != null && operatingMarginRaw != null)
    ? totalRevenueRaw * operatingMarginRaw
    : null;

  const peRatioRaw  = safeNum(ks?.trailingPE) ?? safeNum(ks?.forwardPE);
  const epsRaw      = safeNum(ks?.trailingEps);

  // Yahoo Finance returns debtToEquity as a percentage (e.g. 45 means 0.45x)
  const debtToEquityNorm = debtToEquityRaw != null ? debtToEquityRaw / 100 : null;

  const revenueGrowth = calcRevenueGrowth(ih);

  // ── 3. Compute health score ───────────────────────────────────────────────
  const healthScore = computeHealthScore({
    operatingMargin: operatingMarginRaw,
    freeCashFlow:    freeCashFlowRaw,
    debtToEquity:    debtToEquityNorm,
    roe:             roeRaw,
    revenueGrowth,
  });

  // ── 4. Build typed Financials ─────────────────────────────────────────────
  const financials: Financials = {
    revenue:          fmt(totalRevenueRaw, "$"),
    netIncome:        fmt(netIncomeRaw, "$"),
    operatingIncome:  fmt(operatingIncomeRaw, "$"),
    peRatio:          peRatioRaw != null ? parseFloat(peRatioRaw.toFixed(1)) : 0,
    eps:              epsRaw != null ? parseFloat(epsRaw.toFixed(2)) : 0,
    roe:              roeRaw != null ? parseFloat((roeRaw * 100).toFixed(1)) : 0,
    roa:              roaRaw != null ? parseFloat((roaRaw * 100).toFixed(1)) : 0,
    debtToEquity:     debtToEquityNorm != null ? parseFloat(debtToEquityNorm.toFixed(2)) : 0,
    freeCashFlow:     fmt(freeCashFlowRaw, "$"),
    operatingMargin:  fmtPercent(operatingMarginRaw),
    netMargin:        fmtPercent(netMarginRaw),
    revenueGrowthYoY: fmtGrowth(revenueGrowth),
    healthScore,
  };

  console.log(
    `[FinancialAgent] ✓ ${ticker} | Revenue: ${financials.revenue} | ` +
    `Op Margin: ${financials.operatingMargin} | Health: ${healthScore.score}/100 (${healthScore.label})`
  );

  const completePipeline = processingPipeline.map((step) =>
    step.id === "financial"
      ? {
          ...step,
          status: "complete" as const,
          description: `Revenue: ${financials.revenue} · Margin: ${financials.operatingMargin} · Health: ${healthScore.label}`,
        }
      : step
  );

  return {
    financials,
    pipeline: completePipeline,
  };
}
