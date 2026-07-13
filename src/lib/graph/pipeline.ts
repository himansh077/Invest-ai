import { StateGraph } from "@langchain/langgraph";
import { ResearchAnnotation, type ResearchGraphState } from "./state";

// ── Agent imports (one file per agent, one responsibility each) ───────────────
import { companyAgent } from "./agents/companyAgent";
import { financialAgent } from "./agents/financialAgent";
import { marketAgent } from "./agents/marketAgent";
import { newsAgent } from "./agents/newsAgent";
import { riskAgent } from "./agents/riskAgent";
import { reasoningAgent } from "./agents/reasoningAgent";
import { decisionAgent } from "./agents/decisionAgent";
import { explainabilityAgent } from "./agents/explainabilityAgent";

import type { ResearchState } from "@/types/research";

// ─── Graph Definition ─────────────────────────────────────────────────────────

/**
 * Builds the Invest AI multi-agent pipeline as a LangGraph StateGraph.
 *
 * Architecture mirrors the Qlib philosophy:
 *   companyAgent     → profile, competitors
 *   financialAgent   → revenue, margins, health score
 *   marketAgent      → price signals, RSI, moving averages
 *   newsAgent        → sentiment, catalysts, risks
 *   riskAgent        → risk scoring across 5 dimensions
 *   reasoningAgent   → investment thesis
 *   decisionAgent    → BUY / WATCH / PASS verdict
 *   explainabilityAgent → evidence-referenced decision tree
 *
 * All agents run sequentially (not parallel) so each agent can consume
 * the enriched state produced by the preceding agent.
 */
function buildGraph() {
  const graph = new StateGraph(ResearchAnnotation)
    .addNode("companyAgent", companyAgent)
    .addNode("financialAgent", financialAgent)
    .addNode("marketAgent", marketAgent)
    .addNode("newsAgent", newsAgent)
    .addNode("riskAgent", riskAgent)
    .addNode("reasoningAgent", reasoningAgent)
    .addNode("decisionAgent", decisionAgent)
    .addNode("explainabilityAgent", explainabilityAgent)

    .addEdge("__start__", "companyAgent")
    .addEdge("companyAgent", "financialAgent")
    .addEdge("financialAgent", "marketAgent")
    .addEdge("marketAgent", "newsAgent")
    .addEdge("newsAgent", "riskAgent")
    .addEdge("riskAgent", "reasoningAgent")
    .addEdge("reasoningAgent", "decisionAgent")
    .addEdge("decisionAgent", "explainabilityAgent")
    .addEdge("explainabilityAgent", "__end__");

  return graph.compile();
}

// Singleton — compiled once at module load, reused across requests
const researchGraph = buildGraph();

// ─── Public Pipeline Runner ───────────────────────────────────────────────────

/**
 * Helper to format the final state with safe defaults for the frontend.
 */
function formatState(finalState: Partial<ResearchGraphState>): ResearchState {
  return {
    ticker: finalState.ticker ?? "",
    profile: finalState.profile!,
    financials: finalState.financials ?? {
      revenue: "N/A",
      netIncome: "N/A",
      operatingIncome: "N/A",
      peRatio: 0,
      eps: 0,
      roe: 0,
      roa: 0,
      debtToEquity: 0,
      freeCashFlow: "N/A",
      operatingMargin: "N/A",
      netMargin: "N/A",
      revenueGrowthYoY: "N/A",
      healthScore: { score: 0, label: "Fair", reasoning: "Financial data pending." },
    },
    marketData: finalState.marketData ?? null,
    priceHistory: finalState.priceHistory ?? [],
    newsSentiment: finalState.newsSentiment ?? null,
    riskSummary: finalState.riskSummary ?? null,
    investmentThesis: finalState.investmentThesis ?? null,
    decision: finalState.decision ?? null,
    explainability: finalState.explainability ?? null,
    pipeline: finalState.pipeline ?? [],

    // Legacy compat fields
    recommendation: finalState.recommendation ?? null,
    risks: finalState.risks ?? [],
    news: finalState.news ?? [],
  };
}

/**
 * Runs the full 8-agent research pipeline for a given ticker or company name.
 * Returns a fully typed ResearchState for the frontend to consume.
 */
export async function runResearchPipeline(ticker: string): Promise<ResearchState> {
  const initialState: Partial<ResearchGraphState> = { ticker };
  const finalState = await researchGraph.invoke(initialState);
  return formatState(finalState);
}

/**
 * Streams the 8-agent research pipeline for a given ticker.
 * Yields the updated ResearchState after each agent completes.
 */
export async function* streamResearchPipeline(ticker: string): AsyncGenerator<ResearchState, void, unknown> {
  const initialState: Partial<ResearchGraphState> = { ticker };
  
  // streamMode: "values" yields the full accumulated state after every node executes.
  const stream = await researchGraph.stream(initialState, { streamMode: "values" });
  
  for await (const chunk of stream) {
    yield formatState(chunk);
  }
}

