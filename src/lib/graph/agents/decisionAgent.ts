import { z } from "zod";
import type { ResearchGraphState } from "../state";
import type {
  InvestmentDecision,
  DecisionVerdict,
  PipelineStep,
} from "@/types/research";

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const investmentDecisionSchema = z.object({
  verdict: z
    .enum(["BUY", "WATCH", "PASS"])
    .describe("Final investment verdict."),

  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe("Confidence in the verdict, 0–100."),

  investmentHorizon: z
    .enum(["Short-term", "Medium-term", "Long-term"])
    .describe(
      "Recommended time horizon: Short-term (<6 months), Medium-term (6–18 months), Long-term (>18 months)."
    ),

  expectedReturnNarrative: z
    .string()
    .max(200)
    .describe(
      "A concise narrative on the expected return profile, e.g., " +
        "'15-20% upside driven by margin expansion and sector tailwinds over 12-18 months.'"
    ),

  rationale: z
    .string()
    .max(500)
    .describe(
      "A 2-4 sentence rationale synthesizing the investment thesis, risk profile, " +
        "market signals, and news sentiment into a clear justification for the verdict."
    ),
});

// ─── Context Builder ──────────────────────────────────────────────────────────

/**
 * Compresses all upstream agent outputs into a decision-focused brief.
 *
 * Design: the LLM must see a highly structured, quantitative summary to
 * avoid hallucination. We give it scores, numbers, and ranked signals.
 */
function buildDecisionBrief(state: ResearchGraphState): string {
  const p = state.profile;
  const f = state.financials;
  const m = state.marketData;
  const ns = state.newsSentiment;
  const rs = state.riskSummary;
  const th = state.investmentThesis;

  const lines: string[] = [
    `═══ DECISION BRIEF: ${p?.name ?? state.ticker} (${state.ticker}) ═══`,
    ``,
    `── COMPANY ──`,
    `Sector: ${p?.sector ?? "N/A"} | Industry: ${p?.industry ?? "N/A"}`,
    `Market Cap: ${p?.marketCap ?? "N/A"} | Price: $${p?.price ?? "N/A"} (${p?.changePercent != null ? (p.changePercent >= 0 ? "+" : "") + p.changePercent.toFixed(2) + "%" : "N/A"})`,
    ``,
  ];

  // Financials block
  if (f) {
    lines.push(`── FINANCIALS ──`);
    lines.push(`Revenue: ${f.revenue} | Net Income: ${f.netIncome}`);
    lines.push(`P/E: ${f.peRatio} | EPS: $${f.eps}`);
    lines.push(`ROE: ${f.roe}% | ROA: ${f.roa}% | D/E: ${f.debtToEquity}`);
    lines.push(`Operating Margin: ${f.operatingMargin} | Net Margin: ${f.netMargin}`);
    lines.push(`Revenue Growth YoY: ${f.revenueGrowthYoY}`);
    lines.push(`Free Cash Flow: ${f.freeCashFlow}`);
    lines.push(
      `Health Score: ${f.healthScore.score}/100 (${f.healthScore.label}) — ${f.healthScore.reasoning}`
    );
    lines.push(``);
  }

  // Market / Technical block
  if (m) {
    lines.push(`── MARKET / TECHNICAL ──`);
    lines.push(`Trend: ${m.trend} | RSI: ${m.rsi ?? "N/A"} | Beta: ${m.beta}`);
    lines.push(`50-Day MA: $${m.movingAverage50d} | 200-Day MA: $${m.movingAverage200d}`);
    lines.push(`52-Week Range: $${m.fiftyTwoWeekLow} – $${m.fiftyTwoWeekHigh}`);
    lines.push(`Support: $${m.support} | Resistance: $${m.resistance}`);
    lines.push(`Volume: ${m.volume} (Avg: ${m.avgVolume})`);
    lines.push(``);
  }

  // News Sentiment block
  if (ns) {
    lines.push(`── NEWS SENTIMENT ──`);
    lines.push(
      `Overall: ${ns.overallSentiment.toUpperCase()} | +${ns.positiveCount} / -${ns.negativeCount} / ~${ns.neutralCount}`
    );
    if (ns.catalysts.length > 0) {
      lines.push(`Catalysts: ${ns.catalysts.slice(0, 3).join("; ")}`);
    }
    if (ns.risks.length > 0) {
      lines.push(`News Risks: ${ns.risks.slice(0, 3).join("; ")}`);
    }
    lines.push(``);
  }

  // Risk block
  if (rs) {
    lines.push(`── RISK PROFILE ──`);
    lines.push(`Overall Risk: ${rs.overallScore}/100 (${rs.level})`);
    lines.push(`Key Reasons: ${rs.reasons.slice(0, 3).join("; ")}`);
    lines.push(``);
  }

  // Investment Thesis block
  if (th) {
    lines.push(`── INVESTMENT THESIS ──`);
    lines.push(`Thesis: ${th.thesis}`);
    lines.push(`Strengths: ${th.strengths.join("; ")}`);
    lines.push(`Weaknesses: ${th.weaknesses.join("; ")}`);
    lines.push(`Growth Drivers: ${th.growthDrivers.join("; ")}`);
    lines.push(`Threats: ${th.threats.join("; ")}`);
    lines.push(``);
  }

  return lines.join("\n");
}

// ─── LLM-powered Decision ─────────────────────────────────────────────────────

async function llmDecision(
  state: ResearchGraphState
): Promise<InvestmentDecision | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const { ChatOpenAI } = await import("@langchain/openai");

    const llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.15, // Low temperature — we want consistent, grounded decisions
      openAIApiKey: apiKey,
    });

    const structured = llm.withStructuredOutput(investmentDecisionSchema, {
      name: "investment_decision",
    });

    const brief = buildDecisionBrief(state);

    const systemPrompt = [
      "You are a senior equity analyst at a top-tier investment firm.",
      "You are given a complete research brief on a public company.",
      "",
      "Your task: deliver a final investment verdict.",
      "",
      "VERDICT RULES:",
      "• BUY — Strong fundamentals + favorable technicals + manageable risk + positive or neutral sentiment.",
      "         Requires financial health ≥ 60, risk ≤ 60, and at least a neutral market trend.",
      "• WATCH — Mixed signals. Fundamentals are decent but risk is elevated, OR technicals are bearish",
      "          while fundamentals remain strong. Worth monitoring for better entry.",
      "• PASS — Weak fundamentals OR critical risk OR strongly bearish technicals combined with",
      "          negative sentiment. Capital preservation is the priority.",
      "",
      "CONFIDENCE CALIBRATION:",
      "• 80-100: All signals align strongly in one direction.",
      "• 60-79:  Most signals align, minor disagreements.",
      "• 40-59:  Mixed signals, verdict is a close call.",
      "• 20-39:  Significant uncertainty; verdict is tentative.",
      "• 0-19:   Insufficient data to make a meaningful call.",
      "",
      "HORIZON RULES:",
      "• Short-term (<6 months): Verdict driven primarily by technicals and momentum.",
      "• Medium-term (6–18 months): Verdict blends fundamentals + catalyst timeline.",
      "• Long-term (>18 months): Verdict anchored in secular thesis and competitive moat.",
      "",
      "Be evidence-based. Cite specific numbers from the brief.",
      "Do not hedge excessively — give a clear, defensible verdict.",
    ].join("\n");

    const result = await structured.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: brief },
    ]);

    return result as InvestmentDecision;
  } catch (err) {
    console.error("[DecisionAgent] LLM path failed, falling back to deterministic:", err);
    return null;
  }
}

// ─── Deterministic Decision Engine ────────────────────────────────────────────

/**
 * Weighted scoring model that synthesizes all upstream quantitative signals
 * into a final verdict when the LLM is unavailable.
 *
 * Signal weights (total = 100):
 *   Financial Health:   30%
 *   Risk Profile:       25%
 *   Market Trend:       20%
 *   News Sentiment:     15%
 *   Thesis Quality:     10%
 */
function deterministicDecision(state: ResearchGraphState): InvestmentDecision {
  const f = state.financials;
  const m = state.marketData;
  const ns = state.newsSentiment;
  const rs = state.riskSummary;
  const th = state.investmentThesis;

  // ── 1. Financial Health Score (0–100) ─────────────────────────────────────

  let financialScore = 50; // neutral default
  if (f) {
    financialScore = f.healthScore.score;
  }

  // ── 2. Risk Score (inverted: lower risk = higher score) ───────────────────

  let riskScore = 50;
  if (rs) {
    // rs.overallScore is 0–100 where higher = riskier
    // We invert: 100 - riskScore = investment attractiveness
    riskScore = 100 - rs.overallScore;
  }

  // ── 3. Market Trend Score ─────────────────────────────────────────────────

  let trendScore = 50;
  if (m) {
    // Base trend
    if (m.trend === "Bullish") trendScore = 75;
    else if (m.trend === "Bearish") trendScore = 25;

    // RSI adjustment (±10 points)
    if (m.rsi != null) {
      if (m.rsi < 30) trendScore += 10;       // Oversold = potential opportunity
      else if (m.rsi > 70) trendScore -= 10;  // Overbought = potential pullback
    }

    // Price vs 200-day MA adjustment (±5 points)
    if (m.currentPrice > 0 && m.movingAverage200d > 0) {
      const priceVsMa200 = ((m.currentPrice - m.movingAverage200d) / m.movingAverage200d) * 100;
      if (priceVsMa200 > 10) trendScore += 5;
      else if (priceVsMa200 < -10) trendScore -= 5;
    }

    trendScore = Math.max(0, Math.min(100, trendScore));
  }

  // ── 4. Sentiment Score ────────────────────────────────────────────────────

  let sentimentScore = 50;
  if (ns) {
    const total = ns.positiveCount + ns.negativeCount + ns.neutralCount;
    if (total > 0) {
      const posRatio = ns.positiveCount / total;
      const negRatio = ns.negativeCount / total;
      sentimentScore = Math.round(50 + (posRatio - negRatio) * 50);
      sentimentScore = Math.max(0, Math.min(100, sentimentScore));
    }
  }

  // ── 5. Thesis Quality Score ───────────────────────────────────────────────

  let thesisScore = 50;
  if (th) {
    // More strengths + drivers → higher score
    // More weaknesses + threats → lower score
    const positiveSignals = th.strengths.length + th.growthDrivers.length;
    const negativeSignals = th.weaknesses.length + th.threats.length;
    const totalSignals = positiveSignals + negativeSignals;

    if (totalSignals > 0) {
      thesisScore = Math.round((positiveSignals / totalSignals) * 100);
    }
  }

  // ── Weighted Composite ────────────────────────────────────────────────────

  const composite = Math.round(
    financialScore * 0.30 +
    riskScore * 0.25 +
    trendScore * 0.20 +
    sentimentScore * 0.15 +
    thesisScore * 0.10
  );

  // ── Verdict Determination ─────────────────────────────────────────────────

  let verdict: DecisionVerdict;
  if (composite >= 65) {
    verdict = "BUY";
  } else if (composite >= 40) {
    verdict = "WATCH";
  } else {
    verdict = "PASS";
  }

  // ── Confidence Calibration ────────────────────────────────────────────────
  // Confidence = how far from the thresholds (more decisive = higher confidence)

  let confidence: number;
  if (verdict === "BUY") {
    // Distance above 65 threshold, scaled to 50–95
    confidence = Math.min(95, 50 + Math.round((composite - 65) * 1.3));
  } else if (verdict === "PASS") {
    // Distance below 40 threshold, scaled to 50–95
    confidence = Math.min(95, 50 + Math.round((40 - composite) * 1.3));
  } else {
    // WATCH — inherently lower confidence (mixed signals)
    confidence = Math.min(65, 30 + Math.round(Math.abs(composite - 52.5) * 0.8));
  }

  // ── Investment Horizon ────────────────────────────────────────────────────

  let investmentHorizon: InvestmentDecision["investmentHorizon"];
  if (m?.trend === "Bullish" && sentimentScore >= 60) {
    investmentHorizon = "Short-term";
  } else if (financialScore >= 65 && thesisScore >= 55) {
    investmentHorizon = "Long-term";
  } else {
    investmentHorizon = "Medium-term";
  }

  // ── Rationale Construction ────────────────────────────────────────────────

  const rationale = buildDeterministicRationale(
    state,
    verdict,
    composite,
    { financialScore, riskScore, trendScore, sentimentScore, thesisScore }
  );

  // ── Return Narrative ──────────────────────────────────────────────────────

  const expectedReturnNarrative = buildReturnNarrative(
    verdict,
    composite,
    investmentHorizon,
    state
  );

  return {
    verdict,
    confidence,
    investmentHorizon,
    expectedReturnNarrative,
    rationale,
  };
}

// ─── Rationale Builder ────────────────────────────────────────────────────────

function buildDeterministicRationale(
  state: ResearchGraphState,
  verdict: DecisionVerdict,
  composite: number,
  scores: {
    financialScore: number;
    riskScore: number;
    trendScore: number;
    sentimentScore: number;
    thesisScore: number;
  }
): string {
  const ticker = state.ticker;
  const parts: string[] = [];

  // Lead with the quantitative basis
  parts.push(
    `${ticker} receives a composite score of ${composite}/100 across five dimensions.`
  );

  // Top contributing factor
  const factorEntries: [string, number][] = [
    ["Financial health", scores.financialScore],
    ["Risk profile", scores.riskScore],
    ["Market trend", scores.trendScore],
    ["News sentiment", scores.sentimentScore],
    ["Thesis quality", scores.thesisScore],
  ];

  factorEntries.sort((a, b) => b[1] - a[1]);
  const strongest = factorEntries[0];
  const weakest = factorEntries[factorEntries.length - 1];

  parts.push(
    `${strongest[0]} is the strongest signal at ${strongest[1]}/100, while ${weakest[0].toLowerCase()} is the weakest at ${weakest[1]}/100.`
  );

  // Verdict-specific commentary
  if (verdict === "BUY") {
    parts.push(
      `The convergence of positive signals supports an entry position with managed position sizing.`
    );
  } else if (verdict === "WATCH") {
    parts.push(
      `Mixed signals suggest monitoring for improved risk-reward before committing capital.`
    );
  } else {
    parts.push(
      `The weight of negative signals suggests avoiding this position until fundamentals or technicals improve.`
    );
  }

  return parts.join(" ");
}

// ─── Return Narrative Builder ─────────────────────────────────────────────────

function buildReturnNarrative(
  verdict: DecisionVerdict,
  composite: number,
  horizon: InvestmentDecision["investmentHorizon"],
  state: ResearchGraphState
): string {
  const ticker = state.ticker;

  if (verdict === "BUY") {
    if (composite >= 80) {
      return `Strong conviction: ${ticker} presents 15-25% upside potential over ${horizon.toLowerCase()} horizon driven by solid fundamentals and favorable market positioning.`;
    }
    return `Moderate conviction: ${ticker} shows 8-15% upside potential over ${horizon.toLowerCase()} horizon, contingent on sustained execution and sector tailwinds.`;
  }

  if (verdict === "WATCH") {
    return `${ticker} may offer 5-12% upside if key catalysts materialize, but current risk-reward is not compelling enough for immediate entry.`;
  }

  // PASS
  return `Capital preservation is recommended. ${ticker} faces headwinds that could result in 5-15% downside risk before stabilization.`;
}

// ─── Agent Entry Point ────────────────────────────────────────────────────────

/**
 * Decision Agent — Milestone 11
 *
 * Single responsibility: synthesize ALL prior agent outputs into a final
 * BUY / WATCH / PASS verdict with confidence score, investment horizon,
 * expected return narrative, and evidence-based rationale.
 *
 * Execution paths:
 *   1. OPENAI_API_KEY present → LLM structured output (GPT-4o-mini)
 *   2. No API key or LLM failure → Deterministic weighted scoring model
 *
 * Output written to state:
 *   - decision       (InvestmentDecision)
 *   - recommendation (Recommendation — legacy compat)
 *   - pipeline       (decision step → complete)
 */
export async function decisionAgent(
  state: ResearchGraphState
): Promise<Partial<ResearchGraphState>> {
  console.log(`[DecisionAgent] Synthesizing final verdict for: ${state.ticker}`);

  // ── Try LLM path first ──────────────────────────────────────────────────

  let decision = await llmDecision(state);

  // ── Fallback to deterministic ───────────────────────────────────────────

  if (!decision) {
    console.log("[DecisionAgent] Using deterministic scoring model.");
    decision = deterministicDecision(state);
  }

  console.log(
    `[DecisionAgent] Verdict: ${decision.verdict} (${decision.confidence}% confidence, ${decision.investmentHorizon})`
  );

  // ── Build legacy recommendation for backward compat ─────────────────────

  const legacyStatusMap: Record<DecisionVerdict, "INVEST" | "HOLD" | "PASS"> = {
    BUY: "INVEST",
    WATCH: "HOLD",
    PASS: "PASS",
  };

  const recommendation = {
    status: legacyStatusMap[decision.verdict],
    confidence: decision.confidence,
    summary: decision.rationale,
  };

  // ── Pipeline update ─────────────────────────────────────────────────────

  const completePipeline: PipelineStep[] = state.pipeline.map((step) =>
    step.id === "decision"
      ? { ...step, status: "complete" as const, description: `${decision!.verdict} — ${decision!.confidence}% confidence` }
      : step
  );

  return {
    decision,
    recommendation,
    pipeline: completePipeline,
  };
}
