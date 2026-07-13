/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { researchQuerySchema } from "@/lib/validations";
import { streamResearchPipeline } from "@/lib/graph/pipeline";

/**
 * GET /api/research?ticker=AAPL
 *
 * Runs the full 8-agent LangGraph research pipeline and returns a
 * Server-Sent Events (SSE) stream yielding the updated ResearchState.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawInput = searchParams.get("ticker") ?? "";

    // Validate input
    const { ticker } = researchQuerySchema.parse({ ticker: rawInput });

    console.log(`[API /research] Starting pipeline stream for: "${ticker}"`);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const pipelineStream = streamResearchPipeline(ticker);
          for await (const chunk of pipelineStream) {
            // Send each chunk as an SSE data payload
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          }
          // Signal that the stream has finished
          controller.enqueue(encoder.encode(`event: end\ndata: {}\n\n`));
        } catch (err: unknown) {
          const message = err instanceof Error ? (err instanceof Error ? err.message : String(err)) : "Pipeline error";
          console.error("[API /research] Pipeline stream error:", message);
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (error: unknown) {
    // Zod validation error
    if (error instanceof Error && error.constructor.name === "ZodError") {
      const zodError = error as any;
      return NextResponse.json(
        { error: "Validation Error", details: zodError.errors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("[API /research] Request error:", message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
