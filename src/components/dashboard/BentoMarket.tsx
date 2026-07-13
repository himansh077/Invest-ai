import { MarketData, PricePoint } from "@/types/research";
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip, XAxis } from "recharts";

interface BentoMarketProps {
  marketData: MarketData | null;
  priceHistory: PricePoint[] | null;
}

export default function BentoMarket({ marketData, priceHistory }: BentoMarketProps) {
  if (!marketData) return null;

  const fiftyTwoWkProgress = Math.min(100, Math.max(0, 
    ((marketData.currentPrice - marketData.fiftyTwoWeekLow) / 
    (marketData.fiftyTwoWeekHigh - marketData.fiftyTwoWeekLow)) * 100
  ));

  return (
    <div className="bento-card reveal-elem delay-2 bento-hover p-8 md:col-span-3 lg:col-span-2">
      <div className="border-b border-white/5 pb-4 mb-6 flex justify-between items-center">
        <span className="mono text-xs text-[#94a3b8] flex items-center gap-2">
          <span className="opacity-50">&gt;</span> SYS.MARKET_INTELLIGENCE
        </span>
        <span className={`px-2 py-0.5 mono text-[10px] font-bold ${
          marketData.trend === "Bullish" ? "text-[#27c93f] bg-white/5" :
          marketData.trend === "Bearish" ? "text-[#ff5f56] bg-white/5" :
          "text-[#ffbd2e] bg-white/5"
        }`}>
          {marketData.trend === "Bullish" ? "+ BULLISH" : marketData.trend === "Bearish" ? "- BEARISH" : "~ NEUTRAL"}
        </span>
      </div>

      {/* 52 Week Range */}
      <div className="mb-8">
        <div className="flex justify-between text-mono text-[10px] text-[#888888] mb-2">
          <span>52W_LOW: ${marketData.fiftyTwoWeekLow.toFixed(2)}</span>
          <span className="text-[#00f0ff]">CURRENT: ${marketData.currentPrice.toFixed(2)}</span>
          <span>52W_HIGH: ${marketData.fiftyTwoWeekHigh.toFixed(2)}</span>
        </div>
        <div className="h-1 bg-white/5 w-full relative overflow-hidden rounded-full">
          <div 
            className="absolute top-0 left-0 h-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff] transition-all duration-1000 ease-out"
            style={{ width: `${fiftyTwoWkProgress}%` }}
          />
        </div>
      </div>

      {/* Tech Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="tech-badge flex-col items-start gap-1 p-3">
          <span className="text-[#888888] text-[9px]">RSI(14)</span>
          <span className={`text-lg font-bold ${
            (marketData.rsi ?? 50) >= 70 ? "text-[#ff5f56]" :
            (marketData.rsi ?? 50) <= 30 ? "text-[#27c93f]" :
            "text-white"
          }`}>{marketData.rsi ?? "N/A"}</span>
        </div>
        <div className="tech-badge flex-col items-start gap-1 p-3">
          <span className="text-[#888888] text-[9px]">BETA</span>
          <span className="text-lg font-bold text-[#00f0ff]">{marketData.beta}</span>
        </div>
        <div className="tech-badge flex-col items-start gap-1 p-3">
          <span className="text-[#888888] text-[9px]">50D_MA</span>
          <span className="text-lg font-bold text-white">${marketData.movingAverage50d.toFixed(2)}</span>
        </div>
        <div className="tech-badge flex-col items-start gap-1 p-3">
          <span className="text-[#888888] text-[9px]">VOL (AVG)</span>
          <span className="text-sm font-bold text-white truncate w-full" title={marketData.avgVolume}>{marketData.avgVolume}</span>
        </div>
      </div>

      {/* Chart */}
      {priceHistory && priceHistory.length > 0 && (
        <div className="h-[200px] w-full mt-4 relative">
          <div className="absolute top-0 left-0 text-[9px] mono text-[#555]">12M_PRICE_HISTORY</div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceHistory} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ backgroundColor: '#050505', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', fontFamily: 'monospace' }}
                itemStyle={{ color: '#00f0ff' }}
                formatter={(value: any) => [typeof value === 'number' ? `$${value.toFixed(2)}` : value, "Price"]}
                labelStyle={{ color: '#888' }}
              />
              <YAxis domain={['auto', 'auto']} hide />
              <XAxis dataKey="date" hide />
              <Area type="monotone" dataKey="price" stroke="#00f0ff" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
