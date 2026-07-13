import { z } from "zod";
import type { ResearchGraphState } from "../state";
import type { Risk, RiskSummary, RiskSeverity, RiskCategory } from "@/types/research";

// ─── Zod Schema — LLM-enriched risk titles/descriptions ──────────────────────

const riskEnrichmentSchema = z.object({
  risks: z
    .array(
      z.object({
        /** Short, specific risk title (≤ 70 chars) */
        title: z.string().max(70),
        /** Evidence-based description referencing the company's actual data (≤ 200 chars) */
        description: z.string().max(200),
      })
    )
    .describe(
      "Enriched titles and descriptions for each scored risk dimension, in the same order provided."
    ),
});

// ─── Risk Dimension Types ─────────────────────────────────────────────────────

interface RiskDimension {
  id: string;
  category: RiskCategory;
  severity: RiskSeverity;
  /** Raw risk score: 0–100 (higher = riskier) */
  rawScore: number;
  /** Fallback title if LLM enrichment is unavailable */
  fallbackTitle: string;
  /** Fallback description derived from the data */
  fallbackDescription: string;
  /** Weight in the overall risk score (weights must sum to 100) */
  weight: number;
}

// ─── Risk Scoring Engine ──────────────────────────────────────────────────────

/**
 * Pure quantitative risk scoring across 8 dimensions.
 * Each dimension is scored 0–100 (higher = riskier) using thresholds
 * calibrated from public equity research standards.
 *
 * No LLM, no randomness. Fully deterministic given the same state.
 */
function scoreRiskDimensions(state: ResearchGraphState): RiskDimension[] {
  const f = state.financials;
  const m = state.marketData;
  const ns = state.newsSentiment;

  const dimensions: RiskDimension[] = [];

  // ── 1. Valuation Risk (P/E) — weight 15 ─────────────────────────────────
  {
    const pe = f?.peRatio ?? 0;
    let rawScore = 0;
    let sev: RiskSeverity = "low";
    let desc = "";

    if (pe <= 0) {
      rawScore = 60; sev = "high";
      desc = "No trailing P/E available — often signals a loss-making period or negative earnings.";
    } else if (pe > 60) {
      rawScore = 80; sev = "critical";
      desc = `P/E of ${pe}x is speculative territory. The stock is priced for perfection.`;
    } else if (pe > 40) {
      rawScore = 60; sev = "high";
      desc = `P/E of ${pe}x reflects elevated growth expectations with limited margin for earnings misses.`;
    } else if (pe > 25) {
      rawScore = 35; sev = "medium";
      desc = `P/E of ${pe}x is above market averages, implying growth premium exposure.`;
    } else {
      rawScore = 15; sev = "low";
      desc = `P/E of ${pe}x is reasonably valued relative to market.`;
    }

    dimensions.push({
      id: "valuation",
      category: "Market",
      severity: sev,
      rawScore,
      weight: 15,
      fallbackTitle: `Valuation Risk (P/E: ${pe}x)`,
      fallbackDescription: desc,
    });
  }

  // ── 2. Leverage Risk (Debt/Equity) — weight 15 ──────────────────────────
  {
    const de = f?.debtToEquity ?? 0;
    let rawScore = 0;
    let sev: RiskSeverity = "low";
    let desc = "";

    if (de > 3.0) {
      rawScore = 85; sev = "critical";
      desc = `Debt/Equity of ${de}x — heavily leveraged balance sheet exposed to rising rates and covenant risk.`;
    } else if (de > 1.5) {
      rawScore = 65; sev = "high";
      desc = `Debt/Equity of ${de}x — elevated leverage constrains financial flexibility during downturns.`;
    } else if (de > 0.75) {
      rawScore = 40; sev = "medium";
      desc = `Debt/Equity of ${de}x — moderate leverage. Manageable but warrants monitoring.`;
    } else {
      rawScore = 15; sev = "low";
      desc = `Debt/Equity of ${de}x — conservative balance sheet with strong financial resilience.`;
    }

    dimensions.push({
      id: "leverage",
      category: "Financial",
      severity: sev,
      rawScore,
      weight: 15,
      fallbackTitle: `Balance Sheet Risk (D/E: ${de}x)`,
      fallbackDescription: desc,
    });
  }

  // ── 3. Profitability Risk (Operating Margin) — weight 15 ────────────────
  {
    const margin = f?.operatingMargin ?? "N/A";
    const pct = parseFloat(margin.replace("%", ""));
    let rawScore = 0;
    let sev: RiskSeverity = "low";
    let desc = "";

    if (isNaN(pct) || pct <= 0) {
      rawScore = 75; sev = "critical";
      desc = "Negative or unknown operating margin — business is not generating operating profit.";
    } else if (pct < 5) {
      rawScore = 65; sev = "high";
      desc = `Operating margin of ${pct}% — thin margin leaves limited buffer against cost pressures.`;
    } else if (pct < 15) {
      rawScore = 40; sev = "medium";
      desc = `Operating margin of ${pct}% — adequate but below best-in-class peers.`;
    } else {
      rawScore = 15; sev = "low";
      desc = `Strong operating margin of ${pct}% — indicates pricing power and cost discipline.`;
    }

    dimensions.push({
      id: "profitability",
      category: "Financial",
      severity: sev,
      rawScore,
      weight: 15,
      fallbackTitle: `Profitability Risk (Op Margin: ${margin})`,
      fallbackDescription: desc,
    });
  }

  // ── 4. Market Trend Risk — weight 12 ────────────────────────────────────
  {
    const trend = m?.trend ?? "Neutral";
    const rsi = m?.rsi ?? 50;
    let rawScore = 0;
    let sev: RiskSeverity = "low";
    let desc = "";

    if (trend === "Bearish" && rsi <= 40) {
      rawScore = 70; sev = "high";
      desc = `Death cross confirmed (price < MA50 < MA200) with RSI of ${rsi}. Strong downtrend in progress.`;
    } else if (trend === "Bearish") {
      rawScore = 55; sev = "high";
      desc = `Price below both MA50 and MA200 signals bearish market structure. Trend risk elevated.`;
    } else if (trend === "Neutral") {
      rawScore = 30; sev = "medium";
      desc = `Mixed moving average signals — neither clear uptrend nor downtrend. Directional uncertainty.`;
    } else {
      rawScore = 15; sev = "low";
      desc = `Golden cross in effect (price > MA50 > MA200). Market structure supports the uptrend.`;
    }

    dimensions.push({
      id: "trend",
      category: "Market",
      severity: sev,
      rawScore,
      weight: 12,
      fallbackTitle: `Market Trend Risk (${trend})`,
      fallbackDescription: desc,
    });
  }

  // ── 5. Volatility Risk (Beta) — weight 10 ───────────────────────────────
  {
    const beta = m?.beta ?? 1.0;
    let rawScore = 0;
    let sev: RiskSeverity = "low";
    let desc = "";

    if (beta > 2.0) {
      rawScore = 80; sev = "critical";
      desc = `Beta of ${beta} — extreme sensitivity to market swings. 2× the market's volatility.`;
    } else if (beta > 1.5) {
      rawScore = 60; sev = "high";
      desc = `Beta of ${beta} — significantly more volatile than the broader market.`;
    } else if (beta > 1.0) {
      rawScore = 35; sev = "medium";
      desc = `Beta of ${beta} — modestly above market correlation. Normal for growth equities.`;
    } else {
      rawScore = 15; sev = "low";
      desc = `Beta of ${beta} — defensive characteristics, lower drawdown risk in market selloffs.`;
    }

    dimensions.push({
      id: "volatility",
      category: "Market",
      severity: sev,
      rawScore,
      weight: 10,
      fallbackTitle: `Volatility Risk (Beta: ${beta})`,
      fallbackDescription: desc,
    });
  }

  // ── 6. Revenue Growth Risk — weight 13 ──────────────────────────────────
  {
    const growth = f?.revenueGrowthYoY ?? "N/A";
    const pct = parseFloat(growth.replace("+", "").replace("%", ""));
    let rawScore = 0;
    let sev: RiskSeverity = "low";
    let desc = "";

    if (isNaN(pct)) {
      rawScore = 40; sev = "medium";
      desc = "Revenue growth data unavailable — limits earnings visibility.";
    } else if (pct < -10) {
      rawScore = 80; sev = "critical";
      desc = `Revenue contracting at ${growth} YoY — severe top-line deterioration.`;
    } else if (pct < 0) {
      rawScore = 60; sev = "high";
      desc = `Revenue declining ${growth} YoY — business facing structural headwinds.`;
    } else if (pct < 5) {
      rawScore = 35; sev = "medium";
      desc = `Revenue growth of ${growth} — barely above inflation, raising execution concerns.`;
    } else {
      rawScore = 15; sev = "low";
      desc = `Revenue growing at ${growth} YoY — solid topline momentum.`;
    }

    dimensions.push({
      id: "growth",
      category: "Business",
      severity: sev,
      rawScore,
      weight: 13,
      fallbackTitle: `Revenue Growth Risk (${growth} YoY)`,
      fallbackDescription: desc,
    });
  }

  // ── 7. Momentum Risk (RSI Overbought) — weight 10 ───────────────────────
  {
    const rsi = m?.rsi ?? null;
    let rawScore = 0;
    let sev: RiskSeverity = "low";
    let desc = "";

    if (rsi == null) {
      rawScore = 20; sev = "low";
      desc = "RSI data unavailable. Technical momentum risk cannot be assessed.";
    } else if (rsi >= 80) {
      rawScore = 75; sev = "critical";
      desc = `RSI of ${rsi} — extremely overbought. Mean-reversion selloff risk is elevated.`;
    } else if (rsi >= 70) {
      rawScore = 55; sev = "high";
      desc = `RSI of ${rsi} — overbought territory. Near-term pullback risk is heightened.`;
    } else if (rsi <= 30) {
      rawScore = 45; sev = "medium";
      desc = `RSI of ${rsi} — oversold. Indicates selling pressure and potential downtrend continuation.`;
    } else {
      rawScore = 15; sev = "low";
      desc = `RSI of ${rsi} — neutral momentum zone. No extreme reading in either direction.`;
    }

    dimensions.push({
      id: "momentum",
      category: "Market",
      severity: sev,
      rawScore,
      weight: 10,
      fallbackTitle: `Momentum Risk (RSI: ${rsi ?? "N/A"})`,
      fallbackDescription: desc,
    });
  }

  // ── 8. News Sentiment Risk — weight 10 ──────────────────────────────────
  {
    const sentiment = ns?.overallSentiment ?? "neutral";
    const negCount = ns?.negativeCount ?? 0;
    const totalCount = (ns?.positiveCount ?? 0) + negCount + (ns?.neutralCount ?? 0);
    const negRatio = totalCount > 0 ? negCount / totalCount : 0;

    let rawScore = 0;
    let sev: RiskSeverity = "low";
    let desc = "";

    if (sentiment === "negative" && negRatio >= 0.5) {
      rawScore = 70; sev = "high";
      desc = `${Math.round(negRatio * 100)}% of recent headlines are negative. Media risk is elevated.`;
    } else if (sentiment === "negative") {
      rawScore = 50; sev = "medium";
      desc = "Negative overall news sentiment with ongoing adverse narratives.";
    } else if (sentiment === "neutral") {
      rawScore = 25; sev = "low";
      desc = "Mixed or neutral media coverage. No dominant positive or negative narrative.";
    } else {
      rawScore = 10; sev = "low";
      desc = "Positive news sentiment — media narrative is supportive of the investment thesis.";
    }

    dimensions.push({
      id: "sentiment",
      category: "Macro",
      severity: sev,
      rawScore,
      weight: 10,
      fallbackTitle: `News Sentiment Risk (${sentiment})`,
      fallbackDescription: desc,
    });
  }

  return dimensions;
}

// ─── Aggregate Risk Score ─────────────────────────────────────────────────────

function computeOverallRisk(dimensions: RiskDimension[]): {
  score: number;
  level: RiskSummary["level"];
  reasons: string[];
} {
  const totalWeight = dimensions.reduce((s, d) => s + d.weight, 0);
  const weightedScore = dimensions.reduce((s, d) => s + d.rawScore * d.weight, 0);
  const score = Math.round(weightedScore / totalWeight);

  let level: RiskSummary["level"];
  if (score >= 65)      level = "Critical";
  else if (score >= 45) level = "High";
  else if (score >= 25) level = "Moderate";
  else                  level = "Low";

  // Top 3 highest-scoring risk reasons
  const reasons = [...dimensions]
    .sort((a, b) => b.rawScore - a.rawScore)
    .slice(0, 3)
    .map((d) => d.fallbackTitle);

  return { score, level, reasons };
}

// ─── LLM Enrichment ───────────────────────────────────────────────────────────

/**
 * Enriches the deterministic risk dimensions with LLM-written titles and
 * descriptions that are more natural and context-aware.
 *
 * The LLM does NOT score — scoring is always deterministic.
 * The LLM only writes human-readable text for the top risks.
 */
async function enrichWithLLM(
  dimensions: RiskDimension[],
  state: ResearchGraphState
): Promise<Array<{ title: string; description: string }> | null> {
  try {
    const { ChatOpenAI } = await import("@langchain/openai");

    const model = new ChatOpenAI({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0,
      apiKey: process.env.OPENAI_API_KEY,
    }).withStructuredOutput(riskEnrichmentSchema);

    const company = state.profile?.name ?? state.ticker;
    const ticker = state.ticker;

    const dimensionContext = dimensions
      .map(
        (d, i) =>
          `${i + 1}. [${d.category}] Score: ${d.rawScore}/100, Severity: ${d.severity}\n   Data: ${d.fallbackDescription}`
      )
      .join("\n");

    const result = await model.invoke([
      {
        role: "system",
        content:
          `You are a senior equity risk analyst. You will receive scored risk dimensions for ${company} (${ticker}). ` +
          `For each dimension, write a concise, specific title (≤70 chars) and description (≤200 chars) ` +
          `that references the company by name and is grounded in the data provided. ` +
          `Do not add new risks. Do not speculate beyond the data. Return exactly ${dimensions.length} entries.`,
      },
      {
        role: "user",
        content: `Enrich these ${dimensions.length} risk dimensions:\n\n${dimensionContext}`,
      },
    ]);

    return (result as { risks: Array<{ title: string; description: string }> }).risks;
  } catch (err: unknown) {
    console.warn(`[RiskAgent] LLM enrichment failed: ${(err instanceof Error ? err.message : String(err))}`);
    return null;
  }
}

// ─── Risk Agent Node ──────────────────────────────────────────────────────────

/**
 * Risk Agent — Node 5 of the Invest AI pipeline.
 *
 * First synthesis node: reads quantitative outputs from Financial, Market, and
 * News agents to derive a multi-dimensional risk profile.
 *
 * Architecture:
 *   1. Score 8 risk dimensions deterministically (financial, market, sentiment)
 *   2. Compute a weighted overall Risk Score (0–100) and level
 *   3. Optionally enrich titles/descriptions via LLM (same pattern as News Agent)
 *   4. Return RiskSummary + Risk[] to state
 *
 * The score is ALWAYS deterministic. The LLM only writes human-readable text.
 *
 * Outputs written to state:
 *   - risks       (flat Risk[] for the dashboard cards)
 *   - riskSummary (scored aggregate with level + reasons)
 *   - pipeline    (risk step → complete)
 */
export async function riskAgent(
  state: ResearchGraphState
): Promise<Partial<ResearchGraphState>> {
  const ticker = state.ticker;
  console.log(`[RiskAgent] Scoring risk dimensions for: ${ticker}`);

  const processingPipeline = state.pipeline.map((step) =>
    step.id === "risk" ? { ...step, status: "processing" as const } : step
  );

  // ── 1. Score all risk dimensions ──────────────────────────────────────────
  const dimensions = scoreRiskDimensions(state);

  // ── 2. Compute overall risk score ─────────────────────────────────────────
  const { score, level, reasons } = computeOverallRisk(dimensions);

  // ── 3. Optionally enrich with LLM ─────────────────────────────────────────
  const hasApiKey = Boolean(process.env.OPENAI_API_KEY?.trim());
  let enriched: Array<{ title: string; description: string }> | null = null;

  // Only enrich the top risks (above-low severity) to save tokens
  const significantDimensions = [...dimensions]
    .sort((a, b) => b.rawScore - a.rawScore)
    .filter((d) => d.severity !== "low")
    .slice(0, 5);

  if (hasApiKey && significantDimensions.length > 0) {
    console.log(`[RiskAgent] Enriching ${significantDimensions.length} significant risks via LLM...`);
    enriched = await enrichWithLLM(significantDimensions, state);
  }

  // ── 4. Build Risk[] ────────────────────────────────────────────────────────
  // Include all non-low risks + at most 1 low for completeness
  const riskDims = [
    ...dimensions.filter((d) => d.severity !== "low"),
    ...dimensions.filter((d) => d.severity === "low").slice(0, 1),
  ]
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.severity] - order[b.severity];
    })
    .slice(0, 6);

  const risks: Risk[] = riskDims.map((dim, i) => {
    // Find enriched entry if available (by position in significantDimensions)
    const sigIdx = significantDimensions.findIndex((s) => s.id === dim.id);
    const enrichedEntry = sigIdx >= 0 ? enriched?.[sigIdx] : null;

    return {
      id: i + 1,
      title: enrichedEntry?.title ?? dim.fallbackTitle,
      description: enrichedEntry?.description ?? dim.fallbackDescription,
      severity: dim.severity,
      category: dim.category,
    };
  });

  // ── 5. Build RiskSummary ──────────────────────────────────────────────────
  const riskSummary: RiskSummary = {
    overallScore: score,
    level,
    reasons,
    risks,
  };

  const method = hasApiKey && enriched ? "LLM-enriched" : "deterministic";
  console.log(
    `[RiskAgent] ✓ ${ticker} | Risk Score: ${score}/100 (${level}) | ` +
    `${risks.length} risk factors | Method: ${method}`
  );

  const completePipeline = processingPipeline.map((step) =>
    step.id === "risk"
      ? {
          ...step,
          status: "complete" as const,
          description: `Risk Score: ${score}/100 (${level}) · ${risks.length} factors identified`,
        }
      : step
  );

  return {
    risks,
    riskSummary,
    pipeline: completePipeline,
  };
}
