import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Network, Loader2, GitBranch, ExternalLink } from "lucide-react";
import type { RabbitHole } from "@shared/schema";

interface GraphNode {
  id: string;
  slug: string;
  title: string;
  status: string;
  labels: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

function labelColor(label: string) {
  switch (label) {
    case "Verified": return "#22c55e";
    case "Disputed": return "#eab308";
    case "Speculative": return "#f97316";
    default: return "#6b7280";
  }
}

function statusGlow(status: string) {
  switch (status) {
    case "Verified": return "#22c55e";
    case "Active": return "#8b0000";
    case "Specialist": return "#dc2626";
    default: return "#eab308";
  }
}

export default function Connections() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ node: GraphNode | null; offsetX: number; offsetY: number }>({ node: null, offsetX: 0, offsetY: 0 });
  const timeRef = useRef(0);
  const hoveredRef = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(null);

  const { data: holes = [], isLoading } = useQuery<RabbitHole[]>({
    queryKey: ["/api/holes"],
  });

  useEffect(() => {
    hoveredRef.current = hoveredNode?.id || null;
  }, [hoveredNode]);

  useEffect(() => {
    selectedRef.current = selectedNode?.id || null;
  }, [selectedNode]);

  useEffect(() => {
    if (holes.length === 0) return;

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
          if (n) setSelectedNode(prev => prev?.id === n.id ? null : n);
        }
      }
      dragRef.current = { node: null, offsetX: 0, offsetY: 0 };
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);

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

      for (const e of es) {
        const s = ns.find(n => n.id === e.source)!;
        const t = ns.find(n => n.id === e.target)!;
        const isHighlighted = hId && (hId === e.source || hId === e.target);

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);

        if (isHighlighted) {
          const grad = ctx.createLinearGradient(s.x, s.y, t.x, t.y);
          grad.addColorStop(0, "rgba(139, 0, 0, 0.6)");
          grad.addColorStop(0.5, "rgba(139, 0, 0, 0.3)");
          grad.addColorStop(1, "rgba(139, 0, 0, 0.6)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = "rgba(255,255,255,0.06)";
          ctx.lineWidth = 1;
        }
        ctx.stroke();

        if (isHighlighted) {
          const t2 = timeRef.current % 2 / 2;
          const px = s.x + (t.x - s.x) * t2;
          const py = s.y + (t.y - s.y) * t2;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(139, 0, 0, 0.8)";
          ctx.fill();
        }
      }

      for (const n of ns) {
        const isHovered = hId === n.id;
        const isSelected = sId === n.id;
        const r = isHovered || isSelected ? 24 : 18;
        const glow = statusGlow(n.status);
        const pulse = Math.sin(timeRef.current * 2 + parseInt(n.id) * 1.5) * 0.3 + 0.7;

        if (isHovered || isSelected) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 12, 0, Math.PI * 2);
          const outerGlow = ctx.createRadialGradient(n.x, n.y, r, n.x, n.y, r + 12);
          outerGlow.addColorStop(0, glow + "30");
          outerGlow.addColorStop(1, glow + "00");
          ctx.fillStyle = outerGlow;
          ctx.fill();
        }

        const nodeGrad = ctx.createRadialGradient(n.x - r * 0.3, n.y - r * 0.3, 0, n.x, n.y, r);
        nodeGrad.addColorStop(0, "#1a1a1a");
        nodeGrad.addColorStop(1, "#0a0a0a");
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = nodeGrad;
        ctx.fill();

        const borderAlpha = isSelected ? 1 : isHovered ? 0.8 : pulse * 0.3;
        ctx.strokeStyle = isSelected || isHovered ? glow : `rgba(255,255,255,${borderAlpha * 0.4})`;
        ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2 : 1;
        ctx.stroke();

        ctx.fillStyle = isHovered || isSelected ? "#ededed" : `rgba(255,255,255,${0.5 + pulse * 0.3})`;
        ctx.font = `bold ${isHovered || isSelected ? 10 : 9}px 'JetBrains Mono', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const shortTitle = n.title.length > 12 ? n.title.slice(0, 10) + ".." : n.title;
        ctx.fillText(shortTitle.toUpperCase(), n.x, n.y);

        if (n.labels.length > 0) {
          const labelY = n.y + r + 14;
          n.labels.forEach((label, li) => {
            const lx = n.x + (li - (n.labels.length - 1) / 2) * 52;
            const lc = labelColor(label);
            ctx.fillStyle = lc + "20";
            ctx.fillRect(lx - 24, labelY - 7, 48, 14);
            ctx.fillStyle = lc;
            ctx.font = "bold 7px 'JetBrains Mono', monospace";
            ctx.fillText(label.toUpperCase(), lx, labelY);
          });
        }
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
  }, [holes]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" data-testid="page-connections">
      <div className="border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Network className="w-5 h-5 text-primary" />
          <h1 className="font-display text-xl font-bold uppercase tracking-wider">Connection Graph</h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Verified</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Disputed</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Speculative</span>
        </div>
      </div>

      <div className="flex-1 relative">
        <canvas ref={canvasRef} className="w-full h-[calc(100vh-120px)]" data-testid="canvas-graph" />

        {selectedNode && (
          <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-80 bg-card border border-white/10 p-6 backdrop-blur-sm" data-testid="panel-node-detail">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold">{selectedNode.title}</h3>
                <span className="font-mono text-xs text-primary">{selectedNode.status.toUpperCase()}</span>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-muted-foreground hover:text-white text-xs font-mono">[X]</button>
            </div>
            <div className="flex flex-wrap gap-1 mb-4">
              {selectedNode.labels.map(l => (
                <span key={l} className="text-[10px] font-mono px-2 py-0.5" style={{ color: labelColor(l), backgroundColor: labelColor(l) + "15" }}>{l}</span>
              ))}
            </div>
            <div className="flex gap-2">
              <Link href={`/rabbithole/${selectedNode.slug}`} className="flex-1 bg-primary/10 border border-primary/30 text-primary text-center py-2 font-mono text-xs hover:bg-primary/20 transition-colors flex items-center justify-center gap-1" data-testid="link-view-hole">
                <ExternalLink className="w-3 h-3" /> VIEW
              </Link>
              <Link href={`/rabbithole/${selectedNode.slug}/read`} className="flex-1 bg-white/5 border border-white/10 text-white text-center py-2 font-mono text-xs hover:bg-white/10 transition-colors flex items-center justify-center gap-1" data-testid="link-read-hole">
                <GitBranch className="w-3 h-3" /> READ
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
