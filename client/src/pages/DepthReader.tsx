import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, BookOpen, CheckCircle2, Lock, ExternalLink } from "lucide-react";
import type { RabbitHole as RabbitHoleType, DepthNode } from "@shared/schema";

function getProgress(slug: string): Record<number, boolean> {
  try {
    const data = localStorage.getItem(`rh-progress-${slug}`);
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
}

function saveProgress(slug: string, nodeId: number) {
  const current = getProgress(slug);
  current[nodeId] = true;
  localStorage.setItem(`rh-progress-${slug}`, JSON.stringify(current));
}

export default function DepthReader() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedNodes, setCompletedNodes] = useState<Record<number, boolean>>({});

  const { data: hole, isLoading: loadingHole } = useQuery<RabbitHoleType>({
    queryKey: [`/api/holes/${slug}`],
  });

  const { data: nodes = [], isLoading: loadingNodes } = useQuery<DepthNode[]>({
    queryKey: [`/api/holes/${slug}/depth-nodes`],
    enabled: !!hole,
  });

  useEffect(() => {
    if (slug) {
      setCompletedNodes(getProgress(slug));
    }
  }, [slug]);

  const markComplete = useCallback(() => {
    if (!slug || !nodes[currentIndex]) return;
    saveProgress(slug, nodes[currentIndex].id);
    setCompletedNodes(prev => ({ ...prev, [nodes[currentIndex].id]: true }));
  }, [slug, nodes, currentIndex]);

  const goNext = useCallback(() => {
    markComplete();
    if (currentIndex < nodes.length - 1) {
      setCurrentIndex(currentIndex + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentIndex, nodes.length, markComplete]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev]);

  if (loadingHole || loadingNodes) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!hole || nodes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <BookOpen className="w-12 h-12 text-muted-foreground opacity-30" />
        <p className="font-mono text-muted-foreground">NO DEPTH NODES AVAILABLE</p>
        <Link href={`/rabbithole/${slug}`} className="text-primary font-mono text-sm">Back to Investigation</Link>
      </div>
    );
  }

  const currentNode = nodes[currentIndex];
  const totalCompleted = Object.keys(completedNodes).length;
  const progress = Math.round((totalCompleted / nodes.length) * 100);
  const branchLinks = (currentNode.branchLinks || []) as { label: string; targetSlug: string }[];

  return (
    <div className="min-h-screen flex flex-col" data-testid="page-depth-reader">
      <div className="border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-14 z-40">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <Link href={`/rabbithole/${slug}`} className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors font-mono text-xs uppercase" data-testid="link-back">
            <ChevronLeft className="w-4 h-4" /> {hole.title}
          </Link>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-muted-foreground">
              {currentIndex + 1} / {nodes.length}
            </span>
            <span className="font-mono text-xs text-primary">{progress}%</span>
          </div>
        </div>
        <div className="h-0.5 bg-white/5">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="hidden lg:block w-64 border-r border-white/5 bg-black/20 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-mono text-xs text-muted-foreground uppercase mb-4">Sections</h3>
            {nodes.map((node, i) => {
              const isComplete = completedNodes[node.id];
              const isCurrent = i === currentIndex;
              return (
                <button
                  key={node.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-full text-left px-3 py-2.5 mb-1 flex items-center gap-3 text-sm transition-colors ${isCurrent ? "bg-primary/10 text-primary border-l-2 border-primary" : isComplete ? "text-green-500/70 hover:text-green-400" : "text-muted-foreground hover:text-white"}`}
                  data-testid={`nav-node-${node.id}`}
                >
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    {isComplete ? <CheckCircle2 className="w-4 h-4" /> : isCurrent ? <BookOpen className="w-4 h-4" /> : <span className="font-mono text-xs">{i + 1}</span>}
                  </span>
                  <span className="truncate">{node.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <main className="flex-1 max-w-3xl mx-auto px-6 py-12">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 border border-primary/20">
                NODE {currentIndex + 1}
              </span>
              {completedNodes[currentNode.id] && (
                <span className="font-mono text-xs text-green-500 bg-green-500/10 px-2 py-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> COMPLETED
                </span>
              )}
              {currentNode.status === "locked" && (
                <span className="font-mono text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> LOCKED
                </span>
              )}
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4" data-testid="text-node-title">
              {currentNode.title}
            </h1>
            <p className="text-lg text-muted-foreground font-light">{currentNode.summary}</p>
          </div>

          <div className="border-t border-white/5 pt-8 mb-12">
            {currentNode.content.split('\n\n').map((paragraph, i) => (
              <p key={i} className="text-foreground/85 leading-relaxed text-[17px] mb-6 font-light">
                {paragraph}
              </p>
            ))}
          </div>

          {branchLinks.length > 0 && (
            <div className="border border-white/10 bg-white/[0.02] p-6 mb-8">
              <h4 className="font-mono text-xs text-muted-foreground uppercase mb-3">Related Investigations</h4>
              <div className="flex flex-wrap gap-2">
                {branchLinks.map((link, i) => (
                  <Link key={i} href={`/rabbithole/${link.targetSlug}`} className="inline-flex items-center gap-1 text-xs font-mono text-primary bg-primary/10 px-3 py-1.5 border border-primary/20 hover:bg-primary/20 transition-colors" data-testid={`link-branch-${i}`}>
                    <ExternalLink className="w-3 h-3" /> {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-8 border-t border-white/5">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 font-mono text-sm text-muted-foreground hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              data-testid="button-prev"
            >
              <ChevronLeft className="w-5 h-5" /> PREVIOUS
            </button>

            {currentIndex < nodes.length - 1 ? (
              <button
                onClick={goNext}
                className="flex items-center gap-2 font-mono text-sm bg-primary/10 border border-primary/30 text-primary px-6 py-2.5 hover:bg-primary/20 transition-colors"
                data-testid="button-next"
              >
                NEXT NODE <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={markComplete}
                className="flex items-center gap-2 font-mono text-sm bg-green-500/10 border border-green-500/30 text-green-500 px-6 py-2.5 hover:bg-green-500/20 transition-colors"
                data-testid="button-finish"
              >
                <CheckCircle2 className="w-4 h-4" /> COMPLETE
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
