import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { GitBranch, Database, Clock, ArrowRight, Compass, Layers } from "lucide-react";
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
    case "Verified": return { color: "text-green-400", bg: "bg-green-500/8" };
    case "Unsolved": return { color: "text-yellow-400", bg: "bg-yellow-500/8" };
    case "Active": return { color: "text-primary", bg: "bg-primary/8" };
    case "Specialist": return { color: "text-primary", bg: "bg-primary/8" };
    default: return { color: "text-muted-foreground", bg: "bg-white/4" };
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
      <div className="border-b border-white/5">
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-2">
            <Compass className="w-5 h-5 text-muted-foreground/60" />
            <h1 className="font-display text-2xl font-bold tracking-tight" data-testid="text-discover-title">Discover</h1>
          </div>
          <p className="text-muted-foreground/70 font-light max-w-2xl text-sm leading-relaxed">
            Browse all investigations across every category. Filter by topic, sort by relevance, and dive into the threads that matter.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 pt-5 pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono uppercase whitespace-nowrap rounded-full transition-all ${!activeCategory ? 'bg-primary/15 text-primary' : 'bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/8'}`}
              data-testid="button-discover-category-all"
            >
              All
            </button>
            {cats.map(cat => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono uppercase whitespace-nowrap rounded-full transition-all ${activeCategory === cat.slug ? 'bg-primary/15 text-primary' : 'bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/8'}`}
                data-testid={`button-discover-category-${cat.slug}`}
              >
                <span className="text-[11px]">{categoryIcons[cat.icon] || "📁"}</span> {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex gap-0.5 bg-white/4 rounded-lg p-0.5">
              {(["all", "specialist", "community"] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-[10px] font-mono uppercase rounded-md transition-all ${viewMode === mode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground/60 hover:text-foreground'}`}
                  data-testid={`button-view-${mode}`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex gap-0.5 bg-white/4 rounded-lg p-0.5">
              {(["trending", "new", "verified"] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={`px-3 py-1.5 text-[10px] font-mono uppercase rounded-md transition-all ${sortMode === mode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground/60 hover:text-foreground'}`}
                  data-testid={`button-sort-${mode}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-[11px] font-mono text-muted-foreground/50 mb-5">
          {filtered.length} investigation{filtered.length !== 1 ? "s" : ""} found
        </div>
      </div>

      <main className="flex-1 container mx-auto px-6 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-56 bg-card/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-sm text-muted-foreground/60">
            <Layers className="w-12 h-12 mx-auto mb-4 opacity-20" />
            No investigations match your filters
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((hole) => {
              const sc = statusColor(hole.status);
              return (
                <Link
                  key={hole.id}
                  href={`/rabbithole/${hole.slug}`}
                  className="group block relative bg-card/50 rounded-xl p-6 hover:bg-card/80 transition-all duration-300 overflow-hidden cursor-pointer"
                  style={{ boxShadow: "var(--token-elevation-1)" }}
                  data-testid={`card-discover-${hole.slug}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md ${sc.bg} ${sc.color}`}>
                        {hole.status}
                      </span>
                      {hole.categorySlug && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 text-muted-foreground/50 bg-white/4 rounded-md">
                          {hole.categorySlug}
                        </span>
                      )}
                      {hole.isSpecialist && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 text-primary/60 bg-primary/8 rounded-md">
                          Specialist
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground/45 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {timeAgo(hole.updatedAt)}
                    </span>
                  </div>

                  <h4 className="font-display text-lg font-bold mb-2.5 group-hover:text-primary/90 transition-colors leading-snug">
                    {hole.title}
                  </h4>

                  <p className="text-muted-foreground/65 text-sm mb-5 line-clamp-3 leading-relaxed">
                    {hole.summary}
                  </p>

                  <div className="flex items-center justify-between pt-3.5 border-t border-white/5">
                    <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground/50">
                      <span className="flex items-center gap-1">
                        <GitBranch className="w-3 h-3" /> {hole.connections}
                      </span>
                      <span className="flex items-center gap-1">
                        <Database className="w-3 h-3" /> {hole.sourceCount}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-primary/70 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Enter <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-primary/60 group-hover:w-full transition-all duration-500 ease-out" />
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
