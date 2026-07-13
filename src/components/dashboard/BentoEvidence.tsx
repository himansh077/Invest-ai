import { ExplainabilityTrace } from "@/types/research";

export default function BentoEvidence({ explainability }: { explainability: ExplainabilityTrace | null }) {
  if (!explainability) return null;

  return (
    <div className="bento-card reveal-elem delay-4 bento-hover p-8 md:col-span-3 lg:col-span-1 flex flex-col h-full">
      <div className="border-b border-white/5 pb-4 mb-6 flex justify-between items-center">
        <span className="mono text-xs text-[#94a3b8] flex items-center gap-2">
          <span className="opacity-50">&gt;</span> SYS.DECISION_TRACE
        </span>
      </div>

      <div className="bg-[#00f0ff]/5 rounded-sm p-4 border border-[#00f0ff]/10 mb-6">
        <div className="text-[9px] font-black text-[#00f0ff] uppercase tracking-widest mb-3 flex items-center gap-2">
          &gt; AUDIT_TRAIL_SUMMARY
        </div>
        <p className="text-xs text-white/90 leading-relaxed font-medium">
          {explainability.executiveSummary}
        </p>
      </div>

      <div className="text-[10px] font-black text-[#888888] uppercase tracking-widest mb-4">REASONING_TRACE_LOG</div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
        {explainability.decisionTree.map((step) => (
          <div key={step.id} className="relative pl-4 border-l border-white/10 hover:border-[#00f0ff]/50 transition-colors">
            {/* Blinking Node */}
            <div className="absolute -left-[3px] top-1.5 h-1.5 w-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
            
            <div className="bg-[#0a0a0a] rounded-sm p-3 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm bg-white/5 text-[#888888]">
                  {step.source}_AGENT
                </span>
              </div>
              <h4 className="text-xs font-semibold text-white mb-2 flex items-start gap-2">
                <span className="text-[#00f0ff] mt-0.5">&gt;</span>
                {step.claim}
              </h4>
              <div className="bg-black/50 rounded-sm p-2 border border-white/5">
                <div className="text-[8px] text-[#555] font-bold uppercase tracking-widest mb-1">EVIDENCE_SOURCE</div>
                <p className="text-[10px] text-[#888888] italic font-mono leading-relaxed">
                  &quot;{step.evidence}&quot;
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
