import { ResearchState } from "@/types/research";

export default function BentoFinancials({ financials }: { financials: NonNullable<ResearchState["financials"]> }) {
  // Convert standard financial fields into skill-bar style metrics
  const metrics = [
    { label: "P/E RATIO", value: financials.peRatio, max: 40, reverse: true }, // Lower is better
    { label: "ROE", value: financials.roe, max: 0.4 }, // 40% max ROE scale
    { label: "ROA", value: financials.roa, max: 0.2 }, // 20% max ROA scale
    { label: "DEBT / EQUITY", value: financials.debtToEquity, max: 2, reverse: true }, // Lower is better
  ];

  return (
    <div className="bento-card reveal-elem delay-1 bento-hover p-8 md:col-span-1">
      <div className="border-b border-white/5 pb-4 mb-6 flex justify-between items-center">
        <span className="mono text-xs text-[#94a3b8] flex items-center gap-2">
          <span className="opacity-50">&gt;</span> SYS.FINANCIALS
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-cyber-cyan)" strokeWidth="2" width="16" height="16" className="opacity-50">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
      </div>

      <div className="flex flex-col gap-6">
        {metrics.map((metric, i) => {
          let percentage = 0;
          if (typeof metric.value === 'number') {
            if (metric.reverse) {
              percentage = Math.max(0, Math.min(100, 100 - (metric.value / metric.max) * 100));
            } else {
              percentage = Math.max(0, Math.min(100, (metric.value / metric.max) * 100));
            }
          }

          const displayValue = typeof metric.value === 'number' 
            ? (metric.label.includes("RATIO") || metric.label.includes("DEBT") ? metric.value.toFixed(2) : (metric.value * 100).toFixed(1) + "%")
            : "N/A";

          return (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="mono text-xs text-white">{metric.label}</span>
                <span className="mono text-[10px] text-[#888888]">{displayValue}</span>
              </div>
              <div className="h-1.5 bg-white/5 w-full relative overflow-hidden rounded-full">
                <div 
                  className="absolute top-0 left-0 h-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff] transition-all duration-1000 ease-out" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4 mono text-[10px]">
        <div>
          <div className="text-[#888888] mb-1">FREE CASH FLOW</div>
          <div className="text-white font-bold">{financials.freeCashFlow ?? "N/A"}</div>
        </div>
        <div>
          <div className="text-[#888888] mb-1">HEALTH SCORE</div>
          <div className="text-white font-bold">{financials.healthScore?.score ?? "N/A"} / 100</div>
        </div>
      </div>
    </div>
  );
}
