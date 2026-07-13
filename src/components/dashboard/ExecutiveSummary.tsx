import { CompanyProfile, InvestmentThesis } from "@/types/research";
import { Lightbulb, Target, ArrowUpRight, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface ExecutiveSummaryProps {
  profile: CompanyProfile;
  thesis: InvestmentThesis | null;
}

export function ExecutiveSummary({ profile, thesis }: ExecutiveSummaryProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Profile Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 lg:col-span-1 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black text-foreground mb-1">{profile.name}</h2>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <span>{profile.ticker}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{profile.sector}</span>
            </div>
          </div>
          <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-lg font-mono text-lg font-bold shadow-lg">
            ${profile.price.toFixed(2)}
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-4">
          {profile.description}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/40 rounded-xl p-3 border border-white/5">
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Market Cap</div>
            <div className="font-mono text-foreground font-bold">{profile.marketCap}</div>
          </div>
          <div className="bg-secondary/40 rounded-xl p-3 border border-white/5">
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">CEO</div>
            <div className="text-sm text-foreground font-bold truncate">{profile.ceo}</div>
          </div>
        </div>
      </motion.div>

      {/* Thesis Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-3xl p-6 lg:col-span-2 relative overflow-hidden"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-emerald-500/20 rounded-lg">
            <Lightbulb className="h-5 w-5 text-emerald-400" />
          </div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">AI Investment Thesis</h3>
        </div>

        {thesis ? (
          <div className="space-y-6">
            <p className="text-sm md:text-base text-foreground leading-relaxed font-medium bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
              {thesis.thesis}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {thesis.strengths.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">
                    <ArrowUpRight className="h-3 w-3" /> Core Strengths
                  </div>
                  <ul className="space-y-2">
                    {thesis.strengths.slice(0, 3).map((s, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {thesis.weaknesses.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">
                    <AlertTriangle className="h-3 w-3" /> Key Weaknesses
                  </div>
                  <ul className="space-y-2">
                    {thesis.weaknesses.slice(0, 3).map((w, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-2">
                        <span className="text-rose-500 mt-0.5">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[150px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
              <Target className="h-8 w-8 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest">Reasoning Engine Active...</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
