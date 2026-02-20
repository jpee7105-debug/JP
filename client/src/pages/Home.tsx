import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, ShieldAlert, GitBranch, Database, Clock } from "lucide-react";
import heroBg from "@/assets/images/hero-bg.png";
import networkBg from "@/assets/images/network.png";
import type { RabbitHole } from "@shared/schema";

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
    case "Verified": return { color: "text-green-500", border: "border-green-500/20" };
    case "Unsolved": return { color: "text-yellow-500", border: "border-yellow-500/20" };
    case "Active": return { color: "text-primary", border: "border-primary/20" };
    case "Specialist": return { color: "text-red-500", border: "border-red-500/40" };
    default: return { color: "text-muted-foreground", border: "border-white/10" };
  }
}

export default function Home() {
  const { data: specialistHoles = [], isLoading: loadingSpecialist } = useQuery<RabbitHole[]>({
    queryKey: ["/api/holes/specialist"],
  });

  const { data: communityHoles = [], isLoading: loadingCommunity } = useQuery<RabbitHole[]>({
    queryKey: ["/api/holes/community"],
  });

  return (
    <div className="min-h-screen w-full flex flex-col font-sans selection:bg-primary/30">
      
      <header className="border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitBranch className="text-primary w-6 h-6" />
            <h1 className="font-display font-bold text-xl tracking-wider uppercase">RABBIT_HOLE</h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-mono text-muted-foreground">
            <span className="flex items-center gap-2"><Database className="w-4 h-4" /> NODE_STATUS: ONLINE</span>
            <span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-primary" /> ANONYMOUS</span>
          </div>
        </div>
      </header>

      <section className="relative h-[60vh] flex flex-col items-center justify-center overflow-hidden border-b border-white/5">
        <div 
          className="absolute inset-0 z-0 opacity-20"
          style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
        
        <div className="relative z-20 text-center max-w-3xl px-6">
          <h2 className="font-display text-5xl md:text-7xl font-bold mb-6 tracking-tighter uppercase">
            RABBIT <span className="text-primary">HOLE</span>
          </h2>
          <p className="text-xl text-muted-foreground font-light mb-10">
            AI-verified, structured investigations into the world's most complex narratives. Connect the dots, track the sources.
          </p>
          <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input 
              type="text" 
              className="w-full h-14 pl-12 pr-4 bg-black/50 border border-white/10 rounded-none focus:outline-none focus:border-primary/50 text-lg font-mono transition-colors"
              placeholder="ENTER ARCHIVE QUERY..."
              data-testid="input-search"
            />
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-6 py-16">
        
        {/* Specialist Section */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-display text-2xl font-bold uppercase tracking-widest border-l-2 border-red-500 pl-4">Specialist Intel</h3>
            <span className="font-mono text-[10px] text-red-500 animate-pulse">DIRECTIVE_ALPHA_REQUIRED</span>
          </div>
          {loadingSpecialist ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2].map(i => (
                <div key={i} className="h-64 border border-red-500/20 bg-red-500/[0.02] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {specialistHoles.map((hole) => {
                const sc = statusColor(hole.status);
                return (
                  <Link key={hole.id} href={`/hole/${hole.slug}`}
                    className="group block relative bg-red-500/[0.02] border border-red-500/40 p-8 hover:bg-red-500/[0.05] transition-all duration-300 overflow-hidden cursor-pointer"
                    data-testid={`card-specialist-${hole.slug}`}
                  >
                      <div className="absolute top-0 right-0 p-2 opacity-20">
                        <ShieldAlert className="w-12 h-12 text-red-500" />
                      </div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-mono text-xs font-bold px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20">
                          {hole.status}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {timeAgo(hole.updatedAt)}
                        </span>
                      </div>
                      <h4 className="font-display text-3xl font-bold mb-4 group-hover:text-red-500 transition-colors">
                        {hole.title}
                      </h4>
                      <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                        {hole.summary}
                      </p>
                      <div className="flex items-center gap-4 text-xs font-mono text-red-500/60 pt-4 border-t border-red-500/10">
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-4 h-4" /> {hole.connections} Nodes
                        </span>
                        <span className="flex items-center gap-1 uppercase">Level 4 Clearance</span>
                      </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Community Section */}
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-display text-2xl font-bold uppercase tracking-widest border-l-2 border-primary pl-4">Active Investigations</h3>
          <div className="flex gap-4 font-mono text-xs">
            <button className="text-primary hover:text-primary/80 transition-colors" data-testid="button-filter-trending">[ TRENDING ]</button>
            <button className="text-muted-foreground hover:text-white transition-colors" data-testid="button-filter-new">[ NEW ]</button>
            <button className="text-muted-foreground hover:text-white transition-colors" data-testid="button-filter-verified">[ VERIFIED ONLY ]</button>
          </div>
        </div>

        {loadingCommunity ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-56 border border-white/10 bg-white/[0.01] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communityHoles.map((hole) => {
              const sc = statusColor(hole.status);
              return (
                <Link key={hole.id} href={`/hole/${hole.slug}`}
                  className={`group block relative bg-black/40 border ${sc.border} p-6 hover:bg-black/60 transition-all duration-300 overflow-hidden cursor-pointer`}
                  data-testid={`card-rabbithole-${hole.slug}`}
                >
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-primary/50 transition-colors" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20 group-hover:border-primary/50 transition-colors" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20 group-hover:border-primary/50 transition-colors" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-primary/50 transition-colors" />

                    <div className="flex justify-between items-start mb-4">
                      <span className={`font-mono text-xs font-bold px-2 py-1 bg-white/5 ${sc.color}`}>
                        {hole.status}
                      </span>
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
          SECURE CONNECTION ESTABLISHED // RABBIT_HOLE V1.0.0
        </div>
      </footer>
    </div>
  );
}