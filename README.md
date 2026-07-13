# Invest AI (iVEST Terminal)

> **Production-quality, Qlib-inspired AI Investment Research Platform** — 8 modular LLM agents that analyze any public company in real-time and deliver a structured, evidence-backed investment verdict with full explainability.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-invest--ai-brightgreen?logo=vercel)](https://invest-ai-inky.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph.js-1.4-purple)](https://github.com/langchain-ai/langgraphjs)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-cyan?logo=tailwindcss)](https://tailwindcss.com/)

🚀 **[→ Live Demo: invest-ai-inky.vercel.app](https://invest-ai-inky.vercel.app/)**

---

## Overview — What it does

Invest AI is an **agentic investment research platform** that runs a sequential 8-agent pipeline on any publicly listed company. Inspired by Microsoft Qlib's philosophy, it mirrors the full research workflow used by professional analysts:

```
Raw Data → Feature Engineering → Analysis → Risk Modeling → Decision → Explainability
```

You type a ticker (`AAPL`) or a company name (`Apple`), and Invest AI fires an 8-agent LangGraph pipeline that streams results back to the Cyberpunk-styled Bento HUD UI in real-time — each card appears as the corresponding agent completes, not as a single 10-second block load.

### The 8 Agents

| # | Agent | Responsibility | Data Source |
|---|-------|----------------|-------------|
| 1 | **Company Agent** | Resolves ticker, fetches profile, sector, competitors, CEO, market cap | Yahoo Finance |
| 2 | **Financial Agent** | Revenue, net income, margins, EPS, ROE, ROA, D/E, health score (0–100) | Yahoo Finance (fundamentalsTimeSeries) |
| 3 | **Market Agent** | Price, RSI, 50/200-day MAs, 52-week range, volume, beta, trend signal | Yahoo Finance |
| 4 | **News Agent** | Top headlines, LLM-powered sentiment classification, catalysts, risks | Yahoo Finance News + OpenAI |
| 5 | **Risk Agent** | 5-dimension risk scoring across Business, Financial, Market, Macro, Governance | All prior agent outputs |
| 6 | **Reasoning Agent** | Synthesises a structured investment thesis with strengths/weaknesses/drivers/threats | All prior agent outputs + OpenAI |
| 7 | **Decision Agent** | Dual-path BUY/WATCH/PASS verdict with confidence score, horizon, and expected return narrative | All prior + OpenAI with deterministic fallback |
| 8 | **Explainability Agent** | 8-step evidence-referenced decision trace + executive summary | All prior + OpenAI |

### Key Features

- 🔴 **Real-time SSE streaming** — UI updates progressively as each agent completes
- 🧠 **Evidence-based reasoning** — every claim traces back to a specific data source
- 🛡️ **Deterministic fallback** — agents never fail silently; all LLM calls have structured JSON fallbacks
- 📊 **12-month price history chart** with MA50/MA200 reference lines in a glowing cyber-cyan gradient
- 🎯 **Weighted scoring model** for the Decision Agent (Financial 30% · Risk 25% · Market 20% · News 15% · Thesis 10%)
- 📋 **Full explainability trace** — 8-step decision tree logged like a terminal audit trail
- 💅 **Premium 3D split-layout UI** — Custom CSS 3D wireframe globe, glassmorphism bento grids, and framer-motion animations

---

## How to run it

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | ≥ 18.x |
| npm | ≥ 9.x |
| OpenAI API Key | Required |

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/invest-ai.git
cd invest-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example env file and add your API key:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required — used by News Agent, Reasoning Agent, Decision Agent, Explainability Agent
OPENAI_API_KEY=sk-...your_key_here...

# Optional — override the default model (default: gpt-4o-mini)
# OPENAI_MODEL=gpt-4o
```

> **Note:** Yahoo Finance data is fetched via the open `yahoo-finance2` npm package — no API key is required.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Search a Company

Type any ticker (`AAPL`, `TSLA`, `TCS.NS`) or company name (`Nvidia`, `Apple`) into the search bar and press Enter. The 8-agent pipeline will stream results back to the iVEST Terminal HUD in real time.

---

## How it works

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict) |
| AI Orchestration | LangGraph.js 1.4 |
| LLM | OpenAI GPT-4o-mini (structured output via `withStructuredOutput`) |
| UI | React 19 + Tailwind v4 + framer-motion |
| Charts | Recharts |
| Data | yahoo-finance2 |
| Validation | Zod v4 |

### Pipeline Architecture

```
User Input (ticker/name)
        │
        ▼
  [Ticker Resolver]  ──── Yahoo Finance search API
        │
        ▼
  companyAgent      ──── Yahoo Finance: summary, quote, peer data
        │
        ▼
  financialAgent    ──── Yahoo Finance: fundamentalsTimeSeries
        │
        ▼
  marketAgent       ──── Yahoo Finance: historical prices (1Y), quote stats
        │
        ▼
  newsAgent         ──── Yahoo Finance News + OpenAI (structured JSON)
        │
        ▼
  riskAgent         ──── Deterministic 5-dimension scoring from state
        │
        ▼
  reasoningAgent    ──── OpenAI GPT-4o-mini (withStructuredOutput)
        │
        ▼
  decisionAgent     ──── OpenAI GPT-4o-mini + deterministic weighted score
        │
        ▼
  explainabilityAgent ─── OpenAI GPT-4o-mini (8-step evidence trace)
        │
        ▼
  SSE Stream ──→ GET /api/research → ReadableStream → Browser
```

### State Flow

All agents share a single typed `ResearchAnnotation` (LangGraph `Annotation.Root`) object. Each agent reads from prior fields and writes only its own output. The `reducer: (_, next) => next` pattern ensures latest-write-wins semantics with no merge conflicts.

### Streaming

The API route (`GET /api/research`) uses LangGraph's `.stream(state, { streamMode: "values" })` to yield the full accumulated state after each node. These chunks are encoded as Server-Sent Events (SSE) and streamed to the browser, which reads them with `res.body.getReader()` and calls `setData(chunk)` for each one — causing the UI to progressively render.

---

## Key decisions & trade-offs

### ✅ What We Chose and Why

| Decision | Rationale |
|----------|-----------|
| **Cyberpunk HUD Bento Layout** | Migrated away from generic dashboards to a fully immersive 3D Terminal split-layout to provide a premium, system-integrator aesthetic. |
| **Sequential pipeline (not parallel)** | Each agent needs the enriched state from prior agents. Parallel execution would require a merge step and sacrifice data quality. |
| **`withStructuredOutput` for all LLM calls** | Eliminates JSON parse errors entirely. Every LLM response is validated against a Zod schema before entering the state. |
| **Deterministic fallback on every agent** | If the LLM call fails or times out, the agent computes a sensible result from heuristics (e.g., the Decision Agent falls back to a weighted scoring model). The pipeline never crashes. |
| **yahoo-finance2 over FMP/Alpha Vantage** | Free, no API key required, covers both US and international tickers, and has very complete financial time series data. |
| **SSE streaming over WebSockets** | One-directional, request-scoped, native HTTP — simpler to deploy without a separate WebSocket server. Works natively with `fetch` + `ReadableStream`. |
| **Dual-path Decision Agent** | LLM for narrative quality + deterministic weighted score for auditability. The weighted model ensures the verdict is explainable even without the LLM. |
| **CSS 3D Globe over Three.js** | Used `preserve-3d` CSS and Framer Motion for the globe on the landing page instead of pulling in a massive WebGL engine, keeping the bundle size microscopic. |

### ❌ What We Left Out (and Why)

| Omission | Reason |
|----------|--------|
| **Live general market news on the landing page** | Built a mocked `Trending Market Intel` dropdown instead to simulate the aesthetic. A real integration would require a separate NewsAPI cron job, which is out of scope. |
| **Portfolio-level analysis** | Multi-ticker correlation and portfolio risk scoring would require a separate agent graph. Designed for single-ticker deep dives. |
| **User authentication** | This is a research tool demonstration, not a SaaS. Auth adds infra complexity that was not the focus here. |
| **Streaming agent tokens (word-by-word)** | LangGraph `streamMode: "values"` streams at the node level, not the token level. Token-level streaming requires `streamEvents` with LLM callback interceptors. |

---

## Example runs

### 1. Apple Inc. (`AAPL`)

| Signal | Value |
|--------|-------|
| **Verdict** | ✅ BUY |
| **Confidence** | 60% |
| **Horizon** | Long-term |
| **Financial Health** | 81/100 — Excellent |
| **Risk Score** | 25/100 — Moderate |
| **RSI** | 62.9 (Neutral zone) |
| **Trend** | Bullish |
| **Top Strength** | Strong financial health score of 81/100 reflecting solid fundamentals |
| **Decision Trace** | 8 evidence steps logged in the audit trail terminal, attributing signals back to the Market Agent and News Agent. |

**Executive Summary (Agent Output):**
> "AAPL receives a composite score of 73/100 across five dimensions. Financial health is the strongest signal at 81/100, while news sentiment is the weakest at 50/100. The convergence of positive signals supports an entry position with managed position sizing."

---

### 2. NVIDIA Corporation (`NVDA`)

| Signal | Value |
|--------|-------|
| **Verdict** | ✅ BUY |
| **Confidence** | 78% |
| **Horizon** | Medium-term |
| **Financial Health** | 88/100 — Excellent |
| **Risk Score** | 38/100 — Moderate |
| **Trend** | Bullish |
| **Top Driver** | Dominant AI GPU market share with data center revenue growing >100% YoY |
| **Top Threat** | Concentration risk — heavy reliance on a small number of hyperscaler customers |

---

## What you would improve with more time

1. **Token-level streaming** — Use LangGraph `streamEvents` to stream individual LLM tokens within each Bento card for a true "ChatGPT feel".
2. **Error retry UI** — Instead of showing a hard error, retry the failed agent automatically up to 3 times with exponential backoff.
3. **Peer comparison table** — Run the same pipeline on 3–5 competitors and render a side-by-side comparison matrix (P/E, margins, risk score, verdict) inside a new Bento card.
4. **Custom agent configuration** — Let users enable/disable specific agents, adjust the Decision Agent's weighting model, or swap to GPT-4o for higher-quality LLM steps directly from the terminal UI.
5. **Backtesting engine** — Feed the decision verdicts through a paper-trading simulator using historical prices to evaluate the model's historical accuracy.

---

## BONUS points:

### Why LangGraph Instead of a Simple Function Chain?

A simple sequential function chain (`fn1 → fn2 → fn3`) would work for a toy demo, but LangGraph gives us:

- **Typed, validated shared state** — the `Annotation.Root` pattern ensures every agent reads and writes well-typed data; TypeScript catches state shape mismatches at compile time.
- **Native streaming** — `.stream({ streamMode: "values" })` is built into the framework; we get SSE for free without manual state diffing.
- **Conditional routing** — we can later add `addConditionalEdges` to branch to different agent subgraphs based on sector (e.g., a specialized bank analysis path for Financial sector tickers) without restructuring the entire pipeline.
- **Observability** — LangGraph integrates with LangSmith for full trace inspection of every agent call, token count, and latency — critical for a production research tool.

### Qlib Philosophy Mapping

| Qlib Concept | iVEST Terminal Implementation |
|---|---|
| Raw Data Layer | `companyAgent` + `marketAgent` (Yahoo Finance live data) |
| Feature Engineering | `financialAgent` (health score, margin calculations, growth rates) |
| Model Analysis | `reasoningAgent` (LLM investment thesis synthesis) |
| Risk Modeling | `riskAgent` (5-dimension composite risk score) |
| Decision Layer | `decisionAgent` (dual-path BUY/WATCH/PASS with confidence) |
| Explainability | `explainabilityAgent` (8-step evidence-referenced decision tree) |

---

## License

MIT © 2026 Invest AI
