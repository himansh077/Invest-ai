import { InvestmentDecision } from "@/types/research";
import { Layers, Crosshair, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface InvestmentRecommendationProps {
  decision: InvestmentDecision | null;
}

export function InvestmentRecommendation({ decision }: InvestmentRecommendationProps) {
  if (!decision) return null;

  const getVerdictGradient = (verdict: string) => {
    switch (verdict) {
      case "BUY": return "from-emerald-600 via-emerald-500 to-teal-400";
      case "WATCH": return "from-amber-600 via-amber-500 to-orange-400";
      case "PASS": return "from-rose-600 via-rose-500 to-pink-400";
      default: return "from-slate-600 to-slate-400";
    }
  };

  const getVerdictText = (verdict: string) => {
    switch (verdict) {
      case "BUY": return "text-emerald-400";
      case "WATCH": return "text-amber-400";
      case "PASS": return "text-rose-400";
      default: return "text-muted-foreground";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-6 relative overflow-hidden h-full flex flex-col"
    >
      {/* Top indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${getVerdictGradient(decision.verdict)}`} />

      <div className="flex justify-between items-center mb-6 pt-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-violet-500/20 rounded-lg">
            <Layers className="h-5 w-5 text-violet-400" />
          </div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Final Verdict</h3>
        </div>
      </div>

      {/* Main Verdict Display */}
      <div className="flex flex-col items-center justify-center py-6 mb-6">
        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Recommendation</div>
        <div className={`text-6xl md:text-7xl font-black tracking-tight ${getVerdictText(decision.verdict)}`}>
          {decision.verdict}
        </div>
      </div>

      {/* Confidence & Horizon */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-secondary/30 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
          <Crosshair className="h-4 w-4 text-muted-foreground mb-2" />
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Confidence</div>
          <div className="text-2xl font-black text-foreground">{decision.confidence}%</div>
          <div className="w-full h-1 bg-secondary mt-2 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getVerdictText(decision.verdict).replace("text-", "bg-")}`} 
              style={{ width: `${decision.confidence}%` }}
            />
          </div>
        </div>

        <div className="bg-secondary/30 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
          <Clock className="h-4 w-4 text-muted-foreground mb-2" />
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Horizon</div>
          <div className="text-xl font-black text-foreground whitespace-nowrap">{decision.investmentHorizon}</div>
        </div>
      </div>

      {/* Narrative & Rationale */}
      <div className="flex-1 space-y-4">
        <div>
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Expected Return</div>
          <p className="text-sm text-foreground/90 font-medium bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
            {decision.expectedReturnNarrative}
          </p>
        </div>

        <div>
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Rationale</div>
          <p className="text-xs text-muted-foreground leading-relaxed p-2">
            {decision.rationale}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
