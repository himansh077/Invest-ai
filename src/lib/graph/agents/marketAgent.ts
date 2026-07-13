/* eslint-disable @typescript-eslint/no-explicit-any */
import { yahooFinance } from "@/lib/yahooFinance";
import type { ResearchGraphState } from "../state";
import type { MarketData, PricePoint } from "@/types/research";

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtVolume(value: number | undefined | null): string {
  if (value == null || isNaN(value)) return "N/A";
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toString();
}

// ─── RSI Calculation ──────────────────────────────────────────────────────────

/**
 * Computes 14-period RSI using Wilder's Smoothed Moving Average (SMMA).
 *
 * Wilder's RSI is the industry standard (original 1978 definition):
 *   Initial avg gain/loss = simple average of first 14 periods
 *   Subsequent values    = (prior_avg * 13 + current) / 14
 *
 * Requires at least 15 closes to produce one RSI value.
 * Returns null if insufficient data.
 */
function calcRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  // Seed: simple average of first `period` changes
  for (let i = 1; i <= period; i++) {
    const delta = closes[i] - closes[i - 1];
    if (delta >= 0) gains += delta;
    else losses += Math.abs(delta);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Wilder's smoothing for subsequent periods
  for (let i = period + 1; i < closes.length; i++) {
    const delta = closes[i] - closes[i - 1];
    const gain = delta >= 0 ? delta : 0;
    const loss = delta < 0 ? Math.abs(delta) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return parseFloat((100 - 100 / (1 + rs)).toFixed(1));
}

// ─── Support / Resistance ─────────────────────────────────────────────────────

/**
 * Derives support and resistance levels from the most recent 60 trading days.
 *
 * Method: rolling percentile of daily lows (support) and highs (resistance).
 * - Support  = 15th percentile of closes in the window (recent price floor)
 * - Resistance = 85th percentile of closes in the window (recent price ceiling)
 *
 * Rounded to 2 decimal places so values look clean in the UI.
 */
function calcSupportResistance(
  closes: number[],
  window = 60
): { support: number; resistance: number } {
  const slice = closes.slice(-window).sort((a, b) => a - b);
  if (slice.length === 0) return { support: 0, resistance: 0 };

  const supportIdx  = Math.floor(slice.length * 0.15);
  const resistIdx   = Math.floor(slice.length * 0.85);

  return {
    support:    parseFloat(slice[supportIdx].toFixed(2)),
    resistance: parseFloat(slice[resistIdx].toFixed(2)),
  };
}

// ─── Trend Signal ─────────────────────────────────────────────────────────────

/**
 * Derives trend from the classic golden/death cross relationship:
 *   Bullish  = price > MA50 > MA200 (uptrend — both short and long aligned)
 *   Bearish  = price < MA50 < MA200 (downtrend)
 *   Neutral  = mixed signals
 */
function calcTrend(
  price: number,
  ma50: number,
  ma200: number
): "Bullish" | "Bearish" | "Neutral" {
  if (price > ma50 && ma50 > ma200) return "Bullish";
  if (price < ma50 && ma50 < ma200) return "Bearish";
  return "Neutral";
}

// ─── Price History Sampler ────────────────────────────────────────────────────

/**
 * Resamples a daily price series down to ~12 monthly data points for the chart.
 * Groups by month and takes the last close of each month.
 */
function sampleMonthly(
  rows: { date: Date; close: number }[]
): PricePoint[] {
  const byMonth = new Map<string, number>();

  for (const row of rows) {
    const key = `${row.date.getFullYear()}-${String(row.date.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, row.close); // overwrites — keeps last close of the month
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, price]) => {
      const [year, month] = key.split("-");
      const label = new Date(Number(year), Number(month) - 1).toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      return { date: label, price: parseFloat(price.toFixed(2)) };
    });
}

// ─── Market Agent Node ────────────────────────────────────────────────────────

/**
 * Market Agent — Node 3 of the Invest AI pipeline.
 *
 * Single responsibility: compute all market-technical signals for the ticker.
 *
 * Data flow:
 *   1. Fetch quote summary (price module)  → current price, 52w range, volume, MA50, MA200
 *   2. Fetch 1 year of daily history        → RSI, support/resistance, price chart
 *   3. Compute trend                        → golden/death cross logic
 *   4. Resample history to monthly          → priceHistory for chart component
 *
 * Outputs written to state:
 *   - marketData   (all market signals)
 *   - priceHistory (monthly resampled, for chart)
 *   - pipeline     (market step → complete)
 */
export async function marketAgent(
  state: ResearchGraphState
): Promise<Partial<ResearchGraphState>> {
  const ticker = state.ticker;
  console.log(`[MarketAgent] Fetching market data for: ${ticker}`);

  const processingPipeline = state.pipeline.map((step) =>
    step.id === "market" ? { ...step, status: "processing" as const } : step
  );

  // ── 1. Fetch price summary ─────────────────────────────────────────────────
  const summary = await yahooFinance.quoteSummary(
    ticker,
    { modules: ["price", "summaryDetail", "defaultKeyStatistics"] },
    { validateResult: false }
  ) as any;

  const p  = summary.price        as any;
  const sd = summary.summaryDetail as any;
  const ks = summary.defaultKeyStatistics as any;

  const currentPrice    = Number(p?.regularMarketPrice   ?? 0);
  const fiftyTwoWeekHigh = Number(sd?.fiftyTwoWeekHigh   ?? p?.regularMarketDayHigh ?? 0);
  const fiftyTwoWeekLow  = Number(sd?.fiftyTwoWeekLow    ?? p?.regularMarketDayLow  ?? 0);
  const movingAverage50d  = Number(sd?.fiftyDayAverage    ?? 0);
  const movingAverage200d = Number(sd?.twoHundredDayAverage ?? 0);
  const volume    = fmtVolume(p?.regularMarketVolume);
  const avgVolume = fmtVolume(sd?.averageVolume ?? sd?.averageVolume10days);
  const beta      = parseFloat((Number(ks?.beta ?? sd?.beta ?? 0)).toFixed(2));

  // ── 2. Fetch 1 year of daily price history ─────────────────────────────────
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const today = new Date();

  // yahooFinance.historical() is deprecated in v3 — use chart() instead
  const chartResult = await yahooFinance.chart(
    ticker,
    {
      period1: oneYearAgo.toISOString().split("T")[0],
      period2: today.toISOString().split("T")[0],
      interval: "1d",
    },
    { validateResult: false }
  ) as any;

  // chart() returns quotes under result.quotes (already an array)
  const quotes: any[] = chartResult?.quotes ?? [];

  // Filter valid rows
  const validRows = quotes
    .filter((q: any) => q.close != null && isFinite(Number(q.close)))
    .map((q: any) => ({ date: new Date(q.date), close: Number(q.close) }));

  const closes = validRows.map((r) => r.close);

  // ── 3. Compute technical indicators ───────────────────────────────────────
  const rsi = calcRSI(closes);
  const { support, resistance } = calcSupportResistance(closes);
  const trend = calcTrend(currentPrice, movingAverage50d, movingAverage200d);

  // ── 4. Resample to monthly price history for chart ────────────────────────
  const priceHistory = sampleMonthly(validRows);

  // ── 5. Build typed MarketData ─────────────────────────────────────────────
  const marketData: MarketData = {
    currentPrice:     parseFloat(currentPrice.toFixed(2)),
    fiftyTwoWeekHigh: parseFloat(fiftyTwoWeekHigh.toFixed(2)),
    fiftyTwoWeekLow:  parseFloat(fiftyTwoWeekLow.toFixed(2)),
    movingAverage50d:  parseFloat(movingAverage50d.toFixed(2)),
    movingAverage200d: parseFloat(movingAverage200d.toFixed(2)),
    rsi,
    volume,
    avgVolume,
    beta,
    trend,
    support,
    resistance,
  };

  console.log(
    `[MarketAgent] ✓ ${ticker} | Price: $${marketData.currentPrice} | ` +
    `RSI: ${rsi ?? "N/A"} | Trend: ${trend} | Support: $${support} | Resistance: $${resistance}`
  );

  const completePipeline = processingPipeline.map((step) =>
    step.id === "market"
      ? {
          ...step,
          status: "complete" as const,
          description: `Trend: ${trend} · RSI: ${rsi ?? "N/A"} · MA50: $${marketData.movingAverage50d}`,
        }
      : step
  );

  return {
    marketData,
    priceHistory,
    pipeline: completePipeline,
  };
}
