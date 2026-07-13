import { Search, Menu, X, Cpu } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import Logo from "@/components/Logo";

interface TopNavProps {
  onSearch: (ticker: string) => void;
  isLoading: boolean;
}

export function TopNav({ onSearch, isLoading }: TopNavProps) {
  const [query, setQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 md:px-8 mx-auto max-w-7xl">
        
        {/* Logo */}
        <div className="flex items-center mr-8">
          <Logo className="h-10 text-white" />
        </div>

        {/* Desktop Search (shows only when not on hero page) */}
        <div className="hidden md:flex flex-1 items-center space-x-2">
          <form onSubmit={handleSubmit} className="relative w-full max-w-sm group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ticker (e.g. AAPL, NVDA)..."
              disabled={isLoading}
              className="pl-9 bg-secondary/50 border-white/5 focus-visible:ring-1 focus-visible:ring-indigo-500 rounded-full h-9 text-sm w-full transition-all group-focus-within:bg-secondary/80"
            />
          </form>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 ml-auto text-sm font-medium text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Dashboard</a>
          <a href="#" className="hover:text-foreground transition-colors">Portfolios</a>
          <a href="#" className="hover:text-foreground transition-colors">Markets</a>
          <div className="h-4 w-px bg-border/60 mx-2" />
          <div className="h-8 w-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold">
            US
          </div>
        </div>

        {/* Mobile menu toggle */}
        <button 
          className="ml-auto md:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

      </div>
      
      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-b border-border/40 bg-background/95 backdrop-blur overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <form onSubmit={handleSubmit} className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search ticker..."
                  disabled={isLoading}
                  className="pl-9 bg-secondary/50 border-white/5 focus-visible:ring-1 focus-visible:ring-indigo-500 rounded-lg w-full"
                />
              </form>
              <div className="flex flex-col space-y-3 text-sm font-medium text-muted-foreground">
                <a href="#" className="hover:text-foreground transition-colors">Dashboard</a>
                <a href="#" className="hover:text-foreground transition-colors">Portfolios</a>
                <a href="#" className="hover:text-foreground transition-colors">Markets</a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
