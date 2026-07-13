"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ResearchState } from "@/types/research";
import BentoProfile from "@/components/dashboard/BentoProfile";
import BentoFinancials from "@/components/dashboard/BentoFinancials";
import BentoRecommendation from "@/components/dashboard/BentoRecommendation";
import BentoNews from "@/components/dashboard/BentoNews";
import BentoPipeline from "@/components/dashboard/BentoPipeline";
import BentoMarket from "@/components/dashboard/BentoMarket";
import BentoRisk from "@/components/dashboard/BentoRisk";
import BentoEvidence from "@/components/dashboard/BentoEvidence";
import HudOverlay from "@/components/dashboard/HudOverlay";
import TrendingDropdown from "@/components/dashboard/TrendingDropdown";

export default function Dashboard() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ResearchState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchResearch = async (ticker: string) => {
    if (!ticker) return;
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/research?ticker=${encodeURIComponent(ticker)}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch research");
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (part.startsWith("event: end")) {
            setIsLoading(false);
            return;
          }
          if (part.startsWith("event: error")) {
            const dataStr = part.split("\ndata: ")[1];
            if (dataStr) {
              const err = JSON.parse(dataStr);
              throw new Error(err.error);
            }
          }
          if (part.startsWith("data: ")) {
            const dataStr = part.slice(6);
            if (dataStr.trim()) {
              const parsedData = JSON.parse(dataStr) as ResearchState;
              setData(parsedData);
            }
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResearch(query);
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-white font-sans overflow-hidden">

      {/* Background Noise & Grid */}
      <div className="bg-noise" />
      <div className="bg-grid" />
      <HudOverlay />

      {/* Main Content */}
      <main className="relative z-10 p-6 md:p-12 lg:px-24 h-screen overflow-y-auto custom-scrollbar">

        {/* Header / Search Bar */}
        <div className="max-w-7xl mx-auto mb-12 mt-12 md:mt-24">
          <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
              <span className="mono text-xs text-[#00f0ff]">&gt;</span>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ENTER TICKER (e.g. AAPL, TSLA)_"
              className="w-full bg-[#0a0a0a]/80 backdrop-blur-md border border-[#94a3b8]/30 h-14 pl-10 pr-4 text-[#00f0ff] font-mono text-sm tracking-widest focus:outline-none focus:border-[#00f0ff] transition-colors shadow-[0_0_20px_rgba(0,240,255,0.05)] focus:shadow-[0_0_30px_rgba(0,240,255,0.15)] placeholder-[#555]"
            />
            <div className="absolute right-0 top-0 bottom-0 px-4 flex items-center border-l border-[#94a3b8]/30 bg-[#94a3b8]/5">
              <span className="mono text-[10px] text-[#888888]">SEARCH_DB</span>
            </div>
          </form>
        </div>

        {/* 1. Landing Empty State */}
        {!isLoading && !data && !error && (
          <div className="max-w-4xl mx-auto text-center reveal-elem">
            <div className="inline-flex items-center gap-3 bg-[#94a3b8]/5 border border-[#94a3b8]/20 px-4 py-2 mb-8 shadow-[0_0_20px_rgba(148,163,184,0.1)]">
              <div className="pulse-dot"></div>
              <span className="mono text-xs text-[#94a3b8] tracking-[0.2em]">SYSTEM.ONLINE</span>
            </div>

            <h1 className="text-[clamp(3rem,8vw,5rem)] font-light leading-[1.1] tracking-[0.05em] uppercase flex flex-col mb-6">
              <span className="block">iVEST</span>
              <span className="block text-transparent font-bold tracking-[0.1em]" style={{ WebkitTextStroke: "1px rgba(255, 255, 255, 0.5)" }}>
                TERMINAL
              </span>
            </h1>

            <p className="mono text-sm text-[#888888] tracking-widest mb-12">
              [ AWAITING INPUT_COMMAND... ]
            </p>

            <div className="flex flex-wrap justify-center gap-4 reveal-elem delay-2">
              {["AAPL", "TSLA", "NVDA", "MSFT"].map((t) => (
                <button
                  key={t}
                  onClick={() => { setQuery(t); fetchResearch(t); }}
                  className="tech-frame bg-[#0a0a0a] hover:bg-[#94a3b8]/10 transition-colors px-6 py-3 cursor-pointer"
                >
                  <div className="tech-corner-tl"></div>
                  <div className="tech-corner-br"></div>
                  <span className="mono text-sm text-[#94a3b8] font-bold tracking-widest">{t}</span>
                </button>
              ))}
            </div>

            <TrendingDropdown />
          </div>
        )}

        {/* 2. Loading State */}
        {isLoading && (
          <div className="max-w-2xl mx-auto text-center mt-32 reveal-elem">
            <div className="mb-8">
              <div className="stat-circle mx-auto">
                <svg className="progress-ring" width="120" height="120">
                  <circle className="ring-bg" cx="60" cy="60" r="54"></circle>
                  <circle className="ring-fg" cx="60" cy="60" r="54" style={{ strokeDashoffset: "200", stroke: "#00f0ff" }}></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="pulse-dot"></div>
                </div>
              </div>
            </div>
            <div className="mono text-sm text-[#00f0ff] tracking-[0.2em] animate-pulse">
              &gt; EXECUTING AGENT_PIPELINE...
            </div>
          </div>
        )}

        {/* 3. Error State */}
        {!isLoading && error && (
          <div className="max-w-2xl mx-auto border border-[#ff5f56]/30 bg-[#ff5f56]/5 p-8 reveal-elem relative">
            <div className="tech-corner-tl !border-[#ff5f56]"></div>
            <div className="tech-corner-br !border-[#ff5f56]"></div>
            <span className="mono text-sm text-[#ff5f56] font-bold mb-4 block">&gt; ERROR_ENCOUNTERED</span>
            <p className="mono text-xs text-[#888888]">{error}</p>
          </div>
        )}

        {/* 4. Dashboard Active State */}
        {!isLoading && data && !error && (
          <div className="max-w-[1400px] w-full px-4 mx-auto bento-grid grid grid-cols-1 md:grid-cols-3 gap-8 pb-24">
            {/* Top Row: Profile, Financials, Recommendation */}
            {data.profile && <BentoProfile profile={data.profile} />}
            {data.financials && <BentoFinancials financials={data.financials} />}
            {data.decision && <BentoRecommendation decision={data.decision} />}

            {/* Middle Row: Market Data (2 columns) + Risk Profile (1 column) */}
            <BentoMarket marketData={data.marketData} priceHistory={data.priceHistory} />
            <BentoRisk riskSummary={data.riskSummary} />

            {/* Bottom Row: Pipeline, News, Evidence */}
            {data.pipeline && <BentoPipeline data={data} />}
            {data.news && <BentoNews news={data.news} />}
            <BentoEvidence explainability={data.explainability} />
          </div>
        )}

      </main>
    </div>
  );
}
