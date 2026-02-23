import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  GitBranch, ChevronLeft, CheckCircle2, AlertTriangle, FileText, 
  Loader2, ChevronRight, ChevronDown, Shield, BookOpen, ExternalLink,
  Layers, Scale, Database, Tag, Headphones, DollarSign, Play, Lock, Crown
} from "lucide-react";
import ThreadComment from "@/components/RedThread";
import RichText from "@/components/RichText";
import { useAuth } from "@/hooks/useAuth";
import type { RabbitHole as RabbitHoleType, Comment, DepthNode, Claim, Source, PodcastEpisode, Podcast, SponsoredPodcastSlot } from "@shared/schema";

type AccessInfo = {
  totalNodes: number;
  previewLimit: number;
  hasFullAccess: boolean;
  loggedIn: boolean;
  plan: string;
};

function statusBadge(status: string) {
  switch (status) {
    case "Verified":
      return <span className="text-green-500 border border-green-500/30 px-2 py-1 flex items-center gap-1 text-xs font-mono"><CheckCircle2 className="w-3 h-3" /> VERIFIED</span>;
    case "Specialist":
      return <span className="text-primary border border-primary/30 px-2 py-1 flex items-center gap-1 text-xs font-mono"><Shield className="w-3 h-3" /> SPECIALIST</span>;
    case "Unsolved":
      return <span className="text-yellow-500 border border-yellow-500/30 px-2 py-1 flex items-center gap-1 text-xs font-mono"><AlertTriangle className="w-3 h-3" /> UNSOLVED</span>;
    default:
      return <span className="text-primary border border-primary/30 px-2 py-1 flex items-center gap-1 text-xs font-mono">ACTIVE</span>;
  }
}

function stanceColor(stance: string) {
  switch (stance) {
    case "Verified": return { text: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" };
    case "Disputed": return { text: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" };
    case "Speculative": return { text: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" };
    default: return { text: "text-muted-foreground", bg: "bg-white/5", border: "border-white/10" };
  }
}

function sourceTypeColor(type: string) {
  switch (type) {
    case "document": return "bg-green-500/10 text-green-500";
    case "book": return "bg-blue-500/10 text-blue-400";
    case "theory": return "bg-orange-500/10 text-orange-400";
    default: return "bg-white/5 text-muted-foreground";
  }
}

export default function RabbitHolePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [activeTab, setActiveTab] = useState("depth");
  const [commentText, setCommentText] = useState("");
  const [expandedNode, setExpandedNode] = useState<number | null>(null);
  const [expandedClaim, setExpandedClaim] = useState<number | null>(null);
  const [overviewMode, setOverviewMode] = useState<'timeline' | 'graph'>('timeline');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, navigate] = useLocation();
  const nodePositionsRef = useRef<{ slug: string; title: string; x: number; y: number; size: number }[]>([]);

  const { data: hole, isLoading: loadingHole } = useQuery<RabbitHoleType>({
    queryKey: [`/api/holes/${slug}`],
  });

  const { data: holeComments = [], isLoading: loadingComments } = useQuery<Comment[]>({
    queryKey: [`/api/holes/${slug}/comments`],
    enabled: !!hole,
  });

  const { data: depthNodesList = [] } = useQuery<DepthNode[]>({
    queryKey: [`/api/holes/${slug}/depth-nodes`],
    enabled: !!hole,
  });

  const { data: access } = useQuery<AccessInfo>({
    queryKey: [`/api/holes/${slug}/access`],
    enabled: !!hole,
  });

  const { data: claimsList = [] } = useQuery<Claim[]>({
    queryKey: [`/api/holes/${slug}/claims`],
    enabled: !!hole,
  });

  const { data: sourcesList = [] } = useQuery<Source[]>({
    queryKey: [`/api/holes/${slug}/sources`],
    enabled: !!hole,
  });

  const { data: podcastData } = useQuery<{ episodes: (PodcastEpisode & { podcast?: Podcast })[]; sponsoredSlot: SponsoredPodcastSlot | null }>({
    queryKey: [`/api/holes/${slug}/podcasts`],
    enabled: !!hole,
  });

  const { data: allHoles = [] } = useQuery<RabbitHoleType[]>({
    queryKey: ['/api/holes'],
    enabled: !!hole && overviewMode === 'graph',
  });

  const addComment = useMutation({
    mutationFn: async (data: { username: string; content: string; reputation: number }) => {
      const res = await apiRequest("POST", `/api/holes/${slug}/comments`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/holes/${slug}/comments`] });
      setCommentText("");
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/comments/${id}/upvote`);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/holes/${slug}/comments`] }),
  });

  const downvoteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/comments/${id}/downvote`);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/holes/${slug}/comments`] }),
  });

  const drawMiniGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hole) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    ctx.fillStyle = '#1a1c1e';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const connectedSlugs = (hole.connectedSlugs || []) as string[];
    const connectedHoles = allHoles.filter(h => connectedSlugs.includes(h.slug));

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.3;
    const centerSize = 14;
    const nodeSize = 10;

    const positions: { slug: string; title: string; x: number; y: number; size: number }[] = [];
    positions.push({ slug: hole.slug, title: hole.title, x: cx, y: cy, size: centerSize });

    connectedHoles.forEach((ch, i) => {
      const angle = (2 * Math.PI * i) / connectedHoles.length - Math.PI / 2;
      const nx = cx + radius * Math.cos(angle);
      const ny = cy + radius * Math.sin(angle);
      positions.push({ slug: ch.slug, title: ch.title, x: nx, y: ny, size: nodeSize });
    });

    positions.slice(1).forEach(node => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(node.x, node.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    const drawDiamond = (x: number, y: number, size: number, fill: string, stroke: string) => {
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size, y);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    const primaryHex = primaryColor.includes(' ')
      ? `hsl(${primaryColor})`
      : primaryColor || '#e11d48';

    drawDiamond(cx, cy, centerSize, 'rgba(225,29,72,0.2)', primaryHex);

    positions.slice(1).forEach(node => {
      drawDiamond(node.x, node.y, nodeSize, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.3)');
    });

    ctx.font = '10px monospace';
    ctx.textAlign = 'center';

    ctx.fillStyle = primaryHex;
    const centerLabel = hole.title.length > 20 ? hole.title.slice(0, 20) + '…' : hole.title;
    ctx.fillText(centerLabel, cx, cy + centerSize + 16);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    positions.slice(1).forEach(node => {
      const label = node.title.length > 18 ? node.title.slice(0, 18) + '…' : node.title;
      ctx.fillText(label, node.x, node.y + nodeSize + 14);
    });

    nodePositionsRef.current = positions;
  }, [hole, allHoles]);

  useEffect(() => {
    if (overviewMode === 'graph' && hole) {
      drawMiniGraph();
    }
  }, [overviewMode, hole, allHoles, drawMiniGraph]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const node of nodePositionsRef.current) {
      if (node.slug === slug) continue;
      const dx = mx - node.x;
      const dy = my - node.y;
      if (Math.abs(dx) + Math.abs(dy) < node.size + 10) {
        navigate(`/rabbithole/${node.slug}`);
        return;
      }
    }
  }, [slug, navigate]);

  if (loadingHole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!hole) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="font-mono text-muted-foreground">INVESTIGATION NOT FOUND</p>
        <Link href="/discover" className="text-primary font-mono text-sm">Return to Discover</Link>
      </div>
    );
  }

  const timeline = (hole.timeline || []) as { year: string; event: string; type: string }[];

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    const anonNames = ["Ghost_Node", "Signal_Lost", "Deep_Archive", "Cipher_X", "Void_Walker", "Red_Thread", "Shadow_Op"];
    addComment.mutate({
      username: anonNames[Math.floor(Math.random() * anonNames.length)],
      content: commentText,
      reputation: Math.floor(Math.random() * 50),
    });
  };

  const podcastEpisodes = podcastData?.episodes || [];
  const sponsoredSlot = podcastData?.sponsoredSlot || null;

  const tabs = [
    { id: "depth", label: "Go Deeper", icon: <Layers className="w-3.5 h-3.5" />, count: depthNodesList.length },
    { id: "overview", label: "Timeline", icon: <GitBranch className="w-3.5 h-3.5" />, count: timeline.length },
    { id: "claims", label: "Claims", icon: <Scale className="w-3.5 h-3.5" />, count: claimsList.length },
    { id: "sources", label: "Sources", icon: <Database className="w-3.5 h-3.5" />, count: sourcesList.length },
    ...(podcastEpisodes.length > 0 ? [{ id: "podcasts", label: "Podcasts", icon: <Headphones className="w-3.5 h-3.5" />, count: podcastEpisodes.length }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      
      <main className="flex-1 overflow-y-auto relative z-10 border-r border-white/5 bg-background">
        
        <nav className="border-b border-white/5 p-4 flex items-center justify-between">
          <Link href="/discover" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors font-mono text-sm uppercase">
            <ChevronLeft className="w-4 h-4" /> Back to Discover
          </Link>
          <div className="flex items-center gap-4">
            {hole.categorySlug && (
              <span className="font-mono text-[10px] px-2 py-1 text-muted-foreground bg-white/5 border border-white/10 flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" /> {hole.categorySlug.toUpperCase()}
              </span>
            )}
            {statusBadge(hole.status)}
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-6 py-12">
          
          <header className="mb-12">
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-6 tracking-tighter" data-testid="text-hole-title">
              {hole.title}
            </h1>
            
            <div className="flex flex-col gap-4 bg-white/[0.02] border border-white/10 p-6">
              <div className="flex items-center justify-between font-mono text-sm">
                <span className="text-muted-foreground">DEPTH LEVEL</span>
                <span className="text-primary">{hole.completion}%</span>
              </div>
              <div className="h-1 bg-white/5 w-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000 ease-out"
                  style={{ width: `${hole.completion}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {depthNodesList.length} Depth Nodes</span>
                  <span className="flex items-center gap-1"><Scale className="w-3 h-3" /> {claimsList.length} Claims</span>
                  <span className="flex items-center gap-1"><Database className="w-3 h-3" /> {sourcesList.length} Sources</span>
                </div>
                {depthNodesList.length > 0 && (
                  <Link href={`/rabbithole/${slug}/read`} className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors" data-testid="button-start-reading">
                    <BookOpen className="w-3 h-3" /> START READING
                  </Link>
                )}
              </div>
            </div>
          </header>

          <section className="mb-12">
            <h2 className="font-display text-xl uppercase tracking-widest text-muted-foreground mb-4 border-l-2 border-primary pl-4">Overview</h2>
            <p className="text-lg leading-relaxed text-foreground/90 font-light">
              {hole.summary}
            </p>
          </section>

          <div className="flex gap-2 border-b border-white/10 mb-8 overflow-x-auto">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                className={`pb-3 px-4 whitespace-nowrap transition-colors border-b-2 font-mono text-sm flex items-center gap-2 ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-white'}`}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`tab-${tab.id}`}
              >
                {tab.icon} {tab.label}
                {tab.count > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded-sm">{tab.count}</span>}
              </button>
            ))}
          </div>

          {activeTab === 'depth' && (
            <div className="space-y-4 mb-20">
              {depthNodesList.length === 0 ? (
                <div className="text-center py-16 font-mono text-sm text-muted-foreground border border-dashed border-white/10 p-8">
                  <Layers className="w-8 h-8 mx-auto mb-4 opacity-30" />
                  NO DEPTH NODES AVAILABLE YET
                </div>
              ) : (
                <>
                  {depthNodesList.map((node, i) => {
                    const isExpanded = expandedNode === node.id;
                    return (
                      <div 
                        key={node.id} 
                        className="border transition-all duration-300 border-white/10 hover:border-primary/30"
                        data-testid={`depth-node-${node.id}`}
                      >
                        <button
                          onClick={() => setExpandedNode(isExpanded ? null : node.id)}
                          className="w-full text-left p-6 flex items-start gap-4"
                        >
                          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center border-2 font-mono text-sm font-bold border-primary text-primary">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-display text-lg font-bold">{node.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2"><RichText text={node.summary} /></p>
                          </div>
                          {isExpanded ? <ChevronDown className="w-5 h-5 text-primary flex-shrink-0 mt-2" /> : <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-2" />}
                        </button>
                        {isExpanded && (
                          <div className="px-6 pb-6 border-t border-white/5">
                            <div className="pt-6 pl-14">
                              <div className="prose prose-invert prose-sm max-w-none">
                                {node.content.split('\n\n').map((p, pi) => (
                                  <p key={pi} className="text-foreground/80 leading-relaxed mb-4"><RichText text={p} /></p>
                                ))}
                              </div>
                              {(node.branchLinks as { label: string; targetSlug: string }[]).length > 0 && (
                                <div className="mt-6 flex flex-wrap gap-2">
                                  {(node.branchLinks as { label: string; targetSlug: string }[]).map((link, li) => (
                                    <Link key={li} href={`/rabbithole/${link.targetSlug}`} className="inline-flex items-center gap-1 text-xs font-mono text-primary bg-primary/10 px-3 py-1 border border-primary/20 hover:bg-primary/20 transition-colors">
                                      <ExternalLink className="w-3 h-3" /> {link.label}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {access && !access.hasFullAccess && access.totalNodes > depthNodesList.length && (
                    <div className="border border-primary/20 bg-primary/[0.02] p-8" data-testid="paywall-cta">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center border-2 border-primary/30 bg-primary/10">
                          <Lock className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-display text-lg font-bold mb-2 flex items-center gap-2">
                            <Crown className="w-5 h-5 text-primary" />
                            {access.totalNodes - depthNodesList.length} MORE DEPTH NODES
                          </h3>
                          <p className="text-muted-foreground text-sm mb-4">
                            You've reached the free preview limit. Upgrade to Pro to unlock the full investigation
                            with all {access.totalNodes} depth nodes and complete research materials.
                          </p>
                          <div className="flex flex-wrap gap-3">
                            <Link
                              href="/pricing"
                              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 text-white font-mono text-sm uppercase tracking-wider transition-colors"
                              data-testid="link-upgrade-pricing"
                            >
                              <Crown className="w-4 h-4" /> UPGRADE TO PRO
                            </Link>
                            {!access.loggedIn && (
                              <Link
                                href="/login"
                                className="inline-flex items-center gap-2 px-6 py-3 border border-white/10 font-mono text-sm uppercase text-muted-foreground hover:text-white hover:border-white/20 transition-colors"
                                data-testid="link-login-paywall"
                              >
                                LOG IN
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="mb-20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-mono text-xs text-muted-foreground uppercase">Investigation Map</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setOverviewMode('timeline')}
                    className={`px-3 py-1.5 text-[10px] font-mono border transition-colors uppercase ${overviewMode === 'timeline' ? 'border-primary text-primary bg-primary/10' : 'border-white/10 text-muted-foreground hover:text-white'}`}
                    data-testid="toggle-overview-timeline"
                  >
                    TIMELINE
                  </button>
                  <button
                    onClick={() => setOverviewMode('graph')}
                    className={`px-3 py-1.5 text-[10px] font-mono border transition-colors uppercase ${overviewMode === 'graph' ? 'border-primary text-primary bg-primary/10' : 'border-white/10 text-muted-foreground hover:text-white'}`}
                    data-testid="toggle-overview-graph"
                  >
                    CONNECTIONS
                  </button>
                </div>
              </div>

              {overviewMode === 'timeline' && (
                <div className="relative pl-8 border-l border-white/10 space-y-12">
                  {timeline.map((item, i) => (
                    <div key={i} className="relative group">
                      <div className={`absolute -left-[37px] top-1 w-4 h-4 bg-background border-2 rounded-full group-hover:bg-green-500 transition-colors z-10 ${item.type === 'verified' ? 'border-green-500' : 'border-yellow-500'}`} />
                      <div className={`font-mono mb-2 ${item.type === 'verified' ? 'text-green-500' : 'text-yellow-500'}`}>{item.year}</div>
                      <p className="text-foreground/80 leading-relaxed">{item.event}</p>
                      {item.type === 'disputed' && (
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-yellow-500 mt-2 bg-yellow-500/10 px-2 py-0.5">
                          <AlertTriangle className="w-3 h-3" /> DISPUTED
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {overviewMode === 'graph' && (
                <canvas
                  ref={canvasRef}
                  className="w-full border border-white/10 bg-[#1a1c1e] rounded-lg cursor-pointer"
                  style={{ height: 400 }}
                  onClick={handleCanvasClick}
                  data-testid="canvas-mini-graph"
                />
              )}
            </div>
          )}

          {activeTab === 'claims' && (
            <div className="space-y-4 mb-20">
              {claimsList.length === 0 ? (
                <div className="text-center py-16 font-mono text-sm text-muted-foreground border border-dashed border-white/10 p-8">
                  <Scale className="w-8 h-8 mx-auto mb-4 opacity-30" />
                  NO CLAIMS DOCUMENTED YET
                </div>
              ) : (
                claimsList.map((claim) => {
                  const sc = stanceColor(claim.stance);
                  const isExpanded = expandedClaim === claim.id;
                  const evidence = (claim.evidence || []) as { sourceId: number; excerpt: string }[];
                  const counterpoints = (claim.counterpoints || []) as { sourceId: number; excerpt: string }[];
                  return (
                    <div key={claim.id} className={`border ${sc.border} transition-all`} data-testid={`claim-${claim.id}`}>
                      <button 
                        onClick={() => setExpandedClaim(isExpanded ? null : claim.id)}
                        className="w-full text-left p-6"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <p className="font-display text-base font-semibold flex-1"><RichText text={claim.statement} /></p>
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-mono text-xs px-2 py-0.5 ${sc.bg} ${sc.text}`}>{claim.stance.toUpperCase()}</span>
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-xs font-mono text-muted-foreground">CONFIDENCE</span>
                            <div className="flex-1 h-1 bg-white/5 max-w-[100px]">
                              <div className={`h-full ${claim.confidence >= 70 ? 'bg-green-500' : claim.confidence >= 40 ? 'bg-yellow-500' : 'bg-orange-500'}`} style={{ width: `${claim.confidence}%` }} />
                            </div>
                            <span className="text-xs font-mono text-muted-foreground">{claim.confidence}%</span>
                          </div>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-6 pb-6 border-t border-white/5 pt-4 space-y-4">
                          {evidence.length > 0 && (
                            <div>
                              <h4 className="font-mono text-xs text-green-500 mb-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> SUPPORTING EVIDENCE</h4>
                              {evidence.map((ev, i) => (
                                <div key={i} className="bg-green-500/5 border border-green-500/10 p-3 text-sm text-foreground/70 mb-2">
                                  "{ev.excerpt}"
                                </div>
                              ))}
                            </div>
                          )}
                          {counterpoints.length > 0 && (
                            <div>
                              <h4 className="font-mono text-xs text-yellow-500 mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> COUNTERPOINTS</h4>
                              {counterpoints.map((cp, i) => (
                                <div key={i} className="bg-yellow-500/5 border border-yellow-500/10 p-3 text-sm text-foreground/70 mb-2">
                                  "{cp.excerpt}"
                                </div>
                              ))}
                            </div>
                          )}
                          {evidence.length === 0 && counterpoints.length === 0 && (
                            <p className="text-sm text-muted-foreground font-mono">No detailed evidence documented yet.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'sources' && (
            <div className="space-y-4 mb-20">
              {sourcesList.length === 0 ? (
                <div className="text-center py-16 font-mono text-sm text-muted-foreground border border-dashed border-white/10 p-8">
                  <Database className="w-8 h-8 mx-auto mb-4 opacity-30" />
                  NO SOURCES CATALOGUED YET
                </div>
              ) : (
                sourcesList.map((source) => (
                  <div key={source.id} className="border border-white/10 bg-white/[0.01] p-5 group hover:border-primary/20 transition-colors" data-testid={`source-${source.id}`}>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[10px] font-mono px-2 py-0.5 ${sourceTypeColor(source.type)}`}>
                            {source.type.toUpperCase()}
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 ${source.stanceTag === 'supporting' ? 'bg-green-500/10 text-green-500' : source.stanceTag === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-muted-foreground'}`}>
                            {source.stanceTag.toUpperCase()}
                          </span>
                        </div>
                        <h4 className="font-display font-bold text-base mb-1">{source.title}</h4>
                        {source.author && <p className="text-xs text-muted-foreground font-mono">{source.author}{source.origin && ` — ${source.origin}`}{source.publishedDate && ` (${source.publishedDate})`}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-mono text-muted-foreground mb-1">CREDIBILITY</div>
                        <div className={`text-lg font-mono font-bold ${source.credibility >= 80 ? 'text-green-500' : source.credibility >= 50 ? 'text-yellow-500' : 'text-orange-500'}`}>
                          {source.credibility}%
                        </div>
                      </div>
                    </div>
                    {source.summary && <p className="text-sm text-foreground/60 leading-relaxed">{source.summary}</p>}
                    {source.url && (
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-mono text-primary mt-3 hover:underline">
                        <ExternalLink className="w-3 h-3" /> VIEW SOURCE
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'podcasts' && (
            <div className="space-y-4 mb-20">
              {sponsoredSlot && (
                <div className="border border-yellow-500/20 bg-yellow-500/5 p-4 mb-4" data-testid="sponsored-slot">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-3 h-3 text-yellow-500" />
                    <span className="text-[10px] font-mono text-yellow-500 uppercase">Sponsored</span>
                  </div>
                  <p className="text-xs font-mono text-yellow-500/80">{sponsoredSlot.disclosureText}</p>
                  {sponsoredSlot.sponsorUrl && (
                    <a href={sponsoredSlot.sponsorUrl} target="_blank" rel="noopener noreferrer sponsored" className="inline-flex items-center gap-1 text-xs font-mono text-yellow-500 mt-2 hover:underline" data-testid="link-sponsor">
                      <ExternalLink className="w-3 h-3" /> {sponsoredSlot.sponsorName}
                    </a>
                  )}
                </div>
              )}
              {podcastEpisodes.length === 0 ? (
                <div className="text-center py-16 font-mono text-sm text-muted-foreground border border-dashed border-white/10 p-8">
                  <Headphones className="w-8 h-8 mx-auto mb-4 opacity-30" />
                  NO PODCAST EPISODES AVAILABLE
                </div>
              ) : (
                podcastEpisodes.map(ep => (
                  <div key={ep.id} className="border border-white/10 bg-white/[0.01] p-5 group hover:border-primary/20 transition-colors" data-testid={`podcast-ep-${ep.id}`}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <Play className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-bold text-base mb-1">{ep.title}</h4>
                        {(ep as any).podcast && <p className="text-[10px] font-mono text-primary/60 mb-1">{(ep as any).podcast.title}{(ep as any).podcast.platform && ` on ${(ep as any).podcast.platform}`}</p>}
                        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground mb-2">
                          {ep.publishedDate && <span>{ep.publishedDate}</span>}
                          {ep.durationSeconds > 0 && <span>{Math.floor(ep.durationSeconds / 60)} min</span>}
                        </div>
                        {ep.description && <p className="text-sm text-foreground/60 leading-relaxed mb-3">{ep.description}</p>}
                        <div className="flex items-center gap-3">
                          {ep.embedUrl && (
                            <div className="w-full mt-2">
                              {ep.embedType === "spotify" ? (
                                <iframe src={ep.embedUrl} width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" className="rounded" data-testid={`embed-spotify-${ep.id}`} />
                              ) : ep.embedType === "youtube" ? (
                                <iframe src={ep.embedUrl} width="100%" height="200" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" className="rounded" data-testid={`embed-youtube-${ep.id}`} />
                              ) : (
                                <iframe src={ep.embedUrl} width="100%" height="152" frameBorder="0" loading="lazy" className="rounded" data-testid={`embed-iframe-${ep.id}`} />
                              )}
                            </div>
                          )}
                          {ep.episodeUrl && !ep.embedUrl && (
                            <a href={ep.episodeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-mono text-primary hover:underline" data-testid={`link-listen-${ep.id}`}>
                              <ExternalLink className="w-3 h-3" /> LISTEN
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </main>

      <aside className="w-full md:w-96 bg-[#111418] border-l border-white/5 flex flex-col relative z-20">
        <div className="p-4 border-b border-white/5 bg-background/50 backdrop-blur-md z-10">
          <h3 className="font-display font-bold flex items-center gap-2">
            <div className="w-4 h-4 relative">
              <div className="absolute inset-0 border-2 border-primary rounded-full" />
              <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2" />
            </div>
            RABBIT HOLE
          </h3>
          <p className="text-xs font-mono text-muted-foreground mt-1">{holeComments.length} contributions</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 relative">
          <div className="absolute left-10 top-0 bottom-0 w-px bg-primary/30" />
          
          {loadingComments ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : holeComments.length === 0 ? (
            <div className="text-center py-12 font-mono text-xs text-muted-foreground">
              NO THREADS YET — BE THE FIRST TO CONTRIBUTE
            </div>
          ) : (
            <div className="space-y-6">
              {holeComments.map((comment) => (
                <ThreadComment 
                  key={comment.id}
                  id={comment.id}
                  user={comment.username} 
                  rep={comment.reputation} 
                  time={new Date(comment.createdAt).toLocaleDateString()}
                  content={comment.content}
                  upvotes={comment.upvotes}
                  links={(comment.links || []) as { text: string; target: string }[]}
                  onUpvote={() => upvoteMutation.mutate(comment.id)}
                  onDownvote={() => downvoteMutation.mutate(comment.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 bg-card/50 space-y-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add your analysis..."
            className="w-full bg-white/5 border border-white/10 p-3 text-sm text-foreground font-mono resize-none h-20 focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/50"
            data-testid="input-comment"
          />
          <button 
            onClick={handleSubmitComment}
            disabled={addComment.isPending || !commentText.trim()}
            className="w-full bg-primary/10 border border-primary/30 text-primary font-mono text-xs uppercase py-2 hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-submit-comment"
          >
            {addComment.isPending ? "TRANSMITTING..." : "SUBMIT ANALYSIS"}
          </button>
        </div>
      </aside>

    </div>
  );
}
