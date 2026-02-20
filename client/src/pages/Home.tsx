import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, GitBranch, Database, Clock, Tag, ArrowRight, Filter, ShieldAlert } from "lucide-react";
import heroBg from "@/assets/images/hero-bg.png";
import networkBg from "@/assets/images/network.png";
import type { RabbitHole, Category } from "@shared/schema";

function timeAgo(date: string | Date) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function statusColor(status: string) {
  switch (status) {
    case "Verified": return { color: "text-green-500", border: "border-green-500/20", bg: "bg-green-500/10" };
    case "Unsolved": return { color: "text-yellow-500", border: "border-yellow-500/20", bg: "bg-yellow-500/10" };
    case "Active": return { color: "text-primary", border: "border-primary/20", bg: "bg-primary/10" };
    case "Specialist": return { color: "text-red-500", border: "border-red-500/40", bg: "bg-red-500/10" };
    default: return { color: "text-muted-foreground", border: "border-white/10", bg: "bg-white/5" };
  }
}

const categoryIcons: Record<string, string> = {
  shield: "🛡️", globe: "🌍", book: "📜", cpu: "💻", "dollar-sign": "💰", search: "🔍", tv: "📺", folder: "📁"
};

export default function Home() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<"trending" | "new" | "verified">("trending");

  const { data: specialistHoles = [], isLoading: loadingSpecialist } = useQuery<RabbitHole[]>({
    queryKey: ["/api/holes/specialist"],
  });

  const { data: communityHoles = [], isLoading: loadingCommunity } = useQuery<RabbitHole[]>({
    queryKey: ["/api/holes/community"],
  });

  const { data: cats = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const filteredCommunity = communityHoles
    .filter(h => !activeCategory || h.categorySlug === activeCategory)
    .sort((a, b) => {
      if (sortMode === "new") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortMode === "verified") return (b.status === "Verified" ? 1 : 0) - (a.status === "Verified" ? 1 : 0);
      return b.connections - a.connections;
    });

  return (
    <div className="min-h-screen w-full flex flex-col font-sans selection:bg-primary/30">

      <section className="relative h-[55vh] flex flex-col items-center justify-center overflow-hidden border-b border-white/5">
        <div 
          className="absolute inset-0 z-0 opacity-20"
          style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent z-10 pointer-events-none" />
        
        <div className="relative z-20 text-center max-w-3xl px-6">
          <div className="inline-flex items-center gap-2 font-mono text-xs text-primary/80 mb-6 px-3 py-1 border border-primary/20 bg-primary/5">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            INVESTIGATIVE RESEARCH PLATFORM
          </div>
          <h2 className="font-display text-5xl md:text-7xl font-bold mb-6 tracking-tighter uppercase">
            RED <span className="text-primary">THREAD</span>
          </h2>
          <p className="text-lg text-muted-foreground font-light mb-10">
            Follow the thread. Structured deep-dives into the world's most complex narratives. AI-verified sources. Community-driven analysis.
          </p>
          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-black/50 border border-white/10 rounded-none focus:outline-none focus:border-primary/50 text-lg font-mono transition-colors"
              placeholder="SEARCH INVESTIGATIONS..."
              data-testid="input-search"
            />
          </form>
        </div>
      </section>

      <section className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase whitespace-nowrap border transition-colors ${!activeCategory ? 'border-primary text-primary bg-primary/10' : 'border-white/10 text-muted-foreground hover:text-white hover:border-white/20'}`}
            data-testid="button-category-all"
          >
            <Filter className="w-3 h-3" /> ALL TOPICS
          </button>
          {cats.map(cat => (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase whitespace-nowrap border transition-colors ${activeCategory === cat.slug ? 'border-primary text-primary bg-primary/10' : 'border-white/10 text-muted-foreground hover:text-white hover:border-white/20'}`}
              data-testid={`button-category-${cat.slug}`}
            >
              <span>{categoryIcons[cat.icon] || "📁"}</span> {cat.name}
            </button>
          ))}
        </div>
      </section>

      <main className="flex-1 container mx-auto px-6 pb-16">
        
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-display text-2xl font-bold uppercase tracking-widest border-l-2 border-red-500 pl-4">Specialist Intel</h3>
            <span className="font-mono text-[10px] text-red-500 animate-pulse">CLEARANCE_REQUIRED</span>
          </div>
          {loadingSpecialist ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2].map(i => (
                <div key={i} className="h-64 border border-red-500/20 bg-red-500/[0.02] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {specialistHoles
                .filter(h => !activeCategory || h.categorySlug === activeCategory)
                .map((hole) => (
                <Link key={hole.id} href={`/rabbithole/${hole.slug}`}
                  className="group block relative bg-red-500/[0.02] border border-red-500/40 p-8 hover:bg-red-500/[0.05] transition-all duration-300 overflow-hidden cursor-pointer"
                  data-testid={`card-specialist-${hole.slug}`}
                >
                    <div className="absolute top-0 right-0 p-2 opacity-20">
                      <ShieldAlert className="w-12 h-12 text-red-500" />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20">
                          {hole.status}
                        </span>
                        {hole.categorySlug && (
                          <span className="font-mono text-[10px] px-2 py-1 text-muted-foreground bg-white/5 border border-white/10 flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5" /> {hole.categorySlug.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo(hole.updatedAt)}
                      </span>
                    </div>
                    <h4 className="font-display text-3xl font-bold mb-4 group-hover:text-red-500 transition-colors">
                      {hole.title}
                    </h4>
                    <p className="text-muted-foreground text-sm mb-6 leading-relaxed line-clamp-3">
                      {hole.summary}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-red-500/10">
                      <div className="flex items-center gap-4 text-xs font-mono text-red-500/60">
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-4 h-4" /> {hole.connections} Nodes
                        </span>
                        <span className="flex items-center gap-1">
                          <Database className="w-4 h-4" /> {hole.sourceCount} Sources
                        </span>
                      </div>
                      <span className="text-xs font-mono text-red-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        GO DEEPER <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-8">
          <h3 className="font-display text-2xl font-bold uppercase tracking-widest border-l-2 border-primary pl-4">Active Investigations</h3>
          <div className="flex gap-4 font-mono text-xs">
            <button 
              className={`transition-colors ${sortMode === 'trending' ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}
              onClick={() => setSortMode('trending')}
              data-testid="button-filter-trending"
            >[ TRENDING ]</button>
            <button 
              className={`transition-colors ${sortMode === 'new' ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}
              onClick={() => setSortMode('new')}
              data-testid="button-filter-new"
            >[ NEW ]</button>
            <button 
              className={`transition-colors ${sortMode === 'verified' ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}
              onClick={() => setSortMode('verified')}
              data-testid="button-filter-verified"
            >[ VERIFIED ]</button>
          </div>
        </div>

        {loadingCommunity ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-56 border border-white/10 bg-white/[0.01] animate-pulse" />
            ))}
          </div>
        ) : filteredCommunity.length === 0 ? (
          <div className="text-center py-16 font-mono text-sm text-muted-foreground">
            NO INVESTIGATIONS FOUND FOR THIS CATEGORY
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunity.map((hole) => {
              const sc = statusColor(hole.status);
              return (
                <Link key={hole.id} href={`/rabbithole/${hole.slug}`}
                  className={`group block relative bg-black/40 border ${sc.border} p-6 hover:bg-black/60 transition-all duration-300 overflow-hidden cursor-pointer`}
                  data-testid={`card-rabbithole-${hole.slug}`}
                >
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-primary/50 transition-colors" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20 group-hover:border-primary/50 transition-colors" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20 group-hover:border-primary/50 transition-colors" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-primary/50 transition-colors" />

                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-bold px-2 py-1 ${sc.bg} ${sc.color}`}>
                          {hole.status}
                        </span>
                        {hole.categorySlug && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 text-muted-foreground bg-white/5">
                            {hole.categorySlug.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo(hole.updatedAt)}
                      </span>
                    </div>
                    
                    <h4 className="font-display text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {hole.title}
                    </h4>
                    
                    <p className="text-muted-foreground text-sm mb-6 line-clamp-3">
                      {hole.summary}
                    </p>

                    <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground pt-4 border-t border-white/5">
                      <span className="flex items-center gap-1">
                        <GitBranch className="w-4 h-4" /> {hole.connections} Nodes
                      </span>
                      <span className="flex items-center gap-1">
                        <Database className="w-4 h-4" /> {hole.sourceCount} Sources
                      </span>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-primary group-hover:w-full transition-all duration-500 ease-out" />
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <footer className="h-32 border-t border-white/5 relative overflow-hidden flex items-center justify-center">
        <div 
          className="absolute inset-0 z-0 opacity-10 mix-blend-screen"
          style={{ backgroundImage: `url(${networkBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="relative z-10 font-mono text-xs text-muted-foreground/50 tracking-widest uppercase">
          SECURE CONNECTION ESTABLISHED // RED_THREAD V2.0.0
        </div>
      </footer>
    </div>
  );
}
