import { Activity } from "lucide-react";
import { ResearchState } from "@/types/research";

export default function BentoProfile({ profile }: { profile: NonNullable<ResearchState["profile"]> }) {
  return (
    <div className="bento-card reveal-elem bento-hover p-8 md:col-span-2">
      {/* HUD Header */}
      <div className="border-b border-white/5 pb-4 mb-6 flex justify-between items-center">
        <span className="mono text-xs text-[#94a3b8] flex items-center gap-2">
          <div className="pulse-dot"></div>
          SYS.COMPANY_PROFILE
        </span>
        <span className="mono text-xs text-[#888888] tracking-widest">
          ID: {profile.ticker}
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: Ticker Block */}
        <div className="flex-shrink-0 flex flex-col gap-5">
          <div className="w-32 h-32 tech-frame flex items-center justify-center bg-black/60">
            <div className="tech-corner-tl"></div>
            <div className="tech-corner-tr"></div>
            <div className="tech-corner-bl"></div>
            <div className="tech-corner-br"></div>
            <span className="text-4xl font-bold text-white tracking-tighter">{profile.ticker}</span>
          </div>

          <div className="mono text-[10px] flex flex-col gap-3 pt-4 border-t border-white/5">
            <div className="flex justify-between gap-4"><span className="text-[#888888]">SECTOR:</span> <span className="text-white text-right truncate max-w-[120px]">{profile.sector}</span></div>
            <div className="flex justify-between gap-4"><span className="text-[#888888]">MKT_CAP:</span> <span className="text-white">{profile.marketCap}</span></div>
            <div className="flex justify-between gap-4"><span className="text-[#888888]">SYS_STATUS:</span> <span className="text-[#00f0ff] drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">ONLINE</span></div>
          </div>
        </div>

        {/* Right: Bio & Stats */}
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="text-3xl font-bold mb-2 tracking-tight text-white">{profile.name}</h3>
          
          <div className="mono text-[10px] text-[#00f0ff] mb-6 flex justify-between items-center bg-[#00f0ff]/5 p-2 rounded-sm border border-[#00f0ff]/20">
            <span>&gt; EXECUTING PROFILE_LOG.EXE ...</span>
            <span>[ PRICE: ${profile.price.toFixed(2)} ]</span>
          </div>

          <p className="text-[#888888] text-sm leading-relaxed mb-6 font-light">
            {profile.description}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-3 mt-auto">
            <span className="tech-badge">
              <span className="text-[#00f0ff]">&gt;</span> {profile.industry}
            </span>
            <span className="tech-badge">
              <span className="text-[#00f0ff]">&gt;</span> CEO: {profile.ceo}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
