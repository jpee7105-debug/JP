import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Network, Loader2, GitBranch, ExternalLink, ChevronDown, Crosshair, X } from "lucide-react";
import type { RabbitHole } from "@shared/schema";

interface GraphNode {
  id: string;
  slug: string;
  title: string;
  status: string;
  labels: string[];
  sourceCount: number;
  connections: number;
  updatedAt: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

type ViewMode = "graph" | "timeline";

function nodeGlowColor(labels: string[]): string {
  if (labels.includes("Verified")) return "#4ade80";
  if (labels.includes("Disputed")) return "#f59e0b";
  if (labels.includes("Speculative")) return "#ef4444";
  return "#6b7280";
}

function nodeGlowOpacity(labels: string[]): number {
  if (labels.includes("Verified")) return 0.4;
  if (labels.includes("Disputed")) return 0.4;
  if (labels.includes("Speculative")) return 0.3;
  return 0.2;
}

function labelColor(label: string) {
  switch (label) {
    case "Verified": return "#4ade80";
    case "Disputed": return "#f59e0b";
    case "Speculative": return "#ef4444";
    default: return "#6b7280";
  }
}

function getInitialViewMode(): ViewMode {
  try {
    const stored = localStorage.getItem("connections-view-mode");
    if (stored === "graph" || stored === "timeline") return stored;
  } catch {}
  return "graph";
}

export default function Connections() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const [focusedNode, setFocusedNode] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ node: GraphNode | null; offsetX: number; offsetY: number }>({ node: null, offsetX: 0, offsetY: 0 });
  const timeRef = useRef(0);
  const hoveredRef = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const focusedRef = useRef<string | null>(null);

  const { data: holes = [], isLoading } = useQuery<RabbitHole[]>({
    queryKey: ["/api/holes"],
  });

  const handleViewChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    try { localStorage.setItem("connections-view-mode", mode); } catch {}
  }, []);

  useEffect(() => {
    hoveredRef.current = hoveredNode?.id || null;
  }, [hoveredNode]);

  useEffect(() => {
    selectedRef.current = selectedNode?.id || null;
  }, [selectedNode]);

  useEffect(() => {
    focusedRef.current = focusedNode;
  }, [focusedNode]);

  const getConnectedIds = useCallback((nodeId: string): Set<string> => {
    const connected = new Set<string>();
    connected.add(nodeId);
    edgesRef.current.forEach(e => {
      if (e.source === nodeId) connected.add(e.target);
      if (e.target === nodeId) connected.add(e.source);
    });
    return connected;
  }, []);

  useEffect(() => {
    if (holes.length === 0 || viewMode !== "graph") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const cx = canvas.offsetWidth / 2;
    const cy = canvas.offsetHeight / 2;
    const radius = Math.min(cx, cy) * 0.6;

    const nodes: GraphNode[] = holes.map((h, i) => {
      const angle = (2 * Math.PI * i) / holes.length - Math.PI / 2;
      return {
        id: String(h.id),
        slug: h.slug,
        title: h.title,
        status: h.status,
        labels: (h.labels as string[]) || [],
        sourceCount: h.sourceCount || 0,
        connections: h.connections || 0,
        updatedAt: h.updatedAt ? new Date(h.updatedAt).toISOString() : "",
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
      };
    });

    const edges: GraphEdge[] = [];
    const slugToId: Record<string, string> = {};
    holes.forEach(h => slugToId[h.slug] = String(h.id));

    holes.forEach(h => {
      const connected = (h.connectedSlugs as string[]) || [];
      connected.forEach(cs => {
        const targetId = slugToId[cs];
        if (targetId && !edges.find(e => (e.source === String(h.id) && e.target === targetId) || (e.source === targetId && e.target === String(h.id)))) {
          edges.push({ source: String(h.id), target: targetId });
        }
      });
    });

    nodesRef.current = nodes;
    edgesRef.current = edges;

    function getNodeAt(mx: number, my: number): GraphNode | null {
      for (let i = nodesRef.current.length - 1; i >= 0; i--) {
        const n = nodesRef.current[i];
        const dx = mx - n.x;
        const dy = my - n.y;
        if (dx * dx + dy * dy < 30 * 30) return n;
      }
      return null;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;

      if (dragRef.current.node) {
        dragRef.current.node.x = mouseRef.current.x - dragRef.current.offsetX;
        dragRef.current.node.y = mouseRef.current.y - dragRef.current.offsetY;
        dragRef.current.node.vx = 0;
        dragRef.current.node.vy = 0;
      }

      const n = getNodeAt(mouseRef.current.x, mouseRef.current.y);
      setHoveredNode(n);
      canvas.style.cursor = n ? "pointer" : "default";
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const n = getNodeAt(mx, my);
      if (n) {
        dragRef.current = { node: n, offsetX: mx - n.x, offsetY: my - n.y };
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (dragRef.current.node) {
        const dx = mx - (dragRef.current.node.x + dragRef.current.offsetX);
        const dy = my - (dragRef.current.node.y + dragRef.current.offsetY);
        if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
          const n = getNodeAt(mx, my);
          if (n) {
            setSelectedNode(prev => prev?.id === n.id ? null : n);
            setFocusedNode(null);
          }
        }
      }
      dragRef.current = { node: null, offsetX: 0, offsetY: 0 };
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);

    function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size, y);
      ctx.closePath();
    }

    function simulate() {
      const ns = nodesRef.current;
      const es = edgesRef.current;
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;

      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          let dx = ns[j].x - ns[i].x;
          let dy = ns[j].y - ns[i].y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          let force = 2000 / (dist * dist);
          ns[i].vx -= (dx / dist) * force;
          ns[i].vy -= (dy / dist) * force;
          ns[j].vx += (dx / dist) * force;
          ns[j].vy += (dy / dist) * force;
        }
      }

      for (const e of es) {
        const s = ns.find(n => n.id === e.source)!;
        const t = ns.find(n => n.id === e.target)!;
        let dx = t.x - s.x;
        let dy = t.y - s.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        let force = (dist - 200) * 0.01;
        s.vx += (dx / dist) * force;
        s.vy += (dy / dist) * force;
        t.vx -= (dx / dist) * force;
        t.vy -= (dy / dist) * force;
      }

      for (const n of ns) {
        let dx = cx - n.x;
        let dy = cy - n.y;
        n.vx += dx * 0.0005;
        n.vy += dy * 0.0005;
      }

      for (const n of ns) {
        if (dragRef.current.node === n) continue;
        n.vx *= 0.85;
        n.vy *= 0.85;
        n.x += n.vx;
        n.y += n.vy;
        n.x = Math.max(40, Math.min(w - 40, n.x));
        n.y = Math.max(40, Math.min(h - 40, n.y));
      }
    }

    function draw() {
      if (!ctx || !canvas) return;
      timeRef.current += 0.016;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const ns = nodesRef.current;
      const es = edgesRef.current;
      const hId = hoveredRef.current;
      const sId = selectedRef.current;
      const fId = focusedRef.current;

      const connectedToSelected = sId ? new Set<string>() : null;
      if (sId && connectedToSelected) {
        connectedToSelected.add(sId);
        es.forEach(e => {
          if (e.source === sId) connectedToSelected.add(e.target);
          if (e.target === sId) connectedToSelected.add(e.source);
        });
      }

      const focusSet = fId ? new Set<string>() : null;
      if (fId && focusSet) {
        focusSet.add(fId);
        es.forEach(e => {
          if (e.source === fId) focusSet.add(e.target);
          if (e.target === fId) focusSet.add(e.source);
        });
      }

      for (const e of es) {
        const s = ns.find(n => n.id === e.source)!;
        const t = ns.find(n => n.id === e.target)!;
        if (!s || !t) continue;

        if (focusSet && !focusSet.has(e.source) && !focusSet.has(e.target)) continue;

        const isHighlighted = sId && (sId === e.source || sId === e.target);
        const isDimmed = connectedToSelected && !connectedToSelected.has(e.source) && !connectedToSelected.has(e.target);

        ctx.beginPath();
        ctx.setLineDash([6, 4]);
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);

        if (isHighlighted) {
          const glow = nodeGlowColor(ns.find(n => n.id === sId)?.labels || []);
          ctx.strokeStyle = glow + "60";
          ctx.lineWidth = 1.5;
        } else if (isDimmed) {
          ctx.strokeStyle = "rgba(255,255,255,0.02)";
          ctx.lineWidth = 0.5;
        } else {
          ctx.strokeStyle = "rgba(255,255,255,0.06)";
          ctx.lineWidth = 0.8;
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      for (const n of ns) {
        if (focusSet && !focusSet.has(n.id)) continue;

        const isHovered = hId === n.id;
        const isSelected = sId === n.id;
        const isDimmed = connectedToSelected && !connectedToSelected.has(n.id);
        const r = isHovered || isSelected ? 22 : 16;
        const glow = nodeGlowColor(n.labels);
        const glowAlpha = nodeGlowOpacity(n.labels);

        const nodeOpacity = isDimmed ? 0.15 : 1;
        ctx.globalAlpha = nodeOpacity;

        if (isHovered || isSelected) {
          const outerR = r + 14;
          const outerGlow = ctx.createRadialGradient(n.x, n.y, r, n.x, n.y, outerR);
          outerGlow.addColorStop(0, glow + Math.round(glowAlpha * 255).toString(16).padStart(2, "0"));
          outerGlow.addColorStop(1, glow + "00");
          drawDiamond(ctx, n.x, n.y, outerR);
          ctx.fillStyle = outerGlow;
          ctx.fill();
        }

        drawDiamond(ctx, n.x, n.y, r);
        ctx.fillStyle = "#1a1c1e";
        ctx.fill();

        const borderAlpha = isSelected ? 0.9 : isHovered ? 0.7 : glowAlpha;
        ctx.strokeStyle = glow + Math.round(borderAlpha * 255).toString(16).padStart(2, "0");
        ctx.lineWidth = isSelected ? 2 : isHovered ? 1.5 : 1;
        ctx.stroke();

        ctx.fillStyle = isHovered || isSelected ? "#e0e0e0" : `rgba(255,255,255,0.6)`;
        ctx.font = `${isHovered || isSelected ? 9 : 8}px 'JetBrains Mono', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const shortTitle = n.title.length > 14 ? n.title.slice(0, 12) + ".." : n.title;
        ctx.fillText(shortTitle.toUpperCase(), n.x, n.y + r + 6);

        ctx.globalAlpha = 1;
      }

      simulate();
      animRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, [holes, viewMode]);

  const handleFocusNode = useCallback(() => {
    if (selectedNode) {
      setFocusedNode(prev => prev === selectedNode.id ? null : selectedNode.id);
    }
  }, [selectedNode]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(145deg, #1a1c1e 0%, #141618 100%)" }}>
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const connectedCount = selectedNode
    ? edgesRef.current.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length
    : 0;

  return (
    <div
      className="min-h-screen flex flex-col mil-grid"
      data-testid="page-connections"
      style={{
        background: "linear-gradient(145deg, #1a1c1e 0%, #141618 100%)",
        backgroundImage: `
          linear-gradient(145deg, #1a1c1e 0%, #141618 100%),
          repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(255,255,255,0.015) 59px, rgba(255,255,255,0.015) 60px),
          repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(255,255,255,0.015) 59px, rgba(255,255,255,0.015) 60px)
        `,
      }}
    >
      <div className="border-b border-white/10 px-5 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Network className="w-5 h-5" style={{ color: "#4ade80" }} />
          <h1 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-white/90">Situation Room</h1>
        </div>

        <div className="flex items-center gap-5 text-[10px] font-mono text-white/50">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#4ade80", opacity: 0.6 }} /> VERIFIED
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#f59e0b", opacity: 0.6 }} /> DISPUTED
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#ef4444", opacity: 0.5 }} /> SPECULATIVE
          </span>
        </div>

        <div className="flex border border-white/10 rounded-sm overflow-hidden">
          <button
            data-testid="toggle-graph"
            onClick={() => handleViewChange("graph")}
            className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors"
            style={{
              backgroundColor: viewMode === "graph" ? "rgba(255,255,255,0.08)" : "transparent",
              color: viewMode === "graph" ? "#e0e0e0" : "rgba(255,255,255,0.35)",
            }}
          >
            Graph View
          </button>
          <button
            data-testid="toggle-timeline"
            onClick={() => handleViewChange("timeline")}
            className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors border-l border-white/10"
            style={{
              backgroundColor: viewMode === "timeline" ? "rgba(255,255,255,0.08)" : "transparent",
              color: viewMode === "timeline" ? "#e0e0e0" : "rgba(255,255,255,0.35)",
            }}
          >
            Timeline View
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <div
          style={{
            opacity: viewMode === "graph" ? 1 : 0,
            pointerEvents: viewMode === "graph" ? "auto" : "none",
            position: "absolute",
            inset: 0,
            transition: "opacity 0.4s ease",
          }}
        >
          <canvas ref={canvasRef} className="w-full h-[calc(100vh-120px)]" data-testid="canvas-graph" />

          {selectedNode && viewMode === "graph" && (
            <div
              className="absolute top-4 right-4 w-72 border border-white/10 p-5 backdrop-blur-sm"
              data-testid="panel-node-detail"
              style={{ backgroundColor: "rgba(20,22,24,0.95)" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-mono text-sm font-bold text-white/90 uppercase tracking-wide">{selectedNode.title}</h3>
                  <span
                    className="font-mono text-[10px] uppercase tracking-wider"
                    style={{ color: nodeGlowColor(selectedNode.labels) }}
                  >
                    {selectedNode.status}
                  </span>
                </div>
                <button
                  onClick={() => { setSelectedNode(null); setFocusedNode(null); }}
                  className="text-white/30 hover:text-white/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">Labels</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedNode.labels.map(l => (
                      <span
                        key={l}
                        className="text-[9px] font-mono px-2 py-0.5 uppercase tracking-wider"
                        style={{
                          color: labelColor(l),
                          backgroundColor: labelColor(l) + "15",
                          border: `1px solid ${labelColor(l)}20`,
                        }}
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">Connections</span>
                    <p className="font-mono text-xs text-white/80">{connectedCount}</p>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">Sources</span>
                    <p className="font-mono text-xs text-white/80">{selectedNode.sourceCount}</p>
                  </div>
                </div>

                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">Node ID</span>
                  <p className="font-mono text-[10px] text-white/40">{selectedNode.id}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleFocusNode}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-mono uppercase tracking-wider border transition-colors"
                  style={{
                    borderColor: focusedNode === selectedNode.id ? "#4ade8040" : "rgba(255,255,255,0.1)",
                    backgroundColor: focusedNode === selectedNode.id ? "#4ade8010" : "transparent",
                    color: focusedNode === selectedNode.id ? "#4ade80" : "rgba(255,255,255,0.5)",
                  }}
                  data-testid="btn-focus-node"
                >
                  <Crosshair className="w-3 h-3" />
                  {focusedNode === selectedNode.id ? "Show All" : "Focus Node"}
                </button>
                <div className="flex gap-2">
                  <Link
                    href={`/rabbithole/${selectedNode.slug}`}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-mono uppercase tracking-wider border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-colors"
                    data-testid="link-view-hole"
                  >
                    <ExternalLink className="w-3 h-3" /> View
                  </Link>
                  <Link
                    href={`/rabbithole/${selectedNode.slug}/read`}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-mono uppercase tracking-wider border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-colors"
                    data-testid="link-read-hole"
                  >
                    <GitBranch className="w-3 h-3" /> Read
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            opacity: viewMode === "timeline" ? 1 : 0,
            pointerEvents: viewMode === "timeline" ? "auto" : "none",
            position: "absolute",
            inset: 0,
            transition: "opacity 0.4s ease",
            overflowY: "auto",
          }}
        >
          <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="relative">
              <div
                className="absolute left-4 top-0 bottom-0 w-px"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              />

              {holes.map((hole, idx) => {
                const isExpanded = expandedCard === String(hole.id);
                const glow = nodeGlowColor((hole.labels as string[]) || []);
                const dateStr = hole.updatedAt
                  ? new Date(hole.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                  : "—";

                return (
                  <div key={hole.id} className="relative pl-10 mb-4" data-testid={`timeline-entry-${hole.id}`}>
                    <div
                      className="absolute left-3 top-4 w-3 h-3 rotate-45 border"
                      style={{
                        borderColor: glow + "60",
                        backgroundColor: "#1a1c1e",
                      }}
                    />

                    <div
                      className="corner-notch border border-white/10 transition-all duration-300"
                      style={{
                        backgroundColor: "rgba(20,22,24,0.8)",
                      }}
                    >
                      <button
                        className="w-full text-left p-4 flex items-center justify-between"
                        onClick={() => setExpandedCard(isExpanded ? null : String(hole.id))}
                        data-testid={`timeline-toggle-${hole.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-mono text-xs font-bold text-white/85 uppercase tracking-wide truncate">
                            {hole.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1.5 font-mono text-[9px] uppercase tracking-widest text-white/30">
                            <span>{dateStr}</span>
                            <span className="text-white/10">|</span>
                            <span>{hole.sourceCount || 0} SOURCES</span>
                            <span className="text-white/10">|</span>
                            <span style={{ color: glow + "90" }}>{hole.status}</span>
                          </div>
                        </div>
                        <ChevronDown
                          className="w-4 h-4 text-white/20 transition-transform duration-300 flex-shrink-0 ml-2"
                          style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                        />
                      </button>

                      <div
                        style={{
                          maxHeight: isExpanded ? "300px" : "0px",
                          overflow: "hidden",
                          transition: "max-height 0.3s ease",
                        }}
                      >
                        <div className="px-4 pb-4 border-t border-white/5">
                          <div className="flex flex-wrap gap-1 mt-3 mb-3">
                            {((hole.labels as string[]) || []).map(l => (
                              <span
                                key={l}
                                className="text-[9px] font-mono px-2 py-0.5 uppercase tracking-wider"
                                style={{
                                  color: labelColor(l),
                                  backgroundColor: labelColor(l) + "15",
                                  border: `1px solid ${labelColor(l)}20`,
                                }}
                              >
                                {l}
                              </span>
                            ))}
                          </div>

                          <div className="flex gap-4 mb-3 font-mono text-[9px] text-white/30">
                            <div>
                              <span className="uppercase tracking-widest">Connections</span>
                              <p className="text-white/60 text-xs mt-0.5">{hole.connections || 0}</p>
                            </div>
                            <div>
                              <span className="uppercase tracking-widest">Completion</span>
                              <p className="text-white/60 text-xs mt-0.5">{hole.completion}%</p>
                            </div>
                          </div>

                          <Link
                            href={`/rabbithole/${hole.slug}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-colors"
                            data-testid={`timeline-link-${hole.id}`}
                          >
                            <ExternalLink className="w-3 h-3" /> Open Investigation
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .mil-grid {
          position: relative;
        }
        .mil-grid::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          z-index: 0;
        }
        .mil-grid > * {
          position: relative;
          z-index: 1;
        }
        .corner-notch {
          clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
        }
        .pulse-live {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
