// ─── Company Agent ────────────────────────────────────────────────────────────

export interface Competitor {
  name: string;
  ticker: string;
  marketCap: string;
}

export interface CompanyProfile {
  name: string;
  ticker: string;
  sector: string;
  industry: string;
  description: string;
  marketCap: string;
  employees: string;
  price: number;
  change: number;
  changePercent: number;
  ceo: string;
  founded: string;
  website: string;
  country: string;
  competitors: Competitor[];
}

// ─── Financial Agent ──────────────────────────────────────────────────────────

export interface FinancialHealthScore {
  score: number; // 0–100
  label: "Excellent" | "Good" | "Fair" | "Poor";
  reasoning: string;
}

export interface Financials {
  revenue: string;
  netIncome: string;
  operatingIncome: string;
  peRatio: number;
  eps: number;
  roe: number;
  roa: number;
  debtToEquity: number;
  freeCashFlow: string;
  operatingMargin: string;
  netMargin: string;
  revenueGrowthYoY: string;
  healthScore: FinancialHealthScore;
}

// ─── Market Agent ─────────────────────────────────────────────────────────────

export interface MarketData {
  currentPrice: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  movingAverage50d: number;
  movingAverage200d: number;
  rsi: number | null;
  volume: string;
  avgVolume: string;
  beta: number;
  trend: "Bullish" | "Bearish" | "Neutral";
  support: number;
  resistance: number;
}

export interface PricePoint {
  date: string;
  price: number;
}

// ─── News Agent ───────────────────────────────────────────────────────────────

export type SentimentLabel = "positive" | "negative" | "neutral";

export interface NewsItem {
  id: number;
  title: string;
  url: string;
  date: string;
  source: string;
  sentiment: SentimentLabel;
  summary: string;
}

export interface NewsSentimentSummary {
  overallSentiment: SentimentLabel;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  catalysts: string[];
  risks: string[];
  topHeadlines: NewsItem[];
}

// ─── Risk Agent ───────────────────────────────────────────────────────────────

export type RiskSeverity = "low" | "medium" | "high" | "critical";
export type RiskCategory =
  | "Business"
  | "Financial"
  | "Market"
  | "Macro"
  | "Governance";

export interface Risk {
  id: number;
  title: string;
  description: string;
  severity: RiskSeverity;
  category: RiskCategory;
}

export interface RiskSummary {
  overallScore: number; // 0–100, higher = riskier
  level: "Low" | "Moderate" | "High" | "Critical";
  reasons: string[];
  risks: Risk[];
}

// ─── Reasoning Agent ──────────────────────────────────────────────────────────

export interface InvestmentThesis {
  thesis: string;
  strengths: string[];
  weaknesses: string[];
  growthDrivers: string[];
  threats: string[];
}

// ─── Decision Agent ───────────────────────────────────────────────────────────

export type DecisionVerdict = "BUY" | "WATCH" | "PASS";

export interface InvestmentDecision {
  verdict: DecisionVerdict;
  confidence: number; // 0–100
  investmentHorizon: "Short-term" | "Medium-term" | "Long-term";
  expectedReturnNarrative: string;
  rationale: string;
}

// ─── Explainability Agent ─────────────────────────────────────────────────────

export interface ExplainabilityStep {
  id: string;
  claim: string;
  evidence: string;
  source: "company" | "financial" | "market" | "news" | "risk" | "reasoning";
}

export interface ExplainabilityTrace {
  decisionTree: ExplainabilityStep[];
  executiveSummary: string;
}

// ─── Legacy / UI compat ───────────────────────────────────────────────────────

/** @deprecated — kept for backward-compat with old UI. Use InvestmentDecision. */
export interface Recommendation {
  status: "INVEST" | "PASS" | "HOLD";
  confidence: number;
  summary: string;
}

export interface PipelineStep {
  id: string;
  title: string;
  status: "pending" | "processing" | "complete" | "error";
  description: string;
}

// ─── Top-Level API Response ───────────────────────────────────────────────────

export interface ResearchState {
  ticker: string;
  profile: CompanyProfile;
  financials: Financials;
  marketData: MarketData | null;
  priceHistory: PricePoint[];
  newsSentiment: NewsSentimentSummary | null;
  riskSummary: RiskSummary | null;
  investmentThesis: InvestmentThesis | null;
  decision: InvestmentDecision | null;
  explainability: ExplainabilityTrace | null;
  pipeline: PipelineStep[];

  // Legacy compat
  recommendation: Recommendation | null;
  risks: Risk[];
  news: NewsItem[];
}
