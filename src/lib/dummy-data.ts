import type {
  CompanyProfile,
  Financials,
  PricePoint,
  Recommendation,
  Risk,
  NewsItem,
  PipelineStep,
} from "@/types/research";

export const DUMMY_COMPANY_PROFILE: CompanyProfile = {
  name: "Invest Holdings",
  ticker: "ALPH",
  sector: "Technology",
  industry: "Software Infrastructure",
  description:
    "Invest Holdings provides enterprise AI solutions and infrastructure for cloud computing.",
  marketCap: "$1.20T",
  employees: "180K",
  price: 245.5,
  change: 4.25,
  changePercent: 1.76,
  ceo: "Jane Doe",
  founded: "2010",
  website: "https://invest.example.com",
  country: "United States",
  competitors: [
    { name: "Beta Systems", ticker: "BSYS", marketCap: "$320.00B" },
    { name: "Gamma Cloud", ticker: "GCLD", marketCap: "$210.00B" },
    { name: "Delta AI", ticker: "DELT", marketCap: "$95.00B" },
  ],
};

export const DUMMY_FINANCIALS: Financials = {
  revenue: "$45.20B",
  netIncome: "$12.40B",
  operatingIncome: "$15.80B",
  peRatio: 32.5,
  eps: 7.55,
  roe: 0.28,
  roa: 0.14,
  debtToEquity: 0.45,
  freeCashFlow: "$15.10B",
  operatingMargin: "34.2%",
  netMargin: "27.4%",
  revenueGrowthYoY: "+18.3%",
  healthScore: {
    score: 82,
    label: "Good",
    reasoning:
      "Strong free cash flow generation and healthy margins with manageable leverage.",
  },
};

export const DUMMY_PRICE_HISTORY: PricePoint[] = [
  { date: "Jan 24", price: 150 },
  { date: "Feb 24", price: 165 },
  { date: "Mar 24", price: 160 },
  { date: "Apr 24", price: 175 },
  { date: "May 24", price: 190 },
  { date: "Jun 24", price: 210 },
  { date: "Jul 24", price: 205 },
  { date: "Aug 24", price: 220 },
  { date: "Sep 24", price: 235 },
  { date: "Oct 24", price: 230 },
  { date: "Nov 24", price: 240 },
  { date: "Dec 24", price: 245 },
];

export const DUMMY_RECOMMENDATION: Recommendation = {
  status: "INVEST",
  confidence: 85,
  summary:
    "Strong financial position with growing market share in AI infrastructure. Favorable macro tailwinds and healthy margins mitigate short-term valuation concerns.",
};

export const DUMMY_RISKS: Risk[] = [
  {
    id: 1,
    title: "High Valuation",
    description: "P/E ratio of 32.5 is above industry average of 25.",
    severity: "high",
    category: "Market",
  },
  {
    id: 2,
    title: "Regulatory Scrutiny",
    description: "Pending antitrust review in EU.",
    severity: "medium",
    category: "Governance",
  },
  {
    id: 3,
    title: "Supply Chain Concentration",
    description: "Reliance on TSMC for advanced chips.",
    severity: "low",
    category: "Business",
  },
];

export const DUMMY_NEWS: NewsItem[] = [
  {
    id: 1,
    title: "Invest Holdings announces new AI datacenter expansion",
    url: "#",
    date: "2024-03-15",
    source: "TechCrunch",
    sentiment: "positive",
    summary: "The company plans to invest $5B in next-generation AI infrastructure.",
  },
  {
    id: 2,
    title: "Analyst upgrades ALPH price target to $300",
    url: "#",
    date: "2024-03-14",
    source: "Bloomberg",
    sentiment: "positive",
    summary: "Three major investment banks raised their 12-month price targets.",
  },
  {
    id: 3,
    title: "EU opens preliminary probe into cloud practices",
    url: "#",
    date: "2024-03-10",
    source: "Reuters",
    sentiment: "negative",
    summary:
      "Regulators are examining potential anti-competitive bundling of cloud and AI services.",
  },
];

export const DUMMY_PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "company",
    title: "Company Agent",
    status: "complete",
    description: "Fetched profile, sector, CEO, and competitor data.",
  },
  {
    id: "financial",
    title: "Financial Agent",
    status: "complete",
    description: "Calculated growth rates, margins, and health score.",
  },
  {
    id: "market",
    title: "Market Agent",
    status: "complete",
    description: "Computed RSI, moving averages, and trend signals.",
  },
  {
    id: "news",
    title: "News Agent",
    status: "complete",
    description: "Analysed sentiment across 15 headlines.",
  },
  {
    id: "risk",
    title: "Risk Agent",
    status: "complete",
    description: "Assessed regulatory and macroeconomic risks.",
  },
  {
    id: "reasoning",
    title: "Reasoning Agent",
    status: "complete",
    description: "Synthesised investment thesis from all evidence.",
  },
  {
    id: "decision",
    title: "Decision Agent",
    status: "complete",
    description: "Produced BUY verdict with 85% confidence.",
  },
  {
    id: "explainability",
    title: "Explainability Agent",
    status: "complete",
    description: "Generated transparent reasoning trace.",
  },
];
