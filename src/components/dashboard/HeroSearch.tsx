import { Search, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface HeroSearchProps {
  onSearch: (ticker: string) => void;
  isLoading: boolean;
}

export function HeroSearch({ onSearch, isLoading }: HeroSearchProps) {
  const [query, setQuery] = useState("");

  const popularTickers = [
    { ticker: "AAPL", name: "Apple Inc." },
    { ticker: "MSFT", name: "Microsoft" },
    { ticker: "NVDA", name: "NVIDIA Corp" },
    { ticker: "TSLA", name: "Tesla Inc." },
    { ticker: "JPM", name: "JPMorgan Chase" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-3xl mx-auto mt-20 md:mt-32 px-4"
    >
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tight">
          Professional Grade AI
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
            Investment Research
          </span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          iVEST runs an 8-agent pipeline to analyze financials, market data, risk factors, and news sentiment in real-time.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative group mb-12">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
        <div className="relative flex items-center bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl">
          <Search className="ml-4 h-6 w-6 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            placeholder="Enter a ticker or company name (e.g., TSLA)..."
            className="border-0 bg-transparent h-14 text-lg focus-visible:ring-0 px-4 w-full placeholder:text-muted-foreground/60"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="mr-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? "Analyzing..." : "Analyze"}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </form>

      <div>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center mb-4">
          Trending Assets
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {popularTickers.map((item) => (
            <button
              key={item.ticker}
              onClick={() => {
                setQuery(item.ticker);
                onSearch(item.ticker);
              }}
              className="flex items-center gap-2 bg-secondary/40 hover:bg-secondary/80 border border-white/5 rounded-full px-4 py-2 transition-colors group"
            >
              <span className="font-mono font-bold text-sm text-foreground">{item.ticker}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline-block">{item.name}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
