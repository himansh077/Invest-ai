import { z } from "zod";

/**
 * Validates the incoming research query.
 *
 * Max length extended to 60 to support full company names like
 * "Reliance Industries" or "Taiwan Semiconductor Manufacturing".
 */
export const researchQuerySchema = z.object({
  ticker: z
    .string()
    .min(1, "A company name or ticker symbol is required.")
    .max(60, "Query is too long. Please use a ticker symbol or short company name.")
    .trim(),
});

export type ResearchQuery = z.infer<typeof researchQuerySchema>;
