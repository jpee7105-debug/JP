import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Network, Loader2, ExternalLink, ChevronDown, RotateCcw, Users, GitFork, Eye, EyeOff } from "lucide-react";
import type { RabbitHole, Person, Relationship } from "@shared/schema";
import { FAMILY_RELATIONSHIP_TYPES } from "@shared/schema";

interface GraphNode {
  id: string;
  entityType: "case" | "person";
  entityId: number;
  slug?: string;
  title: string;
  status: string;
  labels: string[];
  sourceCount: number;
  connections: number;
  x: number;
  y: number;
}

interface GraphEdge {
  source: string;
  target: string;
  relationshipType: string;
  isFamily: boolean;
}

type ViewMode = "graph" | "family" | "timeline";

function getInitialViewMode(): ViewMode {
  try {
    const stored = localStorage.getItem("connections-view-mode");
    if (stored === "graph" || stored === "family" || stored === "timeline") return stored;
  } catch {}
  return "graph";
}

function getSavedPositions(): Record<string, { x: number; y: number }> {
  try {
    const stored = localStorage.getItem("graph-positions");
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

function savePositions(positions: Record<string, { x: number; y: number }>) {
  try {
    localStorage.setItem("graph-positions", JSON.stringify(positions));
  } catch {}
}

function labelColor(label: string) {
  switch (label) {
    case "Verified": return "#4ade80";
    case "Disputed": return "#f59e0b";
    case "Speculative": return "#ef4444";
    default: return "#6b7280";
  }
}

function computeForceLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  iterations = 120
): void {
  const cx = width / 2;
  const cy = height / 2;

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;
    const vx = new Float64Array(nodes.length);
    const vy = new Float64Array(nodes.length);

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        let dx = nodes[j].x - nodes[i].x;
        let dy = nodes[j].y - nodes[i].y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        let force = 3000 / (dist * dist);
        vx[i] -= (dx / dist) * force;
        vy[i] -= (dy / dist) * force;
        vx[j] += (dx / dist) * force;
        vy[j] += (dy / dist) * force;
      }
    }

    const nodeMap = new Map<string, number>();
    nodes.forEach((n, i) => nodeMap.set(n.id, i));

    for (const e of edges) {
      const si = nodeMap.get(e.source);
      const ti = nodeMap.get(e.target);
      if (si === undefined || ti === undefined) continue;
      let dx = nodes[ti].x - nodes[si].x;
      let dy = nodes[ti].y - nodes[si].y;
      let dist = Math.sqrt(dx * dx + dy * dy) || 1;
      let force = (dist - 180) * 0.015;
      vx[si] += (dx / dist) * force;
      vy[si] += (dy / dist) * force;
      vx[ti] -= (dx / dist) * force;
      vy[ti] -= (dy / dist) * force;
    }

    for (let i = 0; i < nodes.length; i++) {
      let dx = cx - nodes[i].x;
      let dy = cy - nodes[i].y;
      vx[i] += dx * 0.001;
      vy[i] += dy * 0.001;
    }

    for (let i = 0; i < nodes.length; i++) {
      nodes[i].x += vx[i] * alpha;
      nodes[i].y += vy[i] * alpha;
      nodes[i].x = Math.max(60, Math.min(width - 60, nodes[i].x));
      nodes[i].y = Math.max(60, Math.min(height - 60, nodes[i].y));
    }
  }
}

function computeFamilyTreeLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  centeredPersonId?: string
): void {
  const personNodes = nodes.filter(n => n.entityType === "person");
  if (personNodes.length === 0) return;

  const centerNode = centeredPersonId
    ? personNodes.find(n => n.id === centeredPersonId) || personNodes[0]
    : personNodes[0];

  const familyEdges = edges.filter(e => e.isFamily);

  const parents: GraphNode[] = [];
  const children: GraphNode[] = [];
  const spouses: GraphNode[] = [];
  const siblings: GraphNode[] = [];
  const others: GraphNode[] = [];

  for (const node of personNodes) {
    if (node.id === centerNode.id) continue;
    const rel = familyEdges.find(
      e => (e.source === centerNode.id && e.target === node.id) ||
           (e.target === centerNode.id && e.source === node.id)
    );
    if (!rel) { others.push(node); continue; }
    const type = rel.relationshipType;
    if (type === "parent_of" && rel.source === node.id) parents.push(node);
    else if (type === "parent_of" && rel.target === node.id) children.push(node);
    else if (type === "child_of" && rel.source === node.id) children.push(node);
    else if (type === "child_of" && rel.target === node.id) parents.push(node);
    else if (type === "spouse_of") spouses.push(node);
    else if (type === "sibling_of") siblings.push(node);
    else others.push(node);
  }

  const cx = width / 2;
  const cy = height / 2;
  centerNode.x = cx;
  centerNode.y = cy;

  const spacing = 120;

  parents.forEach((n, i) => {
    n.x = cx + (i - (parents.length - 1) / 2) * spacing;
    n.y = cy - spacing * 1.5;
  });

  children.forEach((n, i) => {
    n.x = cx + (i - (children.length - 1) / 2) * spacing;
    n.y = cy + spacing * 1.5;
  });

  spouses.forEach((n, i) => {
    n.x = cx + spacing * (i + 1);
    n.y = cy;
  });

  siblings.forEach((n, i) => {
    n.x = cx - spacing * (i + 1);
    n.y = cy;
  });

  others.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / Math.max(others.length, 1);
    n.x = cx + Math.cos(angle) * spacing * 2.5;
    n.y = cy + Math.sin(angle) * spacing * 2.5;
  });
}

export default function Connections() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const [showPeople, setShowPeople] = useState(true);
  const [showFamilyEdges, setShowFamilyEdges] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<GraphEdge | null>(null);
  const [familyCenterId, setFamilyCenterId] = useState<string | undefined>();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const animRef = useRef<number>(0);
  const dragRef = useRef<{ node: GraphNode | null; offsetX: number; offsetY: number; didDrag: boolean }>({ node: null, offsetX: 0, offsetY: 0, didDrag: false });
  const hoveredRef = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const hoveredEdgeRef = useRef<GraphEdge | null>(null);
  const layoutComputedRef = useRef(false);
  const needsRenderRef = useRef(true);

  const { data: holes = [], isLoading: holesLoading } = useQuery<RabbitHole[]>({
    queryKey: ["/api/holes"],
  });

  const { data: people = [], isLoading: peopleLoading } = useQuery<Person[]>({
    queryKey: ["/api/people"],
  });

  const { data: relationships = [], isLoading: relsLoading } = useQuery<Relationship[]>({
    queryKey: ["/api/relationships"],
  });

  const isLoading = holesLoading || peopleLoading || relsLoading;

  const handleViewChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    layoutComputedRef.current = false;
    needsRenderRef.current = true;
    try { localStorage.setItem("connections-view-mode", mode); } catch {}
  }, []);

  useEffect(() => { hoveredRef.current = hoveredNode?.id || null; }, [hoveredNode]);
  useEffect(() => { selectedRef.current = selectedNode?.id || null; }, [selectedNode]);
  useEffect(() => { hoveredEdgeRef.current = hoveredEdge; }, [hoveredEdge]);

  const { nodes: graphNodes, edges: graphEdges } = useMemo(() => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    const slugToNodeId: Record<string, string> = {};

    holes.forEach(h => {
      const nodeId = `case-${h.id}`;
      slugToNodeId[h.slug] = nodeId;
      nodes.push({
        id: nodeId,
        entityType: "case",
        entityId: h.id,
        slug: h.slug,
        title: h.title,
        status: h.status,
        labels: (h.labels as string[]) || [],
        sourceCount: h.sourceCount || 0,
        connections: h.connections || 0,
        x: 0,
        y: 0,
      });
    });

    people.forEach(p => {
      nodes.push({
        id: `person-${p.id}`,
        entityType: "person",
        entityId: p.id,
        title: p.fullName,
        status: p.status,
        labels: (p.tags as string[]) || [],
        sourceCount: 0,
        connections: 0,
        x: 0,
        y: 0,
      });
    });

    holes.forEach(h => {
      const connected = (h.connectedSlugs as string[]) || [];
      connected.forEach(cs => {
        const sourceId = `case-${h.id}`;
        const targetId = slugToNodeId[cs];
        if (targetId && !edges.find(e =>
          (e.source === sourceId && e.target === targetId) ||
          (e.source === targetId && e.target === sourceId)
        )) {
          edges.push({ source: sourceId, target: targetId, relationshipType: "connected", isFamily: false });
        }
      });
    });

    relationships.forEach(r => {
      const fromNodeId = r.fromType === "person" ? `person-${r.fromId}` : `case-${r.fromId}`;
      const toNodeId = r.toType === "person" ? `person-${r.toId}` : `case-${r.toId}`;
      const isFamily = (FAMILY_RELATIONSHIP_TYPES as readonly string[]).includes(r.relationshipType);
      if (!edges.find(e =>
        (e.source === fromNodeId && e.target === toNodeId) ||
        (e.source === toNodeId && e.target === fromNodeId)
      )) {
        edges.push({ source: fromNodeId, target: toNodeId, relationshipType: r.relationshipType, isFamily });
      }
    });

    return { nodes, edges };
  }, [holes, people, relationships]);

  const resetLayout = useCallback(() => {
    layoutComputedRef.current = false;
    try { localStorage.removeItem("graph-positions"); } catch {}
    needsRenderRef.current = true;
  }, []);

  useEffect(() => {
    if (graphNodes.length === 0 || (viewMode !== "graph" && viewMode !== "family")) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      needsRenderRef.current = true;
    };
    resize();
    window.addEventListener("resize", resize);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    const nodesCopy: GraphNode[] = graphNodes.map(n => ({ ...n }));

    if (viewMode === "graph") {
      const saved = getSavedPositions();
      let needsLayout = false;

      nodesCopy.forEach((n, i) => {
        if (saved[n.id]) {
          n.x = saved[n.id].x;
          n.y = saved[n.id].y;
        } else {
          const angle = (2 * Math.PI * i) / nodesCopy.length - Math.PI / 2;
          const radius = Math.min(w, h) * 0.35;
          n.x = w / 2 + radius * Math.cos(angle);
          n.y = h / 2 + radius * Math.sin(angle);
          needsLayout = true;
        }
      });

      if (needsLayout && !layoutComputedRef.current) {
        computeForceLayout(nodesCopy, graphEdges, w, h);
        const positions: Record<string, { x: number; y: number }> = {};
        nodesCopy.forEach(n => { positions[n.id] = { x: n.x, y: n.y }; });
        savePositions(positions);
      }
    } else if (viewMode === "family") {
      computeFamilyTreeLayout(nodesCopy, graphEdges, w, h, familyCenterId);
    }

    layoutComputedRef.current = true;
    nodesRef.current = nodesCopy;
    edgesRef.current = graphEdges;

    function getNodeAt(mx: number, my: number): GraphNode | null {
      for (let i = nodesRef.current.length - 1; i >= 0; i--) {
        const n = nodesRef.current[i];
        if (!showPeople && n.entityType === "person") continue;
        if (viewMode === "family" && n.entityType === "case") continue;
        const dx = mx - n.x;
        const dy = my - n.y;
        const hitR = n.entityType === "case" ? 30 : 20;
        if (dx * dx + dy * dy < hitR * hitR) return n;
      }
      return null;
    }

    function getEdgeAt(mx: number, my: number): GraphEdge | null {
      const ns = nodesRef.current;
      for (const e of edgesRef.current) {
        const s = ns.find(n => n.id === e.source);
        const t = ns.find(n => n.id === e.target);
        if (!s || !t) continue;

        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) continue;

        const param = Math.max(0, Math.min(1, ((mx - s.x) * dx + (my - s.y) * dy) / lenSq));
        const projX = s.x + param * dx;
        const projY = s.y + param * dy;
        const distSq = (mx - projX) * (mx - projX) + (my - projY) * (my - projY);
        if (distSq < 64) return e;
      }
      return null;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (dragRef.current.node) {
        dragRef.current.node.x = mx - dragRef.current.offsetX;
        dragRef.current.node.y = my - dragRef.current.offsetY;
        dragRef.current.didDrag = true;
        needsRenderRef.current = true;
      }

      const n = getNodeAt(mx, my);
      setHoveredNode(n);
      if (!n) {
        const edge = getEdgeAt(mx, my);
        setHoveredEdge(edge);
      } else {
        setHoveredEdge(null);
      }
      canvas.style.cursor = n ? "pointer" : "default";
      needsRenderRef.current = true;
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const n = getNodeAt(mx, my);
      if (n) {
        dragRef.current = { node: n, offsetX: mx - n.x, offsetY: my - n.y, didDrag: false };
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (dragRef.current.node) {
        if (dragRef.current.didDrag && viewMode === "graph") {
          const positions = getSavedPositions();
          nodesRef.current.forEach(n => { positions[n.id] = { x: n.x, y: n.y }; });
          savePositions(positions);
        }

        if (!dragRef.current.didDrag) {
          const rect = canvas.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;
          const n = getNodeAt(mx, my);
          if (n) {
            if (viewMode === "family" && n.entityType === "person") {
              setFamilyCenterId(n.id);
              layoutComputedRef.current = false;
            } else {
              if (n.entityType === "case" && n.slug) {
                navigate(`/rabbithole/${n.slug}`);
              } else if (n.entityType === "person") {
                navigate(`/people/${n.entityId}`);
              }
            }
          }
        }
      }
      dragRef.current = { node: null, offsetX: 0, offsetY: 0, didDrag: false };
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

    function draw() {
      if (!ctx || !canvas) return;
      if (!needsRenderRef.current) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }
      needsRenderRef.current = false;

      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const ns = nodesRef.current;
      const es = edgesRef.current;
      const hId = hoveredRef.current;
      const sId = selectedRef.current;
      const hEdge = hoveredEdgeRef.current;

      const visibleNodes = viewMode === "family"
        ? ns.filter(n => n.entityType === "person")
        : showPeople ? ns : ns.filter(n => n.entityType === "case");

      const visibleNodeIds = new Set(visibleNodes.map(n => n.id));

      const visibleEdges = es.filter(e => {
        if (!visibleNodeIds.has(e.source) || !visibleNodeIds.has(e.target)) return false;
        if (viewMode === "family") return e.isFamily;
        if (!showFamilyEdges && e.isFamily) return false;
        return true;
      });

      for (const e of visibleEdges) {
        const s = ns.find(n => n.id === e.source);
        const t = ns.find(n => n.id === e.target);
        if (!s || !t) continue;

        const isHoveredEdge = hEdge && hEdge.source === e.source && hEdge.target === e.target;

        ctx.beginPath();
        if (e.isFamily) {
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = isHoveredEdge ? 1.5 : 0.8;
        } else {
          ctx.setLineDash([]);
          ctx.lineWidth = isHoveredEdge ? 2 : 1;
        }

        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = isHoveredEdge ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.12)";
        ctx.stroke();
        ctx.setLineDash([]);

        if (isHoveredEdge) {
          const midX = (s.x + t.x) / 2;
          const midY = (s.y + t.y) / 2;
          const label = e.relationshipType.replace(/_/g, " ");
          ctx.font = "10px 'JetBrains Mono', monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const tw = ctx.measureText(label.toUpperCase()).width;
          ctx.fillStyle = "rgba(14,14,14,0.9)";
          ctx.fillRect(midX - tw / 2 - 6, midY - 8, tw + 12, 16);
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.fillText(label.toUpperCase(), midX, midY);
        }
      }

      for (const n of visibleNodes) {
        const isHovered = hId === n.id;
        const isSelected = sId === n.id;
        const isCaseNode = n.entityType === "case";
        const r = isCaseNode ? (isHovered || isSelected ? 26 : 22) : (isHovered || isSelected ? 16 : 14);
        const glowColor = isCaseNode ? "#8B0000" : "#3b82f6";

        if (isHovered || isSelected) {
          const outerR = r + 16;
          const outerGlow = ctx.createRadialGradient(n.x, n.y, r, n.x, n.y, outerR);
          outerGlow.addColorStop(0, glowColor + "60");
          outerGlow.addColorStop(1, glowColor + "00");
          if (isCaseNode) {
            drawDiamond(ctx, n.x, n.y, outerR);
          } else {
            ctx.beginPath();
            ctx.arc(n.x, n.y, outerR, 0, Math.PI * 2);
          }
          ctx.fillStyle = outerGlow;
          ctx.fill();
        }

        if (isCaseNode) {
          drawDiamond(ctx, n.x, n.y, r);
        } else {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        }
        ctx.fillStyle = "#1a1c1e";
        ctx.fill();

        const borderAlpha = isSelected ? 0.9 : isHovered ? 0.7 : 0.4;
        ctx.strokeStyle = glowColor + Math.round(borderAlpha * 255).toString(16).padStart(2, "0");
        ctx.lineWidth = isSelected ? 2 : isHovered ? 1.5 : 1;
        ctx.stroke();

        ctx.fillStyle = isHovered || isSelected ? "#e0e0e0" : "rgba(255,255,255,0.6)";
        ctx.font = `${isHovered || isSelected ? 9 : 8}px 'JetBrains Mono', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const maxLen = isCaseNode ? 14 : 12;
        const shortTitle = n.title.length > maxLen ? n.title.slice(0, maxLen - 2) + ".." : n.title;
        ctx.fillText(shortTitle.toUpperCase(), n.x, n.y + r + 6);

        if (!isCaseNode) {
          ctx.fillStyle = "rgba(255,255,255,0.25)";
          ctx.font = "7px 'JetBrains Mono', monospace";
          ctx.fillText("PERSON", n.x, n.y + r + 18);
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }

    needsRenderRef.current = true;
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, [graphNodes, graphEdges, viewMode, showPeople, showFamilyEdges, familyCenterId, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0E0E0E" }}>
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col mil-grid"
      data-testid="page-connections"
      style={{
        background: "#0E0E0E",
        backgroundImage: `
          linear-gradient(145deg, #0E0E0E 0%, #0a0a0a 100%),
          repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(255,255,255,0.015) 59px, rgba(255,255,255,0.015) 60px),
          repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(255,255,255,0.015) 59px, rgba(255,255,255,0.015) 60px)
        `,
      }}
    >
      <div className="border-b border-white/10 px-5 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Network className="w-5 h-5" style={{ color: "#8B0000" }} />
          <h1 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-white/90" data-testid="heading-situation-room">
            Situation Room
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {viewMode === "graph" && (
            <>
              <button
                data-testid="toggle-show-people"
                onClick={() => { setShowPeople(p => !p); needsRenderRef.current = true; }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border transition-colors"
                style={{
                  borderColor: showPeople ? "#3b82f640" : "rgba(255,255,255,0.1)",
                  backgroundColor: showPeople ? "#3b82f610" : "transparent",
                  color: showPeople ? "#3b82f6" : "rgba(255,255,255,0.4)",
                }}
              >
                {showPeople ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                People
              </button>

              <button
                data-testid="toggle-family-edges"
                onClick={() => { setShowFamilyEdges(f => !f); needsRenderRef.current = true; }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border transition-colors"
                style={{
                  borderColor: showFamilyEdges ? "#4ade8040" : "rgba(255,255,255,0.1)",
                  backgroundColor: showFamilyEdges ? "#4ade8010" : "transparent",
                  color: showFamilyEdges ? "#4ade80" : "rgba(255,255,255,0.4)",
                }}
              >
                <GitFork className="w-3 h-3" />
                Family
              </button>

              <button
                data-testid="btn-reset-layout"
                onClick={resetLayout}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </>
          )}
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
            Graph
          </button>
          <button
            data-testid="toggle-family"
            onClick={() => handleViewChange("family")}
            className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors border-l border-white/10"
            style={{
              backgroundColor: viewMode === "family" ? "rgba(255,255,255,0.08)" : "transparent",
              color: viewMode === "family" ? "#e0e0e0" : "rgba(255,255,255,0.35)",
            }}
          >
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Family Tree</span>
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
            Timeline
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <div
          style={{
            opacity: viewMode === "graph" || viewMode === "family" ? 1 : 0,
            pointerEvents: viewMode === "graph" || viewMode === "family" ? "auto" : "none",
            position: "absolute",
            inset: 0,
            transition: "opacity 0.4s ease",
          }}
        >
          <canvas ref={canvasRef} className="w-full h-[calc(100vh-120px)]" data-testid="canvas-graph" />

          {viewMode === "family" && (
            <div className="absolute top-4 left-4 px-3 py-2 border border-white/10 bg-black/70 backdrop-blur-sm">
              <p className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                Click a person node to re-center the tree
              </p>
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

              {holes.map((hole) => {
                const isExpanded = expandedCard === String(hole.id);
                const glow = labelColor(((hole.labels as string[]) || [])[0] || "");
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
                      style={{ backgroundColor: "rgba(20,22,24,0.8)" }}
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
      `}</style>
    </div>
  );
}