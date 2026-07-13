import { Annotation } from "@langchain/langgraph";
import type {
  CompanyProfile,
  Financials,
  MarketData,
  PricePoint,
  NewsSentimentSummary,
  NewsItem,
  RiskSummary,
  Risk,
  InvestmentThesis,
  InvestmentDecision,
  ExplainabilityTrace,
  Recommendation,
  PipelineStep,
} from "@/types/research";

/**
 * The shared state object that flows through every agent node in the pipeline.
 *
 * Design rationale: a single flat annotation object (no nesting) ensures every
 * agent can read from and write to the same state without deep-merge conflicts.
 * Each field uses `reducer: (_, next) => next` so the most recent write wins.
 */
export const ResearchAnnotation = Annotation.Root({
  // ── Input ────────────────────────────────────────────────────────────────

  /** The raw user query — either a ticker (AAPL) or a company name (Apple) */
  ticker: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),

  // ── Company Agent output ─────────────────────────────────────────────────

  profile: Annotation<CompanyProfile | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  // ── Financial Agent output ───────────────────────────────────────────────

  financials: Annotation<Financials | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  // ── Market Agent output ──────────────────────────────────────────────────

  marketData: Annotation<MarketData | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  priceHistory: Annotation<PricePoint[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),

  // ── News Agent output ────────────────────────────────────────────────────

  newsSentiment: Annotation<NewsSentimentSummary | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  /** Raw news items — kept for legacy UI rendering */
  news: Annotation<NewsItem[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),

  // ── Risk Agent output ────────────────────────────────────────────────────

  riskSummary: Annotation<RiskSummary | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  /** Raw risk items — kept for legacy UI rendering */
  risks: Annotation<Risk[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),

  // ── Reasoning Agent output ───────────────────────────────────────────────

  investmentThesis: Annotation<InvestmentThesis | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  // ── Decision Agent output ────────────────────────────────────────────────

  decision: Annotation<InvestmentDecision | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  /** Legacy compat — derived from decision in pipeline mapping */
  recommendation: Annotation<Recommendation | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  // ── Explainability Agent output ──────────────────────────────────────────

  explainability: Annotation<ExplainabilityTrace | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  // ── Pipeline tracker ─────────────────────────────────────────────────────

  pipeline: Annotation<PipelineStep[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
});

export type ResearchGraphState = typeof ResearchAnnotation.State;
