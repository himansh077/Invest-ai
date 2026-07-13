/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { yahooFinance } from "@/lib/yahooFinance";
import type { ResearchGraphState } from "../state";
import type {
  NewsItem,
  NewsSentimentSummary,
  SentimentLabel,
} from "@/types/research";

// ─── Zod Schema — LLM must return this exact shape ───────────────────────────

/**
 * The schema enforced on every LLM response.
 * Using .withStructuredOutput() guarantees the model cannot return free-form text.
 */
const newsAnalysisSchema = z.object({
  headlines: z
    .array(
      z.object({
        /** One-sentence summary written by the LLM (≤ 120 chars) */
        summary: z.string().max(200),
        /** Sentiment classification for this headline */
        sentiment: z.enum(["positive", "negative", "neutral"]),
      })
    )
    .describe("Analysis for each headline, in the same order as the input."),

  /** Overall aggregate sentiment across all headlines */
  overallSentiment: z.enum(["positive", "negative", "neutral"]),

  /** Key positive drivers or upcoming catalysts (max 4 bullet points) */
  catalysts: z.array(z.string().max(120)).max(4),

  /** Key risks, concerns, or negative narratives (max 4 bullet points) */
  risks: z.array(z.string().max(120)).max(4),
});

type NewsAnalysis = z.infer<typeof newsAnalysisSchema>;

// ─── Keyword-based Fallback Sentiment ────────────────────────────────────────

const POSITIVE_KEYWORDS = [
  "surge", "beat", "record", "upgrade", "buy", "growth", "profit", "rally",
  "gain", "expand", "partnership", "innovative", "breakthrough", "raises",
  "outperform", "strong", "new high", "acquisition", "milestone", "revenue",
];

const NEGATIVE_KEYWORDS = [
  "miss", "fall", "drop", "decline", "layoff", "lawsuit", "fine", "penalty",
  "probe", "investigation", "downgrade", "sell", "loss", "cut", "warning",
  "recall", "scandal", "breach", "bankruptcy", "sue", "antitrust",
];

function keywordSentiment(title: string): SentimentLabel {
  const lower = title.toLowerCase();
  const pos = POSITIVE_KEYWORDS.filter((kw) => lower.includes(kw)).length;
  const neg = NEGATIVE_KEYWORDS.filter((kw) => lower.includes(kw)).length;
  if (pos > neg) return "positive";
  if (neg > pos) return "negative";
  return "neutral";
}

/**
 * Rule-based fallback when OpenAI API key is unavailable.
 * Scores each headline by keyword matching and derives catalysts/risks
 * from the top positive/negative headlines.
 */
function ruleBased(rawNews: Array<{ title: string; publisher: string; link: string; date: string }>): NewsAnalysis {
  const analyzed = rawNews.map((n) => ({
    summary: n.title,
    sentiment: keywordSentiment(n.title) as "positive" | "negative" | "neutral",
  }));

  const posCount = analyzed.filter((a) => a.sentiment === "positive").length;
  const negCount = analyzed.filter((a) => a.sentiment === "negative").length;

  const overallSentiment: "positive" | "negative" | "neutral" =
    posCount > negCount ? "positive" : negCount > posCount ? "negative" : "neutral";

  const catalysts = rawNews
    .filter((n) => keywordSentiment(n.title) === "positive")
    .slice(0, 3)
    .map((n) => n.title);

  const risks = rawNews
    .filter((n) => keywordSentiment(n.title) === "negative")
    .slice(0, 3)
    .map((n) => n.title);

  return { headlines: analyzed, overallSentiment, catalysts, risks };
}

// ─── LLM Analysis ─────────────────────────────────────────────────────────────

/**
 * Sends headlines to OpenAI for structured sentiment analysis.
 * Uses .withStructuredOutput() so the response is validated against
 * newsAnalysisSchema — no free-form text ever reaches the state.
 */
async function llmAnalyze(
  headlines: Array<{ title: string; publisher: string; date: string }>,
  ticker: string,
  companyName: string
): Promise<NewsAnalysis> {
  // Lazy import — only loads when API key is present
  const { ChatOpenAI } = await import("@langchain/openai");

  const model = new ChatOpenAI({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0,  // deterministic output
    apiKey: process.env.OPENAI_API_KEY,
  }).withStructuredOutput(newsAnalysisSchema);

  const headlineList = headlines
    .map((h, i) => `${i + 1}. [${h.publisher}] ${h.title}`)
    .join("\n");

  const result = await model.invoke([
    {
      role: "system",
      content:
        `You are a senior equity research analyst. You will be given news headlines about ${companyName} (${ticker}). ` +
        `Classify each headline's sentiment as positive, negative, or neutral from an investment perspective. ` +
        `Identify the top catalysts (positive drivers) and risks. ` +
        `Be concise and evidence-based. Never speculate beyond the headlines provided.`,
    },
    {
      role: "user",
      content: `Analyze these ${headlines.length} headlines:\n\n${headlineList}`,
    },
  ]);

  return result as NewsAnalysis;
}

// ─── News Fetch ───────────────────────────────────────────────────────────────

/**
 * Fetches up to 10 news items using Yahoo Finance search.
 * Uses the company name for better relevance than the ticker alone.
 */
async function fetchNewsItems(ticker: string, companyName: string) {
  const query = companyName !== ticker ? companyName : ticker;

  const result = await yahooFinance.search(
    query,
    { newsCount: 10, quotesCount: 0 },
    { validateResult: false }
  ) as any;

  return (result?.news ?? []) as Array<{
    title: string;
    link: string;
    publisher: string;
    providerPublishTime: number;
    type: string;
  }>;
}

// ─── News Agent Node ──────────────────────────────────────────────────────────

/**
 * News Agent — Node 4 of the Invest AI pipeline.
 *
 * Single responsibility: fetch fresh news headlines and return a
 * structured NewsSentimentSummary with per-headline sentiment scores,
 * aggregate catalysts, and risk narratives.
 *
 * LLM path  (when OPENAI_API_KEY is set):
 *   Headlines → ChatOpenAI (gpt-4o-mini) → Zod-validated NewsAnalysis
 *
 * Fallback path (when API key is absent):
 *   Headlines → keyword scoring → deterministic NewsAnalysis
 *
 * Both paths produce the same output shape — the downstream agents
 * cannot tell which path was taken.
 *
 * Outputs written to state:
 *   - newsSentiment   (rich structured summary)
 *   - news            (flat NewsItem[] for legacy UI)
 *   - pipeline        (news step → complete)
 */
export async function newsAgent(
  state: ResearchGraphState
): Promise<Partial<ResearchGraphState>> {
  const ticker = state.ticker;
  const companyName = state.profile?.name ?? ticker;
  console.log(`[NewsAgent] Fetching news for: ${companyName} (${ticker})`);

  const processingPipeline = state.pipeline.map((step) =>
    step.id === "news" ? { ...step, status: "processing" as const } : step
  );

  // ── 1. Fetch raw headlines ────────────────────────────────────────────────
  const rawNews = await fetchNewsItems(ticker, companyName);

  if (rawNews.length === 0) {
    console.log(`[NewsAgent] No news found for ${ticker}`);
    const completePipeline = processingPipeline.map((step) =>
      step.id === "news"
        ? { ...step, status: "complete" as const, description: "No news articles found." }
        : step
    );
    return { news: [], newsSentiment: null, pipeline: completePipeline };
  }

  // Normalise dates
  const headlineInputs = rawNews.map((n) => ({
    title: n.title,
    publisher: n.publisher,
    link: n.link ?? "#",
    date: n.providerPublishTime
      ? new Date(n.providerPublishTime * 1000).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  }));

  // ── 2. Sentiment analysis — LLM or rule-based ────────────────────────────
  const hasApiKey = Boolean(process.env.OPENAI_API_KEY?.trim());
  let analysis: NewsAnalysis;

  if (hasApiKey) {
    try {
      console.log(`[NewsAgent] Running LLM sentiment analysis (${process.env.OPENAI_MODEL ?? "gpt-4o-mini"})...`);
      analysis = await llmAnalyze(headlineInputs, ticker, companyName);
    } catch (err: unknown) {
      console.warn(`[NewsAgent] LLM failed (${(err instanceof Error ? err.message : String(err))}), falling back to keyword scoring`);
      analysis = ruleBased(headlineInputs);
    }
  } else {
    console.log("[NewsAgent] No OPENAI_API_KEY — using keyword-based sentiment.");
    analysis = ruleBased(headlineInputs);
  }

  // ── 3. Build typed NewsItem[] ─────────────────────────────────────────────
  const newsItems: NewsItem[] = headlineInputs.map((h, i) => ({
    id: i + 1,
    title: h.title,
    url: h.link,
    date: h.date,
    source: h.publisher,
    sentiment: (analysis.headlines[i]?.sentiment ?? "neutral") as SentimentLabel,
    summary: analysis.headlines[i]?.summary ?? h.title,
  }));

  // ── 4. Count sentiments ───────────────────────────────────────────────────
  const positiveCount = newsItems.filter((n) => n.sentiment === "positive").length;
  const negativeCount = newsItems.filter((n) => n.sentiment === "negative").length;
  const neutralCount  = newsItems.filter((n) => n.sentiment === "neutral").length;

  // ── 5. Build NewsSentimentSummary ─────────────────────────────────────────
  const newsSentiment: NewsSentimentSummary = {
    overallSentiment: analysis.overallSentiment,
    positiveCount,
    negativeCount,
    neutralCount,
    catalysts: analysis.catalysts,
    risks: analysis.risks,
    topHeadlines: newsItems,
  };

  const method = hasApiKey ? "LLM" : "keyword";
  console.log(
    `[NewsAgent] ✓ ${newsItems.length} headlines | Overall: ${analysis.overallSentiment} | ` +
    `+${positiveCount} -${negativeCount} ~${neutralCount} | Method: ${method}`
  );

  const completePipeline = processingPipeline.map((step) =>
    step.id === "news"
      ? {
          ...step,
          status: "complete" as const,
          description: `${newsItems.length} headlines · ${analysis.overallSentiment} sentiment · ${analysis.catalysts.length} catalysts`,
        }
      : step
  );

  return {
    news: newsItems,
    newsSentiment,
    pipeline: completePipeline,
  };
}
