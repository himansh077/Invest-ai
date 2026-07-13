import { z } from "zod";
import type { ResearchGraphState } from "../state";
import type {
  ExplainabilityTrace,
  ExplainabilityStep,
  PipelineStep,
} from "@/types/research";

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const explainabilityStepSchema = z.object({
  id: z
    .string()
    .describe("A unique step identifier, e.g., 'E1', 'E2'."),

  claim: z
    .string()
    .max(150)
    .describe("A factual claim that contributed to the investment decision."),

  evidence: z
    .string()
    .max(200)
    .describe("Specific data point or metric that supports this claim."),

  source: z
    .enum(["company", "financial", "market", "news", "risk", "reasoning"])
    .describe("Which agent pipeline stage produced this evidence."),
});

const explainabilityTraceSchema = z.object({
  decisionTree: z
    .array(explainabilityStepSchema)
    .min(5)
    .max(10)
    .describe(
      "An ordered sequence of evidence-backed steps, tracing the path " +
      "from raw data to the final investment verdict."
    ),

  executiveSummary: z
    .string()
    .max(600)
    .describe(
      "A 3-5 sentence executive summary that a portfolio manager can read in 30 seconds. " +
      "Must reference the verdict, confidence, and 2-3 key evidence points."
    ),
});

// ─── Context Builder ──────────────────────────────────────────────────────────

/**
 * Builds a comprehensive evidence dossier from all upstream agent outputs.
 * This gives the LLM the raw material to construct the explainability trace.
 */
function buildEvidenceDossier(state: ResearchGraphState): string {
  const p = state.profile;
  const f = state.financials;
  const m = state.marketData;
  const ns = state.newsSentiment;
  const rs = state.riskSummary;
  const th = state.investmentThesis;
  const d = state.decision;

  const lines: string[] = [
    `═══ EVIDENCE DOSSIER: ${p?.name ?? state.ticker} (${state.ticker}) ═══`,
    ``,
    `FINAL VERDICT: ${d?.verdict ?? "N/A"} | CONFIDENCE: ${d?.confidence ?? "N/A"}%`,
    `HORIZON: ${d?.investmentHorizon ?? "N/A"}`,
    ``,
  ];

  // Company evidence
  lines.push(`── COMPANY AGENT EVIDENCE ──`);
  lines.push(`Name: ${p?.name ?? "N/A"}`);
  lines.push(`Sector: ${p?.sector ?? "N/A"} | Industry: ${p?.industry ?? "N/A"}`);
  lines.push(`Market Cap: ${p?.marketCap ?? "N/A"}`);
  lines.push(`Employees: ${p?.employees ?? "N/A"}`);
  lines.push(`Price: $${p?.price ?? "N/A"} (${p?.changePercent != null ? (p.changePercent >= 0 ? "+" : "") + p.changePercent.toFixed(2) + "%" : "N/A"})`);
  lines.push(``);

  // Financial evidence
  if (f) {
    lines.push(`── FINANCIAL AGENT EVIDENCE ──`);
    lines.push(`Revenue: ${f.revenue} | Net Income: ${f.netIncome}`);
    lines.push(`P/E: ${f.peRatio} | EPS: $${f.eps}`);
    lines.push(`ROE: ${f.roe}% | ROA: ${f.roa}%`);
    lines.push(`D/E: ${f.debtToEquity} | FCF: ${f.freeCashFlow}`);
    lines.push(`Operating Margin: ${f.operatingMargin} | Net Margin: ${f.netMargin}`);
    lines.push(`Revenue Growth YoY: ${f.revenueGrowthYoY}`);
    lines.push(`Health Score: ${f.healthScore.score}/100 (${f.healthScore.label})`);
    lines.push(``);
  }

  // Market evidence
  if (m) {
    lines.push(`── MARKET AGENT EVIDENCE ──`);
    lines.push(`Trend: ${m.trend} | RSI: ${m.rsi ?? "N/A"} | Beta: ${m.beta}`);
    lines.push(`50-Day MA: $${m.movingAverage50d} | 200-Day MA: $${m.movingAverage200d}`);
    lines.push(`52-Week: $${m.fiftyTwoWeekLow} – $${m.fiftyTwoWeekHigh}`);
    lines.push(`Support: $${m.support} | Resistance: $${m.resistance}`);
    lines.push(``);
  }

  // News evidence
  if (ns) {
    lines.push(`── NEWS AGENT EVIDENCE ──`);
    lines.push(`Sentiment: ${ns.overallSentiment.toUpperCase()}`);
    lines.push(`Distribution: +${ns.positiveCount} / -${ns.negativeCount} / ~${ns.neutralCount}`);
    if (ns.catalysts.length > 0) lines.push(`Catalysts: ${ns.catalysts.join("; ")}`);
    if (ns.risks.length > 0) lines.push(`News Risks: ${ns.risks.join("; ")}`);
    lines.push(``);
  }

  // Risk evidence
  if (rs) {
    lines.push(`── RISK AGENT EVIDENCE ──`);
    lines.push(`Overall Risk: ${rs.overallScore}/100 (${rs.level})`);
    lines.push(`Reasons: ${rs.reasons.join("; ")}`);
    lines.push(``);
  }

  // Thesis evidence
  if (th) {
    lines.push(`── REASONING AGENT EVIDENCE ──`);
    lines.push(`Thesis: ${th.thesis}`);
    lines.push(`Strengths: ${th.strengths.join("; ")}`);
    lines.push(`Weaknesses: ${th.weaknesses.join("; ")}`);
    lines.push(`Growth Drivers: ${th.growthDrivers.join("; ")}`);
    lines.push(`Threats: ${th.threats.join("; ")}`);
    lines.push(``);
  }

  // Decision evidence
  if (d) {
    lines.push(`── DECISION AGENT OUTPUT ──`);
    lines.push(`Rationale: ${d.rationale}`);
    lines.push(`Expected Return: ${d.expectedReturnNarrative}`);
  }

  return lines.join("\n");
}

// ─── LLM-powered Explainability ───────────────────────────────────────────────

async function llmExplainability(
  state: ResearchGraphState
): Promise<ExplainabilityTrace | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const { ChatOpenAI } = await import("@langchain/openai");

    const llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.1, // Very low — we want factual, traceable output
      openAIApiKey: apiKey,
    });

    const structured = llm.withStructuredOutput(explainabilityTraceSchema, {
      name: "explainability_trace",
    });

    const dossier = buildEvidenceDossier(state);

    const systemPrompt = [
      "You are an investment research auditor at a compliance-focused fund.",
      "Your task: create a transparent, evidence-based decision trace.",
      "",
      "For each step in the decision tree:",
      "• CLAIM: A factual statement that influenced the investment verdict.",
      "• EVIDENCE: The specific data point, metric, or score that supports the claim.",
      "• SOURCE: Which agent stage produced this evidence (company, financial, market, news, risk, or reasoning).",
      "",
      "The decision tree must:",
      "1. Cover all 6 agent sources (at least one step per source).",
      "2. Flow logically from foundational data → analysis → final verdict.",
      "3. Reference REAL numbers from the evidence dossier. Do NOT fabricate metrics.",
      "",
      "The executive summary must:",
      "1. State the verdict and confidence level.",
      "2. Reference 2-3 key evidence points by specific number.",
      "3. Be readable in 30 seconds by a senior portfolio manager.",
      "",
      "Be precise. Be factual. Every claim must be traceable to the dossier.",
    ].join("\n");

    const result = await structured.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: dossier },
    ]);

    return result as ExplainabilityTrace;
  } catch (err) {
    console.error("[ExplainabilityAgent] LLM path failed, falling back to deterministic:", err);
    return null;
  }
}

// ─── Deterministic Explainability ─────────────────────────────────────────────

/**
 * Constructs a data-driven explainability trace from all upstream outputs.
 * Each step cites a real metric from the pipeline.
 */
function deterministicExplainability(state: ResearchGraphState): ExplainabilityTrace {
  const p = state.profile;
  const f = state.financials;
  const m = state.marketData;
  const ns = state.newsSentiment;
  const rs = state.riskSummary;
  const th = state.investmentThesis;
  const d = state.decision;

  const steps: ExplainabilityStep[] = [];
  let stepId = 1;

  // ── Company ───────────────────────────────────────────────────────────────

  if (p) {
    steps.push({
      id: `E${stepId++}`,
      claim: `${p.name} operates in the ${p.sector} sector (${p.industry}).`,
      evidence: `Market capitalization of ${p.marketCap} with ${p.employees} employees.`,
      source: "company",
    });
  }

  // ── Financial ─────────────────────────────────────────────────────────────

  if (f) {
    steps.push({
      id: `E${stepId++}`,
      claim: `Financial health is rated ${f.healthScore.label} with a score of ${f.healthScore.score}/100.`,
      evidence: `Revenue: ${f.revenue}, Net Margin: ${f.netMargin}, ROE: ${f.roe}%, D/E: ${f.debtToEquity}.`,
      source: "financial",
    });

    // Valuation step
    steps.push({
      id: `E${stepId++}`,
      claim: f.peRatio > 0 && f.peRatio < 20
        ? `Valuation appears reasonable with a P/E of ${f.peRatio}.`
        : f.peRatio >= 20
          ? `Valuation is stretched with a P/E of ${f.peRatio}.`
          : `Valuation metrics are limited (P/E: ${f.peRatio}).`,
      evidence: `P/E: ${f.peRatio}, EPS: $${f.eps}, Revenue Growth: ${f.revenueGrowthYoY}.`,
      source: "financial",
    });
  }

  // ── Market ────────────────────────────────────────────────────────────────

  if (m) {
    steps.push({
      id: `E${stepId++}`,
      claim: `Market trend is ${m.trend} with ${m.rsi != null ? (m.rsi > 70 ? "overbought" : m.rsi < 30 ? "oversold" : "neutral") : "unknown"} RSI conditions.`,
      evidence: `RSI: ${m.rsi ?? "N/A"}, 50-Day MA: $${m.movingAverage50d}, 200-Day MA: $${m.movingAverage200d}, Beta: ${m.beta}.`,
      source: "market",
    });
  }

  // ── News ──────────────────────────────────────────────────────────────────

  if (ns) {
    const total = ns.positiveCount + ns.negativeCount + ns.neutralCount;
    steps.push({
      id: `E${stepId++}`,
      claim: `News sentiment is ${ns.overallSentiment} across ${total} analyzed articles.`,
      evidence: `Positive: ${ns.positiveCount}, Negative: ${ns.negativeCount}, Neutral: ${ns.neutralCount}.${ns.catalysts.length > 0 ? ` Key catalyst: ${ns.catalysts[0]}.` : ""}`,
      source: "news",
    });
  }

  // ── Risk ──────────────────────────────────────────────────────────────────

  if (rs) {
    steps.push({
      id: `E${stepId++}`,
      claim: `Overall risk is ${rs.level} with a composite score of ${rs.overallScore}/100.`,
      evidence: `Primary risk factors: ${rs.reasons.slice(0, 2).join("; ")}.`,
      source: "risk",
    });
  }

  // ── Reasoning ─────────────────────────────────────────────────────────────

  if (th) {
    steps.push({
      id: `E${stepId++}`,
      claim: th.strengths.length >= th.weaknesses.length
        ? `Thesis is net positive with ${th.strengths.length} strengths vs ${th.weaknesses.length} weaknesses.`
        : `Thesis is net cautious with ${th.weaknesses.length} weaknesses vs ${th.strengths.length} strengths.`,
      evidence: `Top strength: ${th.strengths[0] ?? "N/A"}. Top weakness: ${th.weaknesses[0] ?? "N/A"}.`,
      source: "reasoning",
    });
  }

  // ── Conclusion step (always present) ──────────────────────────────────────

  steps.push({
    id: `E${stepId}`,
    claim: `Final verdict: ${d?.verdict ?? "N/A"} with ${d?.confidence ?? "N/A"}% confidence (${d?.investmentHorizon ?? "N/A"} horizon).`,
    evidence: d?.rationale ?? "Automated decision based on composite scoring model.",
    source: "reasoning",
  });

  // ── Executive Summary ─────────────────────────────────────────────────────

  const executiveSummary = buildExecutiveSummary(state);

  return { decisionTree: steps, executiveSummary };
}

// ─── Executive Summary Builder ────────────────────────────────────────────────

function buildExecutiveSummary(state: ResearchGraphState): string {
  const p = state.profile;
  const f = state.financials;
  const d = state.decision;
  const rs = state.riskSummary;
  const m = state.marketData;

  const ticker = state.ticker;
  const name = p?.name ?? ticker;

  const parts: string[] = [];

  // Sentence 1: Verdict
  parts.push(
    `${name} (${ticker}) receives a ${d?.verdict ?? "N/A"} verdict with ${d?.confidence ?? "N/A"}% confidence on a ${d?.investmentHorizon?.toLowerCase() ?? "medium-term"} horizon.`
  );

  // Sentence 2: Financial anchor
  if (f) {
    parts.push(
      `Financial health scores ${f.healthScore.score}/100 (${f.healthScore.label}), driven by ${f.netMargin} net margins and ${f.revenueGrowthYoY} revenue growth.`
    );
  }

  // Sentence 3: Risk + market context
  if (rs && m) {
    parts.push(
      `Risk is ${rs.level.toLowerCase()} at ${rs.overallScore}/100, with a ${m.trend.toLowerCase()} market trend (RSI: ${m.rsi ?? "N/A"}).`
    );
  } else if (rs) {
    parts.push(`Risk is ${rs.level.toLowerCase()} at ${rs.overallScore}/100.`);
  }

  // Sentence 4: Forward-looking
  if (d) {
    parts.push(d.expectedReturnNarrative);
  }

  return parts.join(" ");
}

// ─── Agent Entry Point ────────────────────────────────────────────────────────

/**
 * Explainability Agent — Milestone 12
 *
 * Single responsibility: construct a transparent decision trace where every
 * claim references evidence collected by a prior agent, plus a 30-second
 * executive summary for portfolio managers.
 *
 * Execution paths:
 *   1. OPENAI_API_KEY present → LLM structured output (GPT-4o-mini)
 *   2. No API key or LLM failure → Deterministic evidence extraction
 *
 * Output written to state:
 *   - explainability (ExplainabilityTrace)
 *   - pipeline       (explainability step → complete)
 */
export async function explainabilityAgent(
  state: ResearchGraphState
): Promise<Partial<ResearchGraphState>> {
  console.log(`[ExplainabilityAgent] Building decision trace for: ${state.ticker}`);

  // ── Try LLM path first ──────────────────────────────────────────────────

  let trace = await llmExplainability(state);

  // ── Fallback to deterministic ───────────────────────────────────────────

  if (!trace) {
    console.log("[ExplainabilityAgent] Using deterministic trace builder.");
    trace = deterministicExplainability(state);
  }

  console.log(
    `[ExplainabilityAgent] Trace complete: ${trace.decisionTree.length} evidence steps, ` +
    `${trace.executiveSummary.length}-char summary.`
  );

  // ── Pipeline update ─────────────────────────────────────────────────────

  const completePipeline: PipelineStep[] = state.pipeline.map((step) =>
    step.id === "explainability"
      ? { ...step, status: "complete" as const, description: `${trace!.decisionTree.length} evidence steps traced` }
      : step
  );

  return {
    explainability: trace,
    pipeline: completePipeline,
  };
}
