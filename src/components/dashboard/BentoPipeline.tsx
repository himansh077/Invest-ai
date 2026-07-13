import { ResearchState } from "@/types/research";
import { motion } from "framer-motion";

export default function BentoPipeline({ data }: { data: ResearchState }) {
  return (
    <div className="bento-card reveal-elem delay-4 bento-hover p-8 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8">
      
      {/* Column 1: Pipeline Execution Log */}
      <div className="col-span-1 flex flex-col gap-4">
        <div className="border-b border-white/5 pb-4 mb-2 flex justify-between items-center">
          <span className="mono text-xs text-[#94a3b8] flex items-center gap-2">
            <span className="opacity-50">&gt;</span> SYS.PIPELINE_LOG
          </span>
        </div>
        
        <div className="flex flex-col gap-3 font-mono text-[10px] tracking-widest text-[#888888]">
          {data.pipeline.map((step, idx) => (
            <div key={step.id} className="flex justify-between items-center bg-black/40 p-2 border border-white/5">
              <span className="flex items-center gap-2">
                <span className="text-white opacity-50">{idx + 1}.</span> 
                {(step.title || "").toUpperCase()}
              </span>
              <span className={`px-2 py-1 ${
                step.status === "complete" ? "text-[#27c93f] bg-[#27c93f]/10" :
                step.status === "processing" ? "text-[#00f0ff] bg-[#00f0ff]/10 animate-pulse" :
                step.status === "error" ? "text-[#ff5f56] bg-[#ff5f56]/10" :
                "text-[#555555]"
              }`}>
                [{step.status === "complete" ? "OK" : step.status === "processing" ? "EXE" : step.status === "error" ? "ERR" : "WAIT"}]
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Column 2 & 3: Investment Thesis */}
      {data.investmentThesis && (
        <div className="col-span-1 md:col-span-2 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8">
          <div className="border-b border-white/5 pb-4 mb-2 flex justify-between items-center">
            <span className="mono text-xs text-[#94a3b8] flex items-center gap-2">
              <span className="opacity-50">&gt;</span> SYS.INVESTMENT_THESIS
            </span>
          </div>

          <p className="text-sm text-white/90 leading-relaxed font-light mb-4">
            {data.investmentThesis.thesis}
          </p>

          <div className="grid grid-cols-2 gap-6 mt-auto">
            {data.investmentThesis.strengths.length > 0 && (
              <div className="tech-frame p-4 bg-black/40">
                <div className="tech-corner-tl !border-[#27c93f]"></div>
                <div className="tech-corner-br !border-[#27c93f]"></div>
                <div className="mono text-[10px] text-[#27c93f] mb-3">STRENGTHS</div>
                <ul className="flex flex-col gap-2">
                  {data.investmentThesis.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-white/70 flex gap-2"><span className="text-[#27c93f]">&gt;</span>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {data.investmentThesis.weaknesses.length > 0 && (
              <div className="tech-frame p-4 bg-black/40">
                <div className="tech-corner-tl !border-[#ff5f56]"></div>
                <div className="tech-corner-br !border-[#ff5f56]"></div>
                <div className="mono text-[10px] text-[#ff5f56] mb-3">WEAKNESSES</div>
                <ul className="flex flex-col gap-2">
                  {data.investmentThesis.weaknesses.map((w, i) => (
                    <li key={i} className="text-xs text-white/70 flex gap-2"><span className="text-[#ff5f56]">&gt;</span>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
