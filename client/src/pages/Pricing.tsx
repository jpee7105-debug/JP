import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Crown, Check, Shield, Layers, Network, BookOpen } from "lucide-react";

const PRO_FEATURES = [
  { icon: Layers, label: "Full access to all depth nodes" },
  { icon: Shield, label: "Complete investigation content" },
  { icon: Network, label: "Advanced graph filters" },
  { icon: BookOpen, label: "Saved views and bookmarks" },
  { icon: Crown, label: "Priority access to new content" },
];

const FREE_FEATURES = [
  "Investigation overviews",
  "First 2 depth nodes per investigation",
  "Community comments",
  "Connections graph (basic)",
  "Library access",
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] container mx-auto px-6 py-16 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl font-bold uppercase tracking-wider mb-4" data-testid="text-pricing-title">
          GO <span className="text-primary">DEEPER</span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Unlock the full investigative experience. Every depth node, every connection, every detail.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-white/10 bg-card/40 p-8">
          <div className="mb-6">
            <h2 className="font-display text-xl font-bold uppercase tracking-wider mb-1">Free</h2>
            <p className="text-muted-foreground text-sm">Explore the surface</p>
          </div>
          <div className="mb-6">
            <span className="font-display text-4xl font-bold">$0</span>
            <span className="text-muted-foreground text-sm ml-1">/forever</span>
          </div>
          <ul className="space-y-3 mb-8">
            {FREE_FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-white/30 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {!isAuthenticated && (
            <Link
              href="/signup"
              className="block w-full text-center py-3 border border-white/10 font-mono text-sm uppercase text-muted-foreground hover:text-white hover:border-white/20 transition-colors"
              data-testid="button-free-signup"
            >
              GET STARTED
            </Link>
          )}
        </div>

        <div className="border-2 border-primary/30 bg-primary/[0.02] p-8 relative">
          <div className="absolute -top-3 left-8">
            <span className="bg-primary text-white px-3 py-1 font-mono text-[10px] uppercase tracking-wider">
              COMING SOON
            </span>
          </div>
          <div className="mb-6">
            <h2 className="font-display text-xl font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" /> Pro
            </h2>
            <p className="text-muted-foreground text-sm">Go down the rabbit hole</p>
          </div>
          <div className="mb-6">
            <span className="font-display text-4xl font-bold">$9</span>
            <span className="text-muted-foreground text-sm ml-1">/month</span>
          </div>
          <ul className="space-y-3 mb-8">
            {PRO_FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <f.icon className="w-4 h-4 text-primary flex-shrink-0" />
                {f.label}
              </li>
            ))}
          </ul>
          <div
            className="w-full py-3 border border-primary/20 bg-primary/5 font-mono text-sm uppercase text-primary/50 text-center cursor-not-allowed"
          >
            COMING SOON
          </div>
        </div>
      </div>

      <div className="text-center mt-8 text-xs font-mono text-muted-foreground/50">
        Pro subscriptions launching soon.
      </div>
    </div>
  );
}
