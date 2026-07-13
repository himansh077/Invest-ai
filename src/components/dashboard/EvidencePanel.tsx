import { ExplainabilityTrace } from "@/types/research";
import { Search, ChevronRight, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface EvidencePanelProps {
  explainability: ExplainabilityTrace | null;
}

export function EvidencePanel({ explainability }: EvidencePanelProps) {
  if (!explainability) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-6 flex flex-col"
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="p-1.5 bg-sky-500/20 rounded-lg">
          <Search className="h-5 w-5 text-sky-400" />
        </div>
        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Evidence & Explainability</h3>
      </div>

      {/* Executive Summary */}
      <div className="bg-sky-500/5 rounded-2xl p-5 border border-sky-500/10 mb-6">
        <div className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <FileText className="h-3 w-3" /> Audit Trail Summary
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed font-medium">
          {explainability.executiveSummary}
        </p>
      </div>

      {/* Decision Tree Timeline */}
      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Reasoning Trace</div>
      
      <div className="relative border-l border-white/10 ml-3 space-y-6 pb-4 flex-1 overflow-y-auto hide-scrollbar pr-2">
        {explainability.decisionTree.map((step) => (
          <div key={step.id} className="relative pl-6">
            {/* Timeline Node */}
            <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-sky-500 ring-4 ring-background" />
            
            <div className="bg-secondary/20 hover:bg-secondary/40 border border-white/5 rounded-xl p-4 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/10">
                  {step.source} Agent
                </span>
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-start gap-2">
                <ChevronRight className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                {step.claim}
              </h4>
              <div className="bg-background/50 rounded-lg p-3 border border-white/5">
                <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Evidence Source</div>
                <p className="text-xs text-muted-foreground italic font-mono leading-relaxed">
                  &quot;{step.evidence}&quot;
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
