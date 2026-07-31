import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, GitBranch, Database, Clock, Tag, ArrowRight, LayoutDashboard } from "lucide-react";
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
    case "Verified": return { color: "text-[#4FC87A]", bg: "bg-[#4FC87A]/10" };
    case "Unsolved": return { color: "text-[#E8923A]", bg: "bg-[#E8923A]/10" };
    case "Active": return { color: "text-primary", bg: "bg-primary/10" };
    case "Specialist": return { color: "text-primary", bg: "bg-primary/10" };
    default: return { color: "text-muted-foreground", bg: "bg-white/4" };
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

      <section className="relative h-[55vh] flex flex-col items-center justify-center overflow-hidden border-b border-white/4">
        <div 
          className="absolute inset-0 z-0 opacity-15"
          style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10 pointer-events-none" />
        
        <div className="relative z-20 text-center max-w-3xl px-6">
          <div className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground/70 mb-7 px-4 py-1.5 rounded-full bg-white/4 border border-white/8">
            Research · Analysis · Discovery
          </div>
          <h2 className="font-display text-5xl md:text-7xl font-bold mb-6 tracking-tighter uppercase">
            RABBIT <span className="text-foreground">HOLE</span>
          </h2>
          <p className="text-base text-muted-foreground/80 font-light mb-10 leading-relaxed max-w-xl mx-auto">
            Go deeper. Structured rabbit holes into the world's most complex narratives. AI-verified sources. Community-driven analysis.
          </p>
          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-13 pl-11 pr-5 bg-card/70 border border-white/8 rounded-xl focus:outline-none focus:border-white/20 focus:bg-card/90 text-base transition-all placeholder:text-muted-foreground/50"
              placeholder="Search investigations..."
              data-testid="input-search"
            />
          </form>
        </div>
      </section>

      <section className="container mx-auto px-6 pt-7 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono uppercase whitespace-nowrap rounded-full transition-all ${!activeCategory ? 'bg-primary/15 text-primary' : 'bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/8'}`}
            data-testid="button-category-all"
          >
            All Topics
          </button>
          {cats.map(cat => (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono uppercase whitespace-nowrap rounded-full transition-all ${activeCategory === cat.slug ? 'bg-primary/15 text-primary' : 'bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/8'}`}
              data-testid={`button-category-${cat.slug}`}
            >
              <span className="text-[11px]">{categoryIcons[cat.icon] || "📁"}</span> {cat.name}
            </button>
          ))}
        </div>
      </section>

      <main className="flex-1 container mx-auto px-6 pb-20">
        
        <div className="mb-20 mt-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-display text-xl font-bold tracking-tight">Specialist Intel</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Curated investigations</p>
            </div>
          </div>
          {loadingSpecialist ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map(i => (
                <div key={i} className="h-64 bg-card/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {specialistHoles
                .filter(h => !activeCategory || h.categorySlug === activeCategory)
                .map((hole) => (
                <Link key={hole.id} href={`/rabbithole/${hole.slug}`}
                  className="group block relative bg-card/60 rounded-xl p-7 hover:bg-card transition-all duration-300 overflow-hidden cursor-pointer"
                  style={{ boxShadow: "var(--token-elevation-1)" }}
                  data-testid={`card-specialist-${hole.slug}`}
                >
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold px-2.5 py-1 bg-primary/12 text-primary rounded-md">
                          {hole.status}
                        </span>
                        {hole.categorySlug && (
                          <span className="font-mono text-[10px] px-2 py-1 text-muted-foreground bg-white/5 rounded-md flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5" /> {hole.categorySlug}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground/60 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo(hole.updatedAt)}
                      </span>
                    </div>
                    <h4 className="font-display text-2xl font-bold mb-3 group-hover:text-primary/90 transition-colors leading-tight">
                      {hole.title}
                    </h4>
                    <p className="text-muted-foreground/75 text-sm mb-6 leading-relaxed line-clamp-3">
                      {hole.summary}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/6">
                      <div className="flex items-center gap-4 text-[11px] font-mono text-muted-foreground/60">
                        <span className="flex items-center gap-1.5">
                          <GitBranch className="w-3 h-3" /> {hole.connections} Nodes
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Database className="w-3 h-3" /> {hole.sourceCount} Sources
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Go deeper <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Workspace CTA */}
        <div className="mb-10 relative overflow-hidden rounded-xl bg-card/50 border border-primary/20 p-8" data-testid="workspace-cta">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 80% 50%, rgba(108,99,255,0.08) 0%, transparent 65%)" }} />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-[10px] px-2 py-0.5 bg-[#9B6EFF]/10 text-[#9B6EFF] border border-[#9B6EFF]/25">PREVIEW</span>
                <span className="font-mono text-[10px] text-muted-foreground/50">DEMONSTRATION DATA</span>
              </div>
              <h3 className="font-display text-2xl font-bold tracking-tight mb-2">Explore the Workspace</h3>
              <p className="text-muted-foreground/70 text-sm leading-relaxed max-w-lg">
                An interactive investigation canvas — visualise nodes, claims, people, and evidence as a connected relationship graph. Open any investigation to explore its structure.
              </p>
            </div>
            <Link
              href="/workspace-v2"
              className="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-primary/10 border border-primary/30 text-primary font-mono text-xs hover:bg-primary/20 transition-colors rounded-lg"
              data-testid="link-workspace-cta"
            >
              <LayoutDashboard className="w-4 h-4" /> Open Workspace →
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between mb-7">
          <div>
            <h3 className="font-display text-xl font-bold tracking-tight">Active Investigations</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Community-driven analysis</p>
          </div>
          <div className="flex gap-1 bg-white/4 rounded-lg p-1">
            {(["trending", "new", "verified"] as const).map(mode => (
              <button
                key={mode}
                className={`px-3 py-1.5 text-[11px] font-mono uppercase rounded-md transition-all ${sortMode === mode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setSortMode(mode)}
                data-testid={`button-filter-${mode}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {loadingCommunity ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-56 bg-card/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredCommunity.length === 0 ? (
          <div className="text-center py-20 text-sm text-muted-foreground/60">
            No investigations found for this category
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCommunity.map((hole) => {
              const sc = statusColor(hole.status);
              return (
                <Link key={hole.id} href={`/rabbithole/${hole.slug}`}
                  className="group block relative bg-card/50 rounded-xl p-6 hover:bg-card/80 transition-all duration-300 overflow-hidden cursor-pointer"
                  style={{ boxShadow: "var(--token-elevation-1)" }}
                  data-testid={`card-rabbithole-${hole.slug}`}
                >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md ${sc.bg} ${sc.color}`}>
                          {hole.status}
                        </span>
                        {hole.categorySlug && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 text-muted-foreground/60 bg-white/4 rounded-md">
                            {hole.categorySlug}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground/50 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {timeAgo(hole.updatedAt)}
                      </span>
                    </div>
                    
                    <h4 className="font-display text-lg font-bold mb-2.5 group-hover:text-primary/90 transition-colors leading-snug">
                      {hole.title}
                    </h4>
                    
                    <p className="text-muted-foreground/65 text-sm mb-5 line-clamp-3 leading-relaxed">
                      {hole.summary}
                    </p>

                    <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground/50 pt-3.5 border-t border-white/5">
                      <span className="flex items-center gap-1">
                        <GitBranch className="w-3 h-3" /> {hole.connections} Nodes
                      </span>
                      <span className="flex items-center gap-1">
                        <Database className="w-3 h-3" /> {hole.sourceCount} Sources
                      </span>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-primary/60 group-hover:w-full transition-all duration-500 ease-out" />
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <footer className="h-28 border-t border-white/4 relative overflow-hidden flex items-center justify-center">
        <div 
          className="absolute inset-0 z-0 opacity-8 mix-blend-screen"
          style={{ backgroundImage: `url(${networkBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="relative z-10 font-mono text-[11px] text-muted-foreground/40 tracking-widest uppercase">
          Rabbit Hole — Research Platform
        </div>
      </footer>
    </div>
  );
}
