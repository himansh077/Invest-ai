/**
 * Shared Yahoo Finance client singleton.
 *
 * yahoo-finance2 v3+ requires instantiation via `new YahooFinance()`.
 * We create ONE instance here and reuse it across all agents to avoid
 * repeated initialisation overhead and config drift.
 */
import YahooFinance from "yahoo-finance2";

export const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey", "ripHistorical"],
});
