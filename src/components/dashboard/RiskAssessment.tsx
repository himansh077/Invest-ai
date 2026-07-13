import { RiskSummary, RiskSeverity } from "@/types/research";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface RiskAssessmentProps {
  riskSummary: RiskSummary | null;
}

export function RiskAssessment({ riskSummary }: RiskAssessmentProps) {
  if (!riskSummary) return null;

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Low": return "text-emerald-400 bg-emerald-500/20 border-emerald-500/30";
      case "Moderate": return "text-amber-400 bg-amber-500/20 border-amber-500/30";
      case "High": return "text-rose-400 bg-rose-500/20 border-rose-500/30";
      case "Critical": return "text-red-500 bg-red-500/20 border-red-500/30";
      default: return "text-muted-foreground bg-secondary border-border";
    }
  };

  const getSeverityColor = (severity: RiskSeverity) => {
    switch (severity) {
      case "low": return "text-emerald-400";
      case "medium": return "text-amber-400";
      case "high": return "text-rose-400";
      case "critical": return "text-red-500 font-black";
      default: return "text-muted-foreground";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-6 flex flex-col h-full"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-500/20 rounded-lg">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
          </div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Risk Assessment</h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${getRiskColor(riskSummary.level)}`}>
          {riskSummary.level} Risk
        </div>
      </div>

      {/* Risk Gauge */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Overall Risk Score</span>
          <span className="text-2xl font-black text-foreground">{riskSummary.overallScore}/100</span>
        </div>
        <div className="relative h-3 bg-secondary/50 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${
              riskSummary.overallScore < 30 ? "bg-emerald-500" :
              riskSummary.overallScore < 60 ? "bg-amber-500" :
              riskSummary.overallScore < 80 ? "bg-rose-500" : "bg-red-500"
            }`}
            style={{ width: `${riskSummary.overallScore}%` }}
          />
        </div>
      </div>

      {/* Core Reasons */}
      <div className="bg-secondary/30 rounded-2xl p-4 border border-white/5 mb-6">
        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Primary Concerns</div>
        <ul className="space-y-2">
          {riskSummary.reasons.map((reason, i) => (
            <li key={i} className="text-sm text-foreground/80 leading-relaxed flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400/70 shrink-0 mt-0.5" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Detailed Risks List */}
      <div className="flex-1 overflow-y-auto pr-2 hide-scrollbar space-y-3">
        {riskSummary.risks.map((risk) => (
          <div key={risk.id} className="bg-background/40 rounded-xl p-4 border border-white/5">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-white/10 bg-white/5 text-muted-foreground">
                  {risk.category}
                </span>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${getSeverityColor(risk.severity)}`}>
                {risk.severity}
              </span>
            </div>
            <h4 className="text-sm font-bold text-foreground mb-1">{risk.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{risk.description}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
