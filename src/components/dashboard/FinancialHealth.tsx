import { Financials } from "@/types/research";
import { DollarSign, Activity } from "lucide-react";
import { motion } from "framer-motion";

interface FinancialHealthProps {
  financials: Financials;
}

export function FinancialHealth({ financials }: FinancialHealthProps) {
  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-400";
    if (score >= 55) return "text-indigo-400";
    if (score >= 35) return "text-amber-400";
    return "text-rose-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 75) return "bg-emerald-500/20 border-emerald-500/30";
    if (score >= 55) return "bg-indigo-500/20 border-indigo-500/30";
    if (score >= 35) return "bg-amber-500/20 border-amber-500/30";
    return "bg-rose-500/20 border-rose-500/30";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-6 relative overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="p-1.5 bg-blue-500/20 rounded-lg">
          <DollarSign className="h-5 w-5 text-blue-400" />
        </div>
        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Financial Health</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Revenue", value: financials.revenue, highlight: false },
          { label: "Net Income", value: financials.netIncome, highlight: false },
          { label: "Operating Income", value: financials.operatingIncome, highlight: false },
          { label: "Free Cash Flow", value: financials.freeCashFlow, highlight: false },
        ].map((stat, i) => (
          <div key={i} className="bg-secondary/30 rounded-2xl p-4 border border-white/5">
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2">{stat.label}</div>
            <div className="text-xl font-black text-foreground">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className={`col-span-1 rounded-2xl p-6 border ${getScoreBg(financials.healthScore.score)} flex flex-col justify-center items-center text-center`}>
          <Activity className={`h-8 w-8 mb-4 ${getScoreColor(financials.healthScore.score)}`} />
          <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Health Score</div>
          <div className={`text-6xl font-black mb-2 ${getScoreColor(financials.healthScore.score)}`}>
            {financials.healthScore.score}
          </div>
          <div className="font-bold text-sm tracking-widest uppercase">{financials.healthScore.label}</div>
        </div>

        {/* Metrics Grid */}
        <div className="col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "P/E Ratio", value: financials.peRatio || "N/A" },
            { label: "EPS", value: financials.eps ? `$${financials.eps}` : "N/A" },
            { label: "ROE", value: financials.roe ? `${financials.roe}%` : "N/A" },
            { label: "ROA", value: financials.roa ? `${financials.roa}%` : "N/A" },
            { label: "Op Margin", value: financials.operatingMargin },
            { label: "Net Margin", value: financials.netMargin },
            { label: "D/E Ratio", value: financials.debtToEquity },
            { label: "Rev Growth", value: financials.revenueGrowthYoY, color: financials.revenueGrowthYoY.startsWith("+") ? "text-emerald-400" : "text-rose-400" },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col justify-center p-3 border-b border-border/40">
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{stat.label}</div>
              <div className={`text-lg font-bold ${stat.color || "text-foreground"}`}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
