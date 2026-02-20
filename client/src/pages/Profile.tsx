import { ShieldAlert, Eye, MessageSquare, Bookmark, Clock, TrendingUp } from "lucide-react";

export default function Profile() {
  const anonId = "ANON_" + Math.random().toString(36).substring(2, 8).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 border-2 border-primary/50 bg-primary/5 flex items-center justify-center">
              <ShieldAlert className="w-10 h-10 text-primary/60" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold uppercase tracking-wider mb-1" data-testid="text-profile-title">Anonymous Operative</h1>
              <p className="font-mono text-xs text-muted-foreground" data-testid="text-profile-id">SESSION ID: {anonId}</p>
              <p className="font-mono text-xs text-primary/60 mt-1">CLEARANCE: PUBLIC</p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Eye, label: "INVESTIGATIONS VIEWED", value: "0", color: "text-primary" },
            { icon: MessageSquare, label: "THREADS CONTRIBUTED", value: "0", color: "text-green-500" },
            { icon: TrendingUp, label: "REPUTATION SCORE", value: "0", color: "text-yellow-500" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="border border-white/10 bg-white/[0.02] p-6" data-testid={`stat-${label.toLowerCase().replace(/ /g, '-')}`}>
              <div className="flex items-center gap-3 mb-4">
                <Icon className={`w-5 h-5 ${color}`} />
                <span className="font-mono text-xs text-muted-foreground">{label}</span>
              </div>
              <span className={`font-display text-4xl font-bold ${color}`}>{value}</span>
            </div>
          ))}
        </div>

        <section className="mb-12">
          <h2 className="font-display text-xl uppercase tracking-widest text-muted-foreground mb-6 border-l-2 border-primary pl-4">
            Bookmarked Investigations
          </h2>
          <div className="border border-dashed border-white/10 p-12 text-center">
            <Bookmark className="w-10 h-10 text-white/10 mx-auto mb-4" />
            <p className="font-mono text-sm text-muted-foreground mb-2">NO BOOKMARKS YET</p>
            <p className="text-xs text-muted-foreground/60">Investigations you bookmark will appear here for quick access.</p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase tracking-widest text-muted-foreground mb-6 border-l-2 border-primary pl-4">
            Recent Activity
          </h2>
          <div className="border border-dashed border-white/10 p-12 text-center">
            <Clock className="w-10 h-10 text-white/10 mx-auto mb-4" />
            <p className="font-mono text-sm text-muted-foreground mb-2">NO ACTIVITY RECORDED</p>
            <p className="text-xs text-muted-foreground/60">Your browsing history and contributions will be tracked here.</p>
          </div>
        </section>

        <div className="mt-12 border border-white/5 bg-white/[0.01] p-6">
          <h3 className="font-mono text-xs text-primary mb-3">// SYSTEM NOTICE</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You are operating in anonymous mode. All contributions are attributed to randomly generated identifiers. 
            Full user authentication with persistent profiles, bookmarks, and reputation tracking is coming in a future update.
          </p>
        </div>
      </main>
    </div>
  );
}
