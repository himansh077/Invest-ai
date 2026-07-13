import { ResearchState } from "@/types/research";

export default function BentoRecommendation({ decision }: { decision: NonNullable<ResearchState["decision"]> }) {
  const isBuy = decision.verdict === "BUY";
  const isWatch = decision.verdict === "WATCH";
  const colorClass = isBuy ? "text-[#27c93f]" : isWatch ? "text-[#ffbd2e]" : "text-[#ff5f56]";
  const bgClass = isBuy ? "bg-[#27c93f]" : isWatch ? "bg-[#ffbd2e]" : "bg-[#ff5f56]";
  
  // Calculate circumference for progress ring (r=54) -> c = 2 * PI * 54 = 339.292
  const circumference = 339.292;
  const offset = circumference - (decision.confidence / 100) * circumference;

  return (
    <div className="bento-card reveal-elem delay-2 bento-hover p-8 md:col-span-1 flex flex-col items-center justify-center relative">
      <div className="absolute top-0 right-0 p-4">
        <span className="mono text-[10px] text-[#888888] tracking-widest">
          SYS.VERDICT
        </span>
      </div>

      <div className="stat-circle mb-6 mt-4">
        <svg className="progress-ring" width="120" height="120">
          <circle className="ring-bg" cx="60" cy="60" r="54"></circle>
          <circle 
            className="ring-fg" 
            cx="60" cy="60" r="54" 
            style={{ 
              strokeDashoffset: offset,
              stroke: isBuy ? "#27c93f" : isWatch ? "#ffbd2e" : "#ff5f56",
              boxShadow: `0 0 10px ${isBuy ? "#27c93f" : isWatch ? "#ffbd2e" : "#ff5f56"}` 
            }}
          ></circle>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-bold text-white tracking-tighter">
            {decision.confidence}
          </span>
          <span className={`text-[10px] font-bold ${colorClass}`}>%</span>
        </div>
      </div>

      <span className={`mono text-xs font-bold tracking-widest text-center border border-white/10 px-4 py-1.5 ${colorClass} bg-black/50`}>
        VERDICT: {decision.verdict}
      </span>

      <div className="mt-8 flex gap-2 flex-wrap justify-center w-full">
        <span className="tech-badge w-full justify-between">
          <span>HORIZON</span>
          <span className="text-white">{decision.investmentHorizon}</span>
        </span>
        <span className="tech-badge w-full justify-between">
          <span>NARRATIVE</span>
          <span className="text-white truncate max-w-[150px] text-right" title={decision.expectedReturnNarrative}>{decision.expectedReturnNarrative}</span>
        </span>
      </div>
    </div>
  );
}
