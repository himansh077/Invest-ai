import { z } from "zod";
import type { ResearchGraphState } from "../state";
import type { InvestmentThesis } from "@/types/research";

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const investmentThesisSchema = z.object({
  thesis: z
    .string()
    .max(400)
    .describe(
      "A single, cohesive investment thesis paragraph that synthesizes the company's " +
      "financial health, market position, and risk profile (2-3 sentences, ≤400 chars)."
    ),

  strengths: z
    .array(z.string().max(130))
    .min(2)
    .max(4)
    .describe("Specific, evidence-based competitive or financial strengths."),

  weaknesses: z
    .array(z.string().max(130))
    .min(2)
    .max(4)
    .describe("Specific, evidence-based weaknesses or areas of underperformance."),

  growthDrivers: z
    .array(z.string().max(130))
    .min(2)
    .max(4)
    .describe("Specific upcoming catalysts or secular tailwinds that could drive outperformance."),

  threats: z
    .array(z.string().max(130))
    .min(2)
    .max(4)
    .describe("Specific macro, competitive, or regulatory threats to the investment case."),
});

// ─── Context Builder ──────────────────────────────────────────────────────────

/**
 * Compresses all upstream agent outputs into a concise analyst brief.
 *
 * Design principle: give the LLM enough signal to reason, not raw dumps.
 * Target: ~600–800 tokens of dense, structured context.
 */
function buildAnalystBrief(state: ResearchGraphState): string {
  const p  = state.profile;
  const f  = state.financials;
  const m  = state.marketData;
  const ns = state.newsSentiment;
  const rs = state.riskSummary;

  const lines: string[] = [
    `COMPANY: ${p?.name ?? state.ticker} (${state.ticker})`,
    `SECTOR: ${p?.sector ?? "N/A"} | INDUSTRY: ${p?.industry ?? "N/A"}`,
    `EMPLOYEES: ${p?.employees?.toLocaleString() ?? "N/A"} | MARKET CAP: ${p?.marketCap ?? "N/A"}`,
    ``,
    `BUSINESS: ${(p?.description ?? "No description available.").slice(0, 300)}`,
    ``,
    `── FINANCIAL PROFILE ────────────────────────────`,
    `Revenue: ${f?.revenue ?? "N/A"} | Net Income: ${f?.netIncome ?? "N/A"} | FCF: ${f?.freeCashFlow ?? "N/A"}`,
    `Operating Margin: ${f?.operatingMargin ?? "N/A"} | Net Margin: ${f?.netMargin ?? "N/A"}`,
    `ROE: ${f?.roe ?? "N/A"}% | ROA: ${f?.roa ?? "N/A"}% | Debt/Equity: ${f?.debtToEquity ?? "N/A"}x`,
    `Revenue Growth YoY: ${f?.revenueGrowthYoY ?? "N/A"}`,
    `Financial Health Score: ${f?.healthScore?.score ?? "N/A"}/100 (${f?.healthScore?.label ?? "N/A"})`,
    `Health Reasoning: ${f?.healthScore?.reasoning ?? "N/A"}`,
    ``,
    `── MARKET SIGNALS ───────────────────────────────`,
    `Price: $${m?.currentPrice ?? "N/A"} | P/E: ${f?.peRatio ?? "N/A"}x | EPS: $${f?.eps ?? "N/A"}`,
    `52W Range: $${m?.fiftyTwoWeekLow ?? "N/A"} – $${m?.fiftyTwoWeekHigh ?? "N/A"}`,
    `MA50: $${m?.movingAverage50d ?? "N/A"} | MA200: $${m?.movingAverage200d ?? "N/A"}`,
    `RSI (14): ${m?.rsi ?? "N/A"} | Beta: ${m?.beta ?? "N/A"} | Trend: ${m?.trend ?? "N/A"}`,
    `Support: $${m?.support ?? "N/A"} | Resistance: $${m?.resistance ?? "N/A"}`,
    ``,
    `── NEWS & SENTIMENT ────────────────────────────`,
    `Overall Sentiment: ${ns?.overallSentiment ?? "N/A"} (+${ns?.positiveCount ?? 0}/-${ns?.negativeCount ?? 0}/~${ns?.neutralCount ?? 0})`,
    `Catalysts: ${ns?.catalysts?.join(" | ") || "None identified"}`,
    `News Risks: ${ns?.risks?.join(" | ") || "None identified"}`,
    ``,
    `── RISK PROFILE ─────────────────────────────────`,
    `Overall Risk Score: ${rs?.overallScore ?? "N/A"}/100 (${rs?.level ?? "N/A"})`,
    `Key Risk Factors: ${rs?.reasons?.join(" | ") || "N/A"}`,
  ];

  return lines.join("\n");
}

// ─── Deterministic Fallback ───────────────────────────────────────────────────

/**
 * Generates an InvestmentThesis from quantitative signals when no API key is set.
 * Uses template logic — deterministic given the same input state.
 */
function deterministicThesis(state: ResearchGraphState): InvestmentThesis {
  const p  = state.profile;
  const f  = state.financials;
  const m  = state.marketData;
  const rs = state.riskSummary;
  const ns = state.newsSentiment;

  const company = p?.name ?? state.ticker;
  const ticker  = state.ticker;
  const health  = f?.healthScore?.label ?? "Fair";
  const score   = f?.healthScore?.score ?? 50;
  const trend   = m?.trend ?? "Neutral";
  const riskLevel = rs?.level ?? "Moderate";

  const thesis =
    `${company} (${ticker}) demonstrates ${health.toLowerCase()} financial health with a score of ${score}/100. ` +
    `The stock is in a ${trend.toLowerCase()} technical trend with ${riskLevel.toLowerCase()} overall risk. ` +
    `Key financial drivers include ${f?.operatingMargin ?? "N/A"} operating margins and ${f?.revenueGrowthYoY ?? "N/A"} revenue growth.`;

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const growthDrivers: string[] = [];
  const threats: string[] = [];

  // Derive strengths from positive signals
  if (score >= 70)
    strengths.push(`Strong financial health score of ${score}/100 reflecting solid fundamentals.`);
  if (m?.trend === "Bullish")
    strengths.push(`Bullish market trend — price above both 50D and 200D moving averages.`);
  const opMarginNum = parseFloat((f?.operatingMargin ?? "0").replace("%", ""));
  if (!isNaN(opMarginNum) && opMarginNum >= 20)
    strengths.push(`Exceptional operating margin of ${f!.operatingMargin} signals strong pricing power.`);
  const roeNum = f?.roe ?? 0;
  if (roeNum >= 15)
    strengths.push(`ROE of ${roeNum}% demonstrates effective capital deployment for shareholders.`);
  const growthNum = parseFloat((f?.revenueGrowthYoY ?? "0").replace("+", "").replace("%", ""));
  if (!isNaN(growthNum) && growthNum >= 10)
    growthDrivers.push(`Revenue growing at ${f!.revenueGrowthYoY} YoY — strong top-line momentum.`);

  // Derive weaknesses from negative signals
  if (score < 50)
    weaknesses.push(`Below-average financial health score of ${score}/100 warrants caution.`);
  if (!isNaN(opMarginNum) && opMarginNum < 10)
    weaknesses.push(`Thin operating margin of ${f!.operatingMargin} leaves limited buffer against cost inflation.`);
  const de = f?.debtToEquity ?? 0;
  if (de > 1.5)
    weaknesses.push(`Elevated debt/equity of ${de}x constrains financial flexibility.`);
  if (!isNaN(growthNum) && growthNum < 0)
    weaknesses.push(`Revenue contracting ${f!.revenueGrowthYoY} YoY raises structural growth concerns.`);
  if (m?.trend === "Bearish")
    weaknesses.push("Bearish market trend — price below both moving averages signals ongoing selling pressure.");

  // Add catalyst-based growth drivers
  if (ns?.catalysts && ns.catalysts.length > 0)
    growthDrivers.push(...ns.catalysts.slice(0, 2));
  if (p?.sector)
    growthDrivers.push(`Secular tailwinds in the ${p.sector} sector support long-term opportunity.`);

  // Derive threats from risk summary
  if (rs?.reasons && rs.reasons.length > 0)
    threats.push(...rs.reasons.slice(0, 2));
  if (ns?.risks && ns.risks.length > 0)
    threats.push(...ns.risks.slice(0, 1));
  if (m?.beta && m.beta > 1.5)
    threats.push(`Beta of ${m.beta} implies significant drawdown risk in broad market selloffs.`);

  // Ensure minimum 2 items per array
  if (strengths.length < 2)
    strengths.push(`${company} operates in the ${p?.sector ?? "technology"} sector with established market presence.`);
  if (weaknesses.length < 2)
    weaknesses.push("Monitor execution risk as market conditions evolve.");
  if (growthDrivers.length < 2)
    growthDrivers.push("Potential for margin expansion and operational leverage as scale increases.");
  if (threats.length < 2)
    threats.push("Macro uncertainty and interest rate sensitivity remain systemic risks.");

  return {
    thesis,
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
    growthDrivers: growthDrivers.slice(0, 4),
    threats: threats.slice(0, 4),
  };
}

// ─── LLM Synthesis ────────────────────────────────────────────────────────────

/**
 * Uses ChatOpenAI with structured output to generate the Investment Thesis.
 *
 * The system prompt frames the LLM as a Goldman Sachs equity research analyst
 * producing a peer-reviewed research note. This forces specificity and
 * prevents the LLM from producing generic platitudes.
 */
async function llmSynthesize(
  brief: string,
  company: string,
  ticker: string
): Promise<InvestmentThesis> {
  const { ChatOpenAI } = await import("@langchain/openai");

  const model = new ChatOpenAI({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.1, // slight creativity for thesis prose, not scores
    apiKey: process.env.OPENAI_API_KEY,
  }).withStructuredOutput(investmentThesisSchema);

  const result = await model.invoke([
    {
      role: "system",
      content:
        `You are a senior equity research analyst at a top-tier investment bank. ` +
        `You write precise, evidence-based investment research notes. ` +
        `Every claim you make must be directly traceable to the data provided. ` +
        `Avoid generic statements like "the company has strong fundamentals" — be specific: ` +
        `use exact numbers, reference specific metrics, name the company. ` +
        `Do NOT speculate beyond the data. Do NOT hallucinate figures.`,
    },
    {
      role: "user",
      content:
        `Produce a structured Investment Thesis for ${company} (${ticker}) ` +
        `based on the following analyst brief:\n\n${brief}`,
    },
  ]);

  return result as InvestmentThesis;
}

// ─── Reasoning Agent Node ─────────────────────────────────────────────────────

/**
 * Reasoning Agent — Node 6 of the Invest AI pipeline.
 *
 * The first truly generative node: synthesizes ALL upstream quantitative outputs
 * into a coherent, human-readable Investment Thesis.
 *
 * Data consumed (read-only):
 *   - profile        (company background, sector)
 *   - financials     (revenue, margins, health score)
 *   - marketData     (price, trend, RSI, MAs)
 *   - newsSentiment  (catalysts, risks, sentiment)
 *   - riskSummary    (score, level, top risks)
 *
 * Process:
 *   1. Build compressed analyst brief (~700 tokens)
 *   2. LLM synthesizes → InvestmentThesis (if API key present)
 *   3. Deterministic fallback → InvestmentThesis (if no API key)
 *
 * Output written to state:
 *   - investmentThesis (InvestmentThesis)
 *   - pipeline    (reasoning step → complete)
 */
export async function reasoningAgent(
  state: ResearchGraphState
): Promise<Partial<ResearchGraphState>> {
  const ticker      = state.ticker;
  const companyName = state.profile?.name ?? ticker;
  console.log(`[ReasoningAgent] Synthesizing investment thesis for: ${companyName} (${ticker})`);

  const processingPipeline = state.pipeline.map((step) =>
    step.id === "reasoning" ? { ...step, status: "processing" as const } : step
  );

  // ── 1. Build context brief ────────────────────────────────────────────────
  const brief = buildAnalystBrief(state);

  // ── 2. Generate thesis — LLM or deterministic ─────────────────────────────
  const hasApiKey = Boolean(process.env.OPENAI_API_KEY?.trim());
  let reasoning: InvestmentThesis;

  if (hasApiKey) {
    try {
      console.log("[ReasoningAgent] Running LLM synthesis...");
      reasoning = await llmSynthesize(brief, companyName, ticker);
    } catch (err: unknown) {
      console.warn(`[ReasoningAgent] LLM failed (${(err instanceof Error ? err.message : String(err))}), falling back to deterministic.`);
      reasoning = deterministicThesis(state);
    }
  } else {
    console.log("[ReasoningAgent] No OPENAI_API_KEY — using deterministic thesis.");
    reasoning = deterministicThesis(state);
  }

  const method = hasApiKey ? "LLM" : "deterministic";
  console.log(
    `[ReasoningAgent] ✓ ${ticker} | ${reasoning.strengths.length} strengths | ` +
    `${reasoning.weaknesses.length} weaknesses | ${reasoning.growthDrivers.length} growth drivers | ` +
    `${reasoning.threats.length} threats | Method: ${method}`
  );

  const completePipeline = processingPipeline.map((step) =>
    step.id === "reasoning"
      ? {
          ...step,
          status: "complete" as const,
          description: `Investment thesis generated · ${reasoning.strengths.length + reasoning.weaknesses.length} key factors`,
        }
      : step
  );

  return {
    investmentThesis: reasoning,
    pipeline: completePipeline,
  };
}
