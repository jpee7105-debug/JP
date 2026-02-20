import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { GitBranch, Database, Clock, Tag, ArrowRight, Filter, ShieldAlert, Compass, Layers } from "lucide-react";
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

export default function Discover() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<"trending" | "new" | "verified">("trending");
  const [viewMode, setViewMode] = useState<"all" | "specialist" | "community">("all");

  const { data: allHoles = [], isLoading } = useQuery<RabbitHole[]>({
    queryKey: ["/api/holes"],
  });

  const { data: cats = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const filtered = allHoles
    .filter(h => !activeCategory || h.categorySlug === activeCategory)
    .filter(h => {
      if (viewMode === "specialist") return h.isSpecialist;
      if (viewMode === "community") return !h.isSpecialist;
      return true;
    })
    .sort((a, b) => {
      if (sortMode === "new") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortMode === "verified") return (b.status === "Verified" ? 1 : 0) - (a.status === "Verified" ? 1 : 0);
      return b.connections - a.connections;
    });

  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-2">
            <Compass className="w-6 h-6 text-primary" />
            <h1 className="font-display text-3xl font-bold uppercase tracking-wider" data-testid="text-discover-title">Discover</h1>
          </div>
          <p className="text-muted-foreground font-light max-w-2xl">
            Browse all investigations across every category. Filter by topic, sort by relevance, and dive into the threads that matter.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase whitespace-nowrap border transition-colors ${!activeCategory ? 'border-primary text-primary bg-primary/10' : 'border-white/10 text-muted-foreground hover:text-white hover:border-white/20'}`}
              data-testid="button-discover-category-all"
            >
              <Filter className="w-3 h-3" /> ALL
            </button>
            {cats.map(cat => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase whitespace-nowrap border transition-colors ${activeCategory === cat.slug ? 'border-primary text-primary bg-primary/10' : 'border-white/10 text-muted-foreground hover:text-white hover:border-white/20'}`}
                data-testid={`button-discover-category-${cat.slug}`}
              >
                <span>{categoryIcons[cat.icon] || "📁"}</span> {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1 font-mono text-xs">
              {(["all", "specialist", "community"] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 border transition-colors ${viewMode === mode ? 'border-primary text-primary bg-primary/10' : 'border-white/10 text-muted-foreground hover:text-white'}`}
                  data-testid={`button-view-${mode}`}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <div className="flex gap-1 font-mono text-xs">
              {(["trending", "new", "verified"] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={`px-3 py-1.5 transition-colors ${sortMode === mode ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}
                  data-testid={`button-sort-${mode}`}
                >
                  [{mode.toUpperCase()}]
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="font-mono text-xs text-muted-foreground mb-6">
          {filtered.length} INVESTIGATION{filtered.length !== 1 ? "S" : ""} FOUND
        </div>
      </div>

      <main className="flex-1 container mx-auto px-6 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-56 border border-white/10 bg-white/[0.01] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 font-mono text-sm text-muted-foreground">
            <Layers className="w-12 h-12 mx-auto mb-4 opacity-20" />
            NO INVESTIGATIONS MATCH YOUR FILTERS
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((hole) => {
              const sc = statusColor(hole.status);
              return (
                <Link
                  key={hole.id}
                  href={`/rabbithole/${hole.slug}`}
                  className={`group block relative bg-black/40 border ${hole.isSpecialist ? 'border-red-500/40 bg-red-500/[0.02]' : sc.border} p-6 hover:bg-black/60 transition-all duration-300 overflow-hidden cursor-pointer`}
                  data-testid={`card-discover-${hole.slug}`}
                >
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-primary/50 transition-colors" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20 group-hover:border-primary/50 transition-colors" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20 group-hover:border-primary/50 transition-colors" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-primary/50 transition-colors" />

                  {hole.isSpecialist && (
                    <div className="absolute top-0 right-0 p-2 opacity-20">
                      <ShieldAlert className="w-8 h-8 text-red-500" />
                    </div>
                  )}

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

                  <h4 className="font-display text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {hole.title}
                  </h4>

                  <p className="text-muted-foreground text-sm mb-6 line-clamp-3">
                    {hole.summary}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <GitBranch className="w-4 h-4" /> {hole.connections}
                      </span>
                      <span className="flex items-center gap-1">
                        <Database className="w-4 h-4" /> {hole.sourceCount}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      ENTER <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-primary group-hover:w-full transition-all duration-500 ease-out" />
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
