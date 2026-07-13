import { NewsSentimentSummary } from "@/types/research";
import { Newspaper, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface NewsIntelligenceProps {
  newsSentiment: NewsSentimentSummary | null;
}

export function NewsIntelligence({ newsSentiment }: NewsIntelligenceProps) {
  if (!newsSentiment) return null;

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "negative": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      default: return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    }
  };

  const getSentimentBg = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "bg-emerald-500/20 border-emerald-500/30 text-emerald-400";
      case "negative": return "bg-rose-500/20 border-rose-500/30 text-rose-400";
      default: return "bg-amber-500/20 border-amber-500/30 text-amber-400";
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
          <div className="p-1.5 bg-slate-500/20 rounded-lg">
            <Newspaper className="h-5 w-5 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">News Intelligence</h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${getSentimentBg(newsSentiment.overallSentiment)}`}>
          {newsSentiment.overallSentiment} Sentiment
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-secondary/30 rounded-xl p-3 border border-white/5 text-center">
          <div className="text-xl font-black text-emerald-400">{newsSentiment.positiveCount}</div>
          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Positive</div>
        </div>
        <div className="bg-secondary/30 rounded-xl p-3 border border-white/5 text-center">
          <div className="text-xl font-black text-amber-400">{newsSentiment.neutralCount}</div>
          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Neutral</div>
        </div>
        <div className="bg-secondary/30 rounded-xl p-3 border border-white/5 text-center">
          <div className="text-xl font-black text-rose-400">{newsSentiment.negativeCount}</div>
          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Negative</div>
        </div>
      </div>

      {/* Catalysts & Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 flex-1">
        <div className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/10">
          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">Key Catalysts</div>
          <ul className="space-y-2">
            {newsSentiment.catalysts.map((cat, i) => (
              <li key={i} className="text-xs text-foreground/80 leading-relaxed flex gap-2">
                <span className="text-emerald-500">•</span> {cat}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-rose-500/5 rounded-2xl p-4 border border-rose-500/10">
          <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3">Key Risks</div>
          <ul className="space-y-2">
            {newsSentiment.risks.map((risk, i) => (
              <li key={i} className="text-xs text-foreground/80 leading-relaxed flex gap-2">
                <span className="text-rose-500">•</span> {risk}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Top Headlines */}
      <div>
        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Top Headlines</div>
        <div className="space-y-3">
          {newsSentiment.topHeadlines.slice(0, 3).map((news) => (
            <a 
              key={news.id} 
              href={news.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="bg-secondary/20 hover:bg-secondary/40 border border-white/5 hover:border-white/10 rounded-xl p-3 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${getSentimentColor(news.sentiment)}`}>
                    {news.sentiment}
                  </span>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                    <span>{news.source}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span>{news.date}</span>
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-foreground group-hover:text-indigo-400 transition-colors leading-snug pr-4 relative">
                  {news.title}
                  <ExternalLink className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
                </h4>
              </div>
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
