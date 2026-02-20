import { useState, useEffect } from "react";
import { ShieldAlert, Eye, MessageSquare, Bookmark, Clock, TrendingUp, Award, BookOpen, CheckCircle2, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { RabbitHole } from "@shared/schema";

interface ReputationData {
  holesCompleted: string[];
  nodesCompleted: number;
}

function getReputation(): ReputationData {
  try {
    const data = localStorage.getItem("rh-reputation");
    return data ? JSON.parse(data) : { holesCompleted: [], nodesCompleted: 0 };
  } catch { return { holesCompleted: [], nodesCompleted: 0 }; }
}

function getAnonId(): string {
  let id = localStorage.getItem("rh-anon-id");
  if (!id) {
    id = "ANON_" + Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem("rh-anon-id", id);
  }
  return id;
}

function getReadingProgress(): Record<string, Record<number, boolean>> {
  const result: Record<string, Record<number, boolean>> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("rh-progress-")) {
      const slug = key.replace("rh-progress-", "");
      try {
        result[slug] = JSON.parse(localStorage.getItem(key) || "{}");
      } catch {}
    }
  }
  return result;
}

const TIERS = [
  { name: "Observer", minPoints: 0, color: "text-muted-foreground" },
  { name: "Curious Mind", minPoints: 10, color: "text-blue-400" },
  { name: "Researcher", minPoints: 30, color: "text-cyan-400" },
  { name: "Analyst", minPoints: 60, color: "text-yellow-400" },
  { name: "Deep Diver", minPoints: 100, color: "text-primary" },
];

function getTier(points: number) {
  let tier = TIERS[0];
  for (const t of TIERS) {
    if (points >= t.minPoints) tier = t;
  }
  return tier;
}

function getNextTier(points: number) {
  for (const t of TIERS) {
    if (points < t.minPoints) return t;
  }
  return null;
}

export default function Profile() {
  const [reputation, setReputation] = useState<ReputationData>({ holesCompleted: [], nodesCompleted: 0 });
  const [progress, setProgress] = useState<Record<string, Record<number, boolean>>>({});

  const { data: holes = [] } = useQuery<RabbitHole[]>({ queryKey: ["/api/holes"] });

  useEffect(() => {
    setReputation(getReputation());
    setProgress(getReadingProgress());
  }, []);

  const anonId = getAnonId();
  const points = (reputation.nodesCompleted || 0) * 2 + (reputation.holesCompleted?.length || 0) * 10;
  const tier = getTier(points);
  const nextTier = getNextTier(points);
  const progressToNext = nextTier ? Math.round(((points - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100) : 100;

  const startedSlugs = Object.keys(progress);
  const startedHoles = holes.filter(h => startedSlugs.includes(h.slug));

  return (
    <div className="min-h-screen flex flex-col" data-testid="page-profile">
      <div className="border-b border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 border-2 border-primary/50 bg-primary/5 flex items-center justify-center relative">
              <ShieldAlert className="w-10 h-10 text-primary/60" />
              <div className="absolute -bottom-1 -right-1 bg-background border border-white/10 px-1.5 py-0.5">
                <span className={`font-mono text-[9px] ${tier.color}`}>{tier.name.toUpperCase()}</span>
              </div>
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold uppercase tracking-wider mb-1" data-testid="text-profile-title">Anonymous Operative</h1>
              <p className="font-mono text-xs text-muted-foreground" data-testid="text-profile-id">SESSION ID: {anonId}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className={`font-mono text-xs ${tier.color}`}>{tier.name.toUpperCase()}</span>
                <span className="font-mono text-xs text-muted-foreground/50">|</span>
                <span className="font-mono text-xs text-primary/60">{points} POINTS</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Target, label: "TOTAL POINTS", value: String(points), color: "text-primary" },
            { icon: BookOpen, label: "NODES COMPLETED", value: String(reputation.nodesCompleted || 0), color: "text-green-500" },
            { icon: CheckCircle2, label: "INVESTIGATIONS COMPLETED", value: String(reputation.holesCompleted?.length || 0), color: "text-yellow-500" },
            { icon: Eye, label: "INVESTIGATIONS STARTED", value: String(startedSlugs.length), color: "text-blue-400" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="border border-white/10 bg-white/[0.02] p-5" data-testid={`stat-${label.toLowerCase().replace(/ /g, '-')}`}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="font-mono text-[10px] text-muted-foreground">{label}</span>
              </div>
              <span className={`font-display text-3xl font-bold ${color}`}>{value}</span>
            </div>
          ))}
        </div>

        <section className="mb-10">
          <h2 className="font-display text-xl uppercase tracking-widest text-muted-foreground mb-6 border-l-2 border-primary pl-4">
            Reputation Tier
          </h2>
          <div className="border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center gap-4 mb-6">
              {TIERS.map((t, i) => (
                <div key={t.name} className="flex items-center gap-2">
                  {i > 0 && <div className="w-4 h-px bg-white/10" />}
                  <div className={`flex items-center gap-1.5 ${points >= t.minPoints ? t.color : "text-muted-foreground/30"}`}>
                    <Award className="w-4 h-4" />
                    <span className="font-mono text-[10px] uppercase">{t.name}</span>
                  </div>
                </div>
              ))}
            </div>
            {nextTier ? (
              <>
                <div className="flex justify-between items-center mb-2">
                  <span className={`font-mono text-xs ${tier.color}`}>{tier.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{nextTier.minPoints - points} pts to {nextTier.name}</span>
                </div>
                <div className="h-2 bg-white/5 overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressToNext}%` }} />
                </div>
              </>
            ) : (
              <div className="text-center py-3">
                <p className={`font-mono text-sm ${tier.color}`}>MAX TIER REACHED</p>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="font-mono text-[10px] text-muted-foreground mb-1">PER NODE</p>
                <p className="font-mono text-sm text-green-500">+2 pts</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-[10px] text-muted-foreground mb-1">PER INVESTIGATION</p>
                <p className="font-mono text-sm text-yellow-500">+10 pts</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-xl uppercase tracking-widest text-muted-foreground mb-6 border-l-2 border-primary pl-4">
            Reading Progress
          </h2>
          {startedHoles.length === 0 ? (
            <div className="border border-dashed border-white/10 p-12 text-center">
              <BookOpen className="w-10 h-10 text-white/10 mx-auto mb-4" />
              <p className="font-mono text-sm text-muted-foreground mb-2">NO READING PROGRESS YET</p>
              <p className="text-xs text-muted-foreground/60">Start reading depth nodes to track your progress here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {startedHoles.map(hole => {
                const nodeProgress = progress[hole.slug] || {};
                const completedCount = Object.keys(nodeProgress).length;
                const isComplete = reputation.holesCompleted?.includes(hole.slug);
                return (
                  <Link key={hole.slug} href={`/rabbithole/${hole.slug}/read`} className="block" data-testid={`progress-${hole.slug}`}>
                    <div className={`border ${isComplete ? "border-green-500/20 bg-green-500/[0.02]" : "border-white/10 bg-white/[0.02]"} p-4 hover:border-white/20 transition-colors`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {isComplete ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <BookOpen className="w-4 h-4 text-primary" />}
                          <h3 className="font-display font-bold">{hole.title}</h3>
                        </div>
                        <span className={`font-mono text-xs ${isComplete ? "text-green-500" : "text-muted-foreground"}`}>
                          {completedCount} NODES
                        </span>
                      </div>
                      <div className="h-1 bg-white/5">
                        <div className={`h-full transition-all ${isComplete ? "bg-green-500" : "bg-primary"}`} style={{ width: `${isComplete ? 100 : Math.min(95, completedCount * 20)}%` }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <div className="border border-white/5 bg-white/[0.01] p-6">
          <h3 className="font-mono text-xs text-primary mb-3">// SYSTEM NOTICE</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You are operating in anonymous mode. All progress and reputation data is stored locally in your browser. 
            Reading depth nodes earns points and tier progression. Complete investigations to unlock higher clearance levels.
          </p>
        </div>
      </main>
    </div>
  );
}
