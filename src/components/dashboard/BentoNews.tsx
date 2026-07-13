import { ResearchState } from "@/types/research";

export default function BentoNews({ news }: { news: NonNullable<ResearchState["news"]> }) {
  if (!news.length) return null;

  return (
    <div className="bento-card reveal-elem delay-3 bento-hover p-8 md:col-span-2">
      <div className="border-b border-white/5 pb-4 mb-6 flex justify-between items-center">
        <span className="mono text-xs text-[#94a3b8] flex items-center gap-2">
          <span className="opacity-50">&gt;</span> SYS.NEWS_STREAM
        </span>
      </div>

      <div className="flex flex-col gap-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {news.map((item, i) => (
          <div key={i} className="flex gap-4 border-l-2 border-white/5 pl-4 hover:border-[#00f0ff]/50 transition-colors">
            <div className="flex-shrink-0 mt-1">
              <span className={`mono text-sm font-bold ${
                item.sentiment === "positive" ? "text-[#27c93f]" :
                item.sentiment === "negative" ? "text-[#ff5f56]" : "text-[#ffbd2e]"
              }`}>
                [{item.sentiment === "positive" ? "+" : item.sentiment === "negative" ? "−" : "~"}]
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <a href={item.url} target="_blank" rel="noreferrer" className="text-white text-sm font-medium hover:text-[#00f0ff] transition-colors leading-tight">
                {item.title}
              </a>
              <div className="flex justify-between items-center mt-2">
                <span className="mono text-[10px] text-[#888888]">{item.source} • {item.date}</span>
                <span className={`mono text-[10px] px-2 py-0.5 bg-white/5 ${
                  item.sentiment === "positive" ? "text-[#27c93f]" :
                  item.sentiment === "negative" ? "text-[#ff5f56]" : "text-[#ffbd2e]"
                }`}>
                  {item.sentiment.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
