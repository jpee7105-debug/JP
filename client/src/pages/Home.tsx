import { Link } from "wouter";
import { Search, ShieldAlert, GitBranch, Database, Clock } from "lucide-react";
import heroBg from "@/assets/images/hero-bg.png";
import networkBg from "@/assets/images/network.png";

const FEATURED_HOLES = [
  {
    id: "mk-ultra",
    title: "Project MKUltra",
    status: "Verified",
    connections: 142,
    updated: "2h ago",
    summary: "CIA mind control research program exploring behavioral engineering and interrogation techniques.",
    color: "text-green-500",
    border: "border-green-500/20"
  },
  {
    id: "cicada-3301",
    title: "Cicada 3301",
    status: "Unsolved",
    connections: 89,
    updated: "5d ago",
    summary: "Three sets of highly complex puzzles posted online intended to recruit cryptanalysts.",
    color: "text-yellow-500",
    border: "border-yellow-500/20"
  },
  {
    id: "number-stations",
    title: "Numbers Stations",
    status: "Active",
    connections: 215,
    updated: "12m ago",
    summary: "Shortwave radio stations broadcasting formatted numbers, believed to be intelligence operations.",
    color: "text-primary",
    border: "border-primary/20"
  }
];

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col font-sans selection:bg-primary/30">
      
      {/* Header */}
      <header className="border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitBranch className="text-primary w-6 h-6" />
            <h1 className="font-display font-bold text-xl tracking-wider uppercase">RED_THREAD</h1>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-mono text-muted-foreground">
            <span className="flex items-center gap-2"><Database className="w-4 h-4" /> NODE_STATUS: ONLINE</span>
            <span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-primary" /> ANONYMOUS</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[60vh] flex flex-col items-center justify-center overflow-hidden border-b border-white/5">
        <div 
          className="absolute inset-0 z-0 opacity-20"
          style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
        
        <div className="relative z-20 text-center max-w-3xl px-6">
          <h2 className="font-display text-5xl md:text-7xl font-bold mb-6 tracking-tighter">
            FOLLOW THE <span className="text-primary">THREAD</span>
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

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-display text-2xl font-bold uppercase tracking-widest border-l-2 border-primary pl-4">Active Investigations</h3>
          <div className="flex gap-4 font-mono text-xs">
            <button className="text-primary hover:text-primary/80 transition-colors" data-testid="button-filter-trending">[ TRENDING ]</button>
            <button className="text-muted-foreground hover:text-white transition-colors" data-testid="button-filter-new">[ NEW ]</button>
            <button className="text-muted-foreground hover:text-white transition-colors" data-testid="button-filter-verified">[ VERIFIED ONLY ]</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURED_HOLES.map((hole) => (
            <Link key={hole.id} href={`/hole/${hole.id}`}>
              <a 
                className={`group block relative bg-black/40 border ${hole.border} p-6 hover:bg-black/60 transition-all duration-300 overflow-hidden cursor-pointer`}
                data-testid={`card-rabbithole-${hole.id}`}
              >
                {/* Decorative corner accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-primary/50 transition-colors" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20 group-hover:border-primary/50 transition-colors" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20 group-hover:border-primary/50 transition-colors" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-primary/50 transition-colors" />

                <div className="flex justify-between items-start mb-4">
                  <span className={`font-mono text-xs font-bold px-2 py-1 bg-white/5 ${hole.color}`}>
                    {hole.status}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {hole.updated}
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
                    <Database className="w-4 h-4" /> 24 Sources
                  </span>
                </div>
                
                {/* Hover line effect */}
                <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-primary group-hover:w-full transition-all duration-500 ease-out" />
              </a>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer decorative */}
      <footer className="h-32 border-t border-white/5 relative overflow-hidden flex items-center justify-center">
        <div 
          className="absolute inset-0 z-0 opacity-10 mix-blend-screen"
          style={{ backgroundImage: `url(${networkBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="relative z-10 font-mono text-xs text-muted-foreground/50 tracking-widest uppercase">
          SECURE CONNECTION ESTABLISHED // RED_THREAD V1.0.0
        </div>
      </footer>
    </div>
  );
}