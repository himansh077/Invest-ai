/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Yahoo Finance peer/competitor data type.
 * yahoo-finance2 returns a loosely typed object here so we use any internally.
 */

import { yahooFinance } from "@/lib/yahooFinance";
import type { ResearchGraphState } from "../state";
import type { CompanyProfile, Competitor, PipelineStep } from "@/types/research";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLargeNumber(value: number | undefined | null, prefix = ""): string {
  if (value == null) return "N/A";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${prefix}${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${prefix}${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${prefix}${(value / 1e6).toFixed(2)}M`;
  return `${prefix}${value.toFixed(2)}`;
}

function formatEmployees(count: number | undefined | null): string {
  if (count == null) return "N/A";
  if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
  return count.toString();
}

// ─── Ticker Resolution ────────────────────────────────────────────────────────

/**
 * Resolves a user input string (company name or ticker) to a Yahoo Finance ticker symbol.
 *
 * Design decision: we attempt a quick heuristic first (short uppercase → treat as ticker)
 * before hitting the search API. This avoids a network round-trip for the common case
 * where users type the ticker directly.
 */
export async function resolveTicker(input: string): Promise<string> {
  const cleaned = input.trim();

  // Heuristic: looks like a ticker symbol
  // Rules:
  //   - Base part (before . or -) must be ALL UPPERCASE and 1–6 chars  → AAPL, MSFT, GOOGL
  //   - Optional suffix after . or - is allowed                        → TCS.NS, BRK-B
  //   - Mixed-case words (e.g. "Microsoft", "Apple") must go to search
  const tickerRegex = /^([A-Z]{1,6})([.\-][A-Z0-9]{1,4})?$/;
  if (tickerRegex.test(cleaned)) {
    return cleaned.toUpperCase();
  }

  // Fall back to Yahoo Finance search to map company name → ticker
  const searchResult = await yahooFinance.search(cleaned, {}, { validateResult: false }) as any;
  const firstEquity = searchResult.quotes?.find(
    (q: any) => q.quoteType === "EQUITY" && q.symbol
  );

  if (!firstEquity?.symbol) {
    throw new Error(
      `Could not resolve "${input}" to a known ticker symbol. ` +
      `Try using the symbol directly (e.g. AAPL, TCS.NS, RELIANCE.NS).`
    );
  }

  return firstEquity.symbol as string;
}

// ─── Competitor Fetch ─────────────────────────────────────────────────────────

/**
 * Fetches up to 5 peer/competitor companies for a given ticker.
 *
 * Yahoo Finance's `recommendationsBySymbol` module returns a list of similar
 * equities which serves well as a lightweight competitor proxy.
 * We resolve market cap for each peer in a parallel batch.
 */
async function fetchCompetitors(ticker: string): Promise<Competitor[]> {
  try {
    const rec = await yahooFinance.recommendationsBySymbol(ticker, {}, { validateResult: false }) as any;
    const peers: string[] = (rec?.recommendedSymbols ?? [])
      .slice(0, 5)
      .map((r: any) => r.symbol as string)
      .filter(Boolean);

    if (peers.length === 0) return [];

    // Fetch market cap for each peer in parallel
    const peerProfiles = await Promise.allSettled(
      peers.map(async (sym) => {
        const q = await yahooFinance.quote(sym, {}, { validateResult: false }) as any;
        return {
          name: (q?.longName ?? q?.shortName ?? sym) as string,
          ticker: sym,
          marketCap: formatLargeNumber(q?.marketCap, "$"),
        } satisfies Competitor;
      })
    );

    return peerProfiles
      .filter((r): r is PromiseFulfilledResult<Competitor> => r.status === "fulfilled")
      .map((r) => r.value);
  } catch {
    // Competitors are non-critical — fail silently
    return [];
  }
}

// ─── Pipeline Step Builders ───────────────────────────────────────────────────

function buildInitialPipeline(companyName: string): PipelineStep[] {
  return [
    {
      id: "company",
      title: "Company Agent",
      status: "complete",
      description: `Fetched live profile and peer data for ${companyName}.`,
    },
    {
      id: "financial",
      title: "Financial Agent",
      status: "pending",
      description: "Fetching revenue, margins, EPS, and health scoring.",
    },
    {
      id: "market",
      title: "Market Agent",
      status: "pending",
      description: "Calculating RSI, moving averages, and trend signals.",
    },
    {
      id: "news",
      title: "News Agent",
      status: "pending",
      description: "Fetching latest news and running sentiment analysis.",
    },
    {
      id: "risk",
      title: "Risk Agent",
      status: "pending",
      description: "Evaluating business, financial, market, and macro risks.",
    },
    {
      id: "reasoning",
      title: "Reasoning Agent",
      status: "pending",
      description: "Synthesizing investment thesis from all evidence.",
    },
    {
      id: "decision",
      title: "Decision Agent",
      status: "pending",
      description: "Producing final BUY / WATCH / PASS verdict.",
    },
    {
      id: "explainability",
      title: "Explainability Agent",
      status: "pending",
      description: "Generating evidence-referenced decision trace.",
    },
  ];
}

// ─── Company Agent Node ───────────────────────────────────────────────────────

/**
 * Company Agent — Node 1 of the Invest AI pipeline.
 *
 * Single responsibility: fetch and return a fully typed CompanyProfile.
 *
 * Outputs written to state:
 *   - ticker (resolved)
 *   - profile
 *   - pipeline (initialised)
 *
 * Does NOT fetch financials, market data, or news. Those belong to their
 * respective agents (Milestone 6, 7, 8).
 */
export async function companyAgent(
  state: ResearchGraphState
): Promise<Partial<ResearchGraphState>> {
  const input = state.ticker;
  console.log(`[CompanyAgent] Starting research for: "${input}"`);

  // ── 1. Resolve input → canonical ticker symbol ────────────────────────────
  const ticker = await resolveTicker(input);
  console.log(`[CompanyAgent] Resolved ticker: ${ticker}`);

  // ── 2. Fetch company profile modules in a single API call ─────────────────
  const summary = await yahooFinance.quoteSummary(
    ticker,
    { modules: ["assetProfile", "price"] },
    { validateResult: false }
  ) as any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assetProfile = summary.assetProfile as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const price = summary.price as any;

  // ── 3. Extract CEO from officers array ────────────────────────────────────
  const ceo =
    assetProfile?.companyOfficers?.find((o: any) =>
      o.title?.toLowerCase().includes("chief executive")
    )?.name ?? "N/A";

  // ── 4. Fetch competitors in parallel (non-blocking on failure) ────────────
  const competitors = await fetchCompetitors(ticker);
  console.log(`[CompanyAgent] Found ${competitors.length} peers for ${ticker}`);

  // ── 5. Build strongly typed CompanyProfile ────────────────────────────────
  const profile: CompanyProfile = {
    name: price?.longName ?? price?.shortName ?? ticker,
    ticker,
    sector: assetProfile?.sector ?? "N/A",
    industry: assetProfile?.industry ?? "N/A",
    description:
      assetProfile?.longBusinessSummary?.slice(0, 500) ??
      "No description available.",
    marketCap: formatLargeNumber(price?.marketCap as number | undefined, "$"),
    employees: formatEmployees(assetProfile?.fullTimeEmployees),
    price: price?.regularMarketPrice ?? 0,
    change: price?.regularMarketChange ?? 0,
    changePercent: (price?.regularMarketChangePercent ?? 0) * 100,
    ceo,
    founded: assetProfile?.founded?.toString() ?? "N/A",
    website: assetProfile?.website ?? "N/A",
    country: assetProfile?.country ?? "N/A",
    competitors,
  };

  console.log(
    `[CompanyAgent] ✓ ${profile.name} | ${profile.sector} | Cap: ${profile.marketCap} | Peers: ${competitors.length}`
  );

  return {
    ticker,
    profile,
    pipeline: buildInitialPipeline(profile.name),
  };
}
