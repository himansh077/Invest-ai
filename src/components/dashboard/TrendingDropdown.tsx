import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function TrendingDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  const trendingStats = [
    { label: "S&P 500", value: "5,123.41", change: "+1.2%", positive: true },
    { label: "NASDAQ", value: "16,234.12", change: "+1.8%", positive: true },
    { label: "VIX", value: "13.24", change: "-4.5%", positive: false },
    { label: "US 10Y", value: "4.21%", change: "+0.02", positive: true }
  ];

  const trendingNews = [
    { source: "REUTERS", headline: "Fed signals potential rate cuts by Q3", time: "2H AGO" },
    { source: "BLOOMBERG", headline: "Tech sector earnings exceed analyst expectations", time: "4H AGO" },
    { source: "WSJ", headline: "Global supply chain pressures ease", time: "5H AGO" }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 reveal-elem delay-3">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[#0a0a0a] border border-white/5 hover:border-[#00f0ff]/50 px-6 py-4 transition-all group"
      >
        <span className="mono text-xs tracking-[0.2em] text-[#94a3b8] group-hover:text-[#00f0ff] transition-colors flex items-center gap-2">
          <span className="opacity-50">&gt;</span> SYS.TRENDING_MARKET_INTEL
        </span>
        <ChevronDown className={`h-4 w-4 text-[#94a3b8] transition-transform duration-300 ${isOpen ? "rotate-180 text-[#00f0ff]" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-black/40 border-x border-b border-white/5"
          >
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Macro Indicators */}
              <div>
                <span className="mono text-[10px] text-[#888888] tracking-widest block mb-4 border-b border-white/5 pb-2">MACRO_INDICATORS</span>
                <div className="grid grid-cols-2 gap-4">
                  {trendingStats.map((stat, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <span className="mono text-[9px] text-[#555] tracking-widest">{stat.label}</span>
                      <span className="mono text-sm text-white font-bold">{stat.value}</span>
                      <span className={`mono text-[9px] font-bold ${stat.positive ? "text-[#27c93f]" : "text-[#ff5f56]"}`}>
                        {stat.change}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Breaking News */}
              <div>
                <span className="mono text-[10px] text-[#888888] tracking-widest block mb-4 border-b border-white/5 pb-2">GLOBAL_FEED</span>
                <div className="flex flex-col gap-3">
                  {trendingNews.map((news, i) => (
                    <div key={i} className="flex flex-col gap-1 hover:bg-white/5 p-2 -mx-2 rounded transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="mono text-[9px] text-[#00f0ff] bg-[#00f0ff]/10 px-1.5 py-0.5 rounded-sm">{news.source}</span>
                        <span className="mono text-[8px] text-[#555]">{news.time}</span>
                      </div>
                      <span className="text-xs text-white/80 leading-snug">{news.headline}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
