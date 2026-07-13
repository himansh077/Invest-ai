import { MarketData } from "@/types/research";
import { BarChart2, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface MarketAnalysisProps {
  marketData: MarketData | null;
}

export function MarketAnalysis({ marketData }: MarketAnalysisProps) {
  if (!marketData) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-6 relative"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/20 rounded-lg">
            <BarChart2 className="h-5 w-5 text-indigo-400" />
          </div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Market Analysis</h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1 ${
          marketData.trend === "Bullish" ? "bg-emerald-500/20 text-emerald-400" :
          marketData.trend === "Bearish" ? "bg-rose-500/20 text-rose-400" :
          "bg-amber-500/20 text-amber-400"
        }`}>
          {marketData.trend === "Bullish" ? <TrendingUp className="h-3 w-3" /> : 
           marketData.trend === "Bearish" ? <TrendingDown className="h-3 w-3" /> : null}
          {marketData.trend}
        </div>
      </div>

      <div className="space-y-8">
        {/* 52 Week Range */}
        <div>
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
            <span>52W Low: ${marketData.fiftyTwoWeekLow.toFixed(2)}</span>
            <span className="text-foreground">Current: ${marketData.currentPrice.toFixed(2)}</span>
            <span>52W High: ${marketData.fiftyTwoWeekHigh.toFixed(2)}</span>
          </div>
          <div className="relative h-2 bg-secondary/50 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
              style={{ 
                width: `${Math.min(100, Math.max(0, ((marketData.currentPrice - marketData.fiftyTwoWeekLow) / (marketData.fiftyTwoWeekHigh - marketData.fiftyTwoWeekLow)) * 100))}%` 
              }}
            />
          </div>
        </div>

        {/* Technical Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-secondary/30 rounded-xl p-4 border border-white/5">
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">RSI (14)</div>
            <div className={`text-2xl font-black ${
              (marketData.rsi ?? 50) >= 70 ? "text-rose-400" :
              (marketData.rsi ?? 50) <= 30 ? "text-emerald-400" :
              "text-foreground"
            }`}>
              {marketData.rsi ?? "N/A"}
            </div>
            <div className="text-[9px] text-muted-foreground mt-1 uppercase tracking-widest">
              {(marketData.rsi ?? 50) >= 70 ? "Overbought" : (marketData.rsi ?? 50) <= 30 ? "Oversold" : "Neutral"}
            </div>
          </div>

          <div className="bg-secondary/30 rounded-xl p-4 border border-white/5">
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Beta</div>
            <div className="text-2xl font-black text-foreground">{marketData.beta}</div>
            <div className="text-[9px] text-muted-foreground mt-1 uppercase tracking-widest">
              {marketData.beta > 1 ? "High Volatility" : "Low Volatility"}
            </div>
          </div>

          <div className="bg-secondary/30 rounded-xl p-4 border border-white/5">
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">50d MA</div>
            <div className="text-2xl font-black text-foreground">${marketData.movingAverage50d.toFixed(2)}</div>
          </div>

          <div className="bg-secondary/30 rounded-xl p-4 border border-white/5">
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Volume</div>
            <div className="text-2xl font-black text-foreground truncate" title={marketData.volume}>{marketData.volume}</div>
            <div className="text-[9px] text-muted-foreground mt-1 uppercase tracking-widest truncate">Avg: {marketData.avgVolume}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
