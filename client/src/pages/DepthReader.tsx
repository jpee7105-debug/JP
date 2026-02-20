import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, BookOpen, CheckCircle2, Lock, ExternalLink, Award } from "lucide-react";
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

function getReputation(): { holesCompleted: string[]; nodesCompleted: number } {
  try {
    const data = localStorage.getItem("rh-reputation");
    return data ? JSON.parse(data) : { holesCompleted: [], nodesCompleted: 0 };
  } catch { return { holesCompleted: [], nodesCompleted: 0 }; }
}

function addReputationNode(slug: string, totalNodes: number, completedCount: number) {
  const rep = getReputation();
  rep.nodesCompleted = (rep.nodesCompleted || 0) + 1;
  if (completedCount >= totalNodes && !rep.holesCompleted.includes(slug)) {
    rep.holesCompleted.push(slug);
  }
  localStorage.setItem("rh-reputation", JSON.stringify(rep));
}

export default function DepthReader() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedNodes, setCompletedNodes] = useState<Record<number, boolean>>({});
  const [transitioning, setTransitioning] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: hole, isLoading: loadingHole } = useQuery<RabbitHoleType>({
    queryKey: [`/api/holes/${slug}`],
  });

  const { data: nodes = [], isLoading: loadingNodes } = useQuery<DepthNode[]>({
    queryKey: [`/api/holes/${slug}/depth-nodes`],
    enabled: !!hole,
  });

  useEffect(() => {
    if (slug) {
      const saved = getProgress(slug);
      setCompletedNodes(saved);
    }
  }, [slug]);

  useEffect(() => {
    if (nodes.length > 0 && Object.keys(completedNodes).length >= nodes.length) {
      const allDone = nodes.every(n => completedNodes[n.id]);
      if (allDone) setShowCompletion(true);
    }
  }, [nodes, completedNodes]);

  const isNodeUnlocked = useCallback((index: number): boolean => {
    if (index === 0) return true;
    const prevNode = nodes[index - 1];
    if (!prevNode) return false;
    return !!completedNodes[prevNode.id];
  }, [nodes, completedNodes]);

  const markComplete = useCallback(() => {
    if (!slug || !nodes[currentIndex]) return;
    const nodeId = nodes[currentIndex].id;
    if (completedNodes[nodeId]) return;
    saveProgress(slug, nodeId);
    const newCompleted = { ...completedNodes, [nodeId]: true };
    setCompletedNodes(newCompleted);
    const completedCount = Object.keys(newCompleted).length;
    addReputationNode(slug, nodes.length, completedCount);
    if (completedCount >= nodes.length) {
      setShowCompletion(true);
    }
  }, [slug, nodes, currentIndex, completedNodes]);

  const animateTransition = useCallback((direction: "next" | "prev", callback: () => void) => {
    setTransitioning(true);
    if (contentRef.current) {
      contentRef.current.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      contentRef.current.style.opacity = "0";
      contentRef.current.style.transform = direction === "next" ? "translateX(-20px)" : "translateX(20px)";
    }
    setTimeout(() => {
      callback();
      if (contentRef.current) {
        contentRef.current.style.transform = direction === "next" ? "translateX(20px)" : "translateX(-20px)";
        requestAnimationFrame(() => {
          if (contentRef.current) {
            contentRef.current.style.opacity = "1";
            contentRef.current.style.transform = "translateX(0)";
          }
          setTimeout(() => setTransitioning(false), 300);
        });
      } else {
        setTransitioning(false);
      }
    }, 300);
  }, []);

  const goNext = useCallback(() => {
    if (transitioning) return;
    markComplete();
    if (currentIndex < nodes.length - 1) {
      const nextUnlocked = isNodeUnlocked(currentIndex + 1) || completedNodes[nodes[currentIndex]?.id];
      if (nextUnlocked) {
        animateTransition("next", () => {
          setCurrentIndex(currentIndex + 1);
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      }
    }
  }, [currentIndex, nodes, markComplete, transitioning, isNodeUnlocked, animateTransition, completedNodes]);

  const goPrev = useCallback(() => {
    if (transitioning) return;
    if (currentIndex > 0) {
      animateTransition("prev", () => {
        setCurrentIndex(currentIndex - 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }, [currentIndex, transitioning, animateTransition]);

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
  const currentLocked = !isNodeUnlocked(currentIndex);

  return (
    <div className="min-h-screen flex flex-col" data-testid="page-depth-reader">
      {showCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" data-testid="completion-overlay">
          <div className="text-center max-w-md mx-auto p-8 border border-primary/30 bg-background animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
              <Award className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-3xl font-bold uppercase mb-3" data-testid="text-completion-title">INVESTIGATION COMPLETE</h2>
            <p className="text-muted-foreground mb-2 font-mono text-sm">{hole.title}</p>
            <p className="text-green-500 font-mono text-xs mb-6">ALL {nodes.length} DEPTH NODES COMPLETED</p>
            <div className="flex gap-3 justify-center">
              <Link href={`/rabbithole/${slug}`} className="bg-primary/10 border border-primary/30 text-primary px-6 py-2.5 font-mono text-xs hover:bg-primary/20 transition-colors" data-testid="link-back-to-hole">
                BACK TO INVESTIGATION
              </Link>
              <button onClick={() => setShowCompletion(false)} className="bg-white/5 border border-white/10 text-muted-foreground px-6 py-2.5 font-mono text-xs hover:text-white transition-colors">
                CONTINUE READING
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-14 z-40">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <Link href={`/rabbithole/${slug}`} className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors font-mono text-xs uppercase" data-testid="link-back">
            <ChevronLeft className="w-4 h-4" /> {hole.title}
          </Link>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-muted-foreground">
              {currentIndex + 1} / {nodes.length}
            </span>
            <span className={`font-mono text-xs ${progress >= 100 ? "text-green-500" : "text-primary"}`}>
              {progress >= 100 && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
              {progress}%
            </span>
          </div>
        </div>
        <div className="h-0.5 bg-white/5">
          <div className={`h-full transition-all duration-500 ${progress >= 100 ? "bg-green-500" : "bg-primary"}`} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="hidden lg:block w-64 border-r border-white/5 bg-black/20 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-mono text-xs text-muted-foreground uppercase mb-4">Sections</h3>
            {nodes.map((node, i) => {
              const isComplete = completedNodes[node.id];
              const isCurrent = i === currentIndex;
              const locked = !isNodeUnlocked(i);
              return (
                <button
                  key={node.id}
                  onClick={() => !locked && !transitioning && setCurrentIndex(i)}
                  disabled={locked}
                  className={`w-full text-left px-3 py-2.5 mb-1 flex items-center gap-3 text-sm transition-colors ${locked ? "text-muted-foreground/30 cursor-not-allowed" : isCurrent ? "bg-primary/10 text-primary border-l-2 border-primary" : isComplete ? "text-green-500/70 hover:text-green-400" : "text-muted-foreground hover:text-white"}`}
                  data-testid={`nav-node-${node.id}`}
                >
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    {locked ? <Lock className="w-3 h-3" /> : isComplete ? <CheckCircle2 className="w-4 h-4" /> : isCurrent ? <BookOpen className="w-4 h-4" /> : <span className="font-mono text-xs">{i + 1}</span>}
                  </span>
                  <span className="truncate">{node.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <main className="flex-1 max-w-3xl mx-auto px-6 py-12">
          <div ref={contentRef} style={{ opacity: 1, transform: "translateX(0)" }}>
            {currentLocked ? (
              <div className="text-center py-20" data-testid="locked-node">
                <Lock className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
                <h2 className="font-display text-2xl font-bold mb-3">NODE LOCKED</h2>
                <p className="text-muted-foreground font-mono text-sm mb-6">Complete the previous depth node to unlock this section.</p>
                <button onClick={goPrev} className="bg-primary/10 border border-primary/30 text-primary px-6 py-2.5 font-mono text-xs hover:bg-primary/20 transition-colors">
                  <ChevronLeft className="w-4 h-4 inline mr-1" /> GO BACK
                </button>
              </div>
            ) : (
              <>
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

                {currentNode.mediaUrl && (
                  <div className="border border-white/10 bg-white/[0.02] p-4 mb-8 overflow-hidden">
                    <img src={currentNode.mediaUrl} alt={currentNode.title} className="max-w-full h-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}

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
                    disabled={currentIndex === 0 || transitioning}
                    className="flex items-center gap-2 font-mono text-sm text-muted-foreground hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    data-testid="button-prev"
                  >
                    <ChevronLeft className="w-5 h-5" /> PREVIOUS
                  </button>

                  {currentIndex < nodes.length - 1 ? (
                    <button
                      onClick={goNext}
                      disabled={transitioning}
                      className="flex items-center gap-2 font-mono text-sm bg-primary/10 border border-primary/30 text-primary px-6 py-2.5 hover:bg-primary/20 transition-colors disabled:opacity-50"
                      data-testid="button-next"
                    >
                      NEXT NODE <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => { markComplete(); }}
                      disabled={transitioning}
                      className="flex items-center gap-2 font-mono text-sm bg-green-500/10 border border-green-500/30 text-green-500 px-6 py-2.5 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                      data-testid="button-finish"
                    >
                      <CheckCircle2 className="w-4 h-4" /> COMPLETE INVESTIGATION
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
