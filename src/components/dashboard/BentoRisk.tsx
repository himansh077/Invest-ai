import { RiskSummary, RiskSeverity } from "@/types/research";

export default function BentoRisk({ riskSummary }: { riskSummary: RiskSummary | null }) {
  if (!riskSummary) return null;

  const getSeverityColor = (severity: RiskSeverity) => {
    switch (severity) {
      case "low": return "text-[#27c93f]";
      case "medium": return "text-[#ffbd2e]";
      case "high": return "text-[#ff5f56]";
      case "critical": return "text-[#ff0000]";
      default: return "text-[#888888]";
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Low": return "#27c93f";
      case "Moderate": return "#ffbd2e";
      case "High": return "#ff5f56";
      case "Critical": return "#ff0000";
      default: return "#888888";
    }
  };

  const circumference = 339.292;
  const offset = circumference - (riskSummary.overallScore / 100) * circumference;
  const mainColor = getRiskColor(riskSummary.level);

  return (
    <div className="bento-card reveal-elem delay-3 bento-hover p-8 md:col-span-1 flex flex-col h-full">
      <div className="border-b border-white/5 pb-4 mb-6 flex justify-between items-center">
        <span className="mono text-xs text-[#94a3b8] flex items-center gap-2">
          <span className="opacity-50">&gt;</span> SYS.RISK_PROFILE
        </span>
        <span className="px-2 py-0.5 mono text-[10px] font-bold bg-white/5" style={{ color: mainColor }}>
          {riskSummary.level.toUpperCase()} RISK
        </span>
      </div>

      <div className="flex justify-center mb-6">
        <div className="stat-circle">
          <svg className="progress-ring" width="120" height="120">
            <circle className="ring-bg" cx="60" cy="60" r="54"></circle>
            <circle 
              className="ring-fg" 
              cx="60" cy="60" r="54" 
              style={{ 
                strokeDashoffset: offset,
                stroke: mainColor,
                boxShadow: `0 0 10px ${mainColor}` 
              }}
            ></circle>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-2xl font-bold text-white tracking-tighter">
              {riskSummary.overallScore}
            </span>
            <span className="text-[10px] font-bold" style={{ color: mainColor }}>SCORE</span>
          </div>
        </div>
      </div>

      <div className="tech-frame p-4 bg-black/40 mb-6">
        <div className="tech-corner-tl !border-[#ffbd2e]"></div>
        <div className="tech-corner-br !border-[#ffbd2e]"></div>
        <div className="mono text-[10px] text-[#ffbd2e] mb-3">PRIMARY_CONCERNS</div>
        <ul className="flex flex-col gap-2">
          {riskSummary.reasons.map((reason, i) => (
            <li key={i} className="text-xs text-white/70 flex items-start gap-2 leading-relaxed">
              <span className="text-[#ffbd2e] mt-0.5">&gt;</span>{reason}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
        {riskSummary.risks.map((risk) => (
          <div key={risk.id} className="bg-[#0a0a0a] rounded-sm p-3 border-l-2 border-white/5 hover:border-[#ff5f56]/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm bg-white/5 text-[#888888]">
                {risk.category}
              </span>
              <span className={`text-[9px] font-black uppercase tracking-widest ${getSeverityColor(risk.severity)}`}>
                [{risk.severity}]
              </span>
            </div>
            <h4 className="text-xs font-bold text-white mb-1">{risk.title}</h4>
            <p className="text-[10px] text-[#888888] leading-relaxed">{risk.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
