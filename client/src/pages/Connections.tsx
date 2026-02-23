import { useState, useCallback, useMemo, memo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Network, Loader2, ExternalLink, ChevronDown, RotateCcw, Users, GitFork, Eye, EyeOff, Map } from "lucide-react";
import type { RabbitHole, Person, Relationship } from "@shared/schema";
import { FAMILY_RELATIONSHIP_TYPES } from "@shared/schema";
import {
  ReactFlow,
  Background,
  MiniMap,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
  type OnNodesChange,
  type NodeChange,
  Handle,
  Position,
  getBezierPath,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

type ViewMode = "graph" | "family" | "timeline";

function getInitialViewMode(): ViewMode {
  try {
    const stored = localStorage.getItem("connections-view-mode");
    if (stored === "graph" || stored === "family" || stored === "timeline") return stored;
  } catch {}
  return "graph";
}

function labelColor(label: string) {
  switch (label) {
    case "Verified": return "#4ade80";
    case "Disputed": return "#f59e0b";
    case "Speculative": return "#ef4444";
    default: return "#6b7280";
  }
}

const CaseNode = memo(({ data, selected }: NodeProps) => {
  const isHovered = data.isHovered as boolean;
  const highlight = selected || isHovered;
  const size = highlight ? 52 : 44;
  const half = size / 2;

  return (
    <div
      data-testid={`node-case-${data.entityId}`}
      style={{ width: size, height: size, position: "relative", cursor: "pointer" }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none" }} />

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", top: 0, left: 0 }}>
        <polygon
          points={`${half},2 ${size - 2},${half} ${half},${size - 2} 2,${half}`}
          fill="#161a1e"
          stroke={highlight ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)"}
          strokeWidth={highlight ? 2 : 1}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          bottom: -18,
          left: "50%",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "9px",
          color: highlight ? "#e0e0e0" : "rgba(255,255,255,0.6)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        {(data.label as string).length > 16 ? (data.label as string).slice(0, 14) + ".." : data.label as string}
      </div>
    </div>
  );
});
CaseNode.displayName = "CaseNode";

const PersonNode = memo(({ data, selected }: NodeProps) => {
  const isHovered = data.isHovered as boolean;
  const highlight = selected || isHovered;
  const size = highlight ? 32 : 28;

  return (
    <div
      data-testid={`node-person-${data.entityId}`}
      style={{ width: size, height: size, position: "relative", cursor: "pointer" }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none" }} />

      {highlight && (
        <div
          style={{
            position: "absolute",
            inset: -8,
            background: "radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
      )}

      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "#161a1e",
          border: `${highlight ? 2 : 1}px solid ${highlight ? "#3b82f6" : "rgba(59,130,246,0.4)"}`,
          boxSizing: "border-box",
        }}
      />

      <div
        className="node-label-person"
        style={{
          position: "absolute",
          bottom: -16,
          left: "50%",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "8px",
          color: highlight ? "#e0e0e0" : "rgba(255,255,255,0.5)",
          textTransform: "uppercase",
          letterSpacing: "0.03em",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        {(data.label as string).length > 12 ? (data.label as string).slice(0, 10) + ".." : data.label as string}
      </div>
    </div>
  );
});
PersonNode.displayName = "PersonNode";

const RelationshipEdge = memo(({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data, style,
}: EdgeProps) => {
  const isFamily = data?.isFamily as boolean;
  const isHovered = data?.isHovered as boolean;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
  });

  return (
    <>
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={isHovered ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.12)"}
        strokeWidth={isHovered ? 2 : (isFamily ? 0.8 : 1)}
        strokeDasharray={isFamily ? "5,5" : undefined}
        style={style}
      />
      {isHovered && data?.relationshipType && (
        <foreignObject
          x={labelX - 60}
          y={labelY - 10}
          width={120}
          height={20}
          style={{ overflow: "visible", pointerEvents: "none" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "9px",
                color: "rgba(255,255,255,0.7)",
                backgroundColor: "rgba(17,20,24,0.95)",
                padding: "2px 6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                whiteSpace: "nowrap",
              }}
            >
              {(data.relationshipType as string).replace(/_/g, " ")}
            </span>
          </div>
        </foreignObject>
      )}
    </>
  );
});
RelationshipEdge.displayName = "RelationshipEdge";

const nodeTypes = { caseNode: CaseNode, personNode: PersonNode };
const edgeTypes = { relationship: RelationshipEdge };

function computeInitialLayout(
  caseNodes: { id: string; entityId: number; label: string; graphX?: number | null; graphY?: number | null }[],
  personNodes: { id: string; entityId: number; label: string; graphX?: number | null; graphY?: number | null }[],
  edges: { source: string; target: string; relationshipType: string; isFamily: boolean }[]
): Node[] {
  const rfNodes: Node[] = [];
  const cx = 600;
  const cy = 400;

  caseNodes.forEach((c, i) => {
    const hasPos = c.graphX != null && c.graphY != null;
    const angle = (2 * Math.PI * i) / Math.max(caseNodes.length, 1) - Math.PI / 2;
    const radius = 280;
    rfNodes.push({
      id: c.id,
      type: "caseNode",
      position: {
        x: hasPos ? c.graphX! : cx + radius * Math.cos(angle),
        y: hasPos ? c.graphY! : cy + radius * Math.sin(angle),
      },
      data: { label: c.label, entityId: c.entityId, entityType: "case", isHovered: false },
    });
  });

  personNodes.forEach((p, i) => {
    const hasPos = p.graphX != null && p.graphY != null;
    const angle = (2 * Math.PI * i) / Math.max(personNodes.length, 1);
    const radius = 180;
    rfNodes.push({
      id: p.id,
      type: "personNode",
      position: {
        x: hasPos ? p.graphX! : cx + radius * Math.cos(angle),
        y: hasPos ? p.graphY! : cy + radius * Math.sin(angle),
      },
      data: { label: p.label, entityId: p.entityId, entityType: "person", isHovered: false },
    });
  });

  return rfNodes;
}

function computeFamilyLayout(
  people: Person[],
  relationships: Relationship[],
  centeredId?: number
): Node[] {
  const center = centeredId ? people.find(p => p.id === centeredId) || people[0] : people[0];
  if (!center) return [];

  const familyRels = relationships.filter(r =>
    (FAMILY_RELATIONSHIP_TYPES as readonly string[]).includes(r.relationshipType) &&
    r.fromType === "person" && r.toType === "person"
  );

  const parents: Person[] = [];
  const children: Person[] = [];
  const spouses: Person[] = [];
  const siblings: Person[] = [];
  const others: Person[] = [];

  for (const p of people) {
    if (p.id === center.id) continue;
    const rel = familyRels.find(
      r => (r.fromId === center.id && r.toId === p.id) || (r.toId === center.id && r.fromId === p.id)
    );
    if (!rel) { others.push(p); continue; }
    const type = rel.relationshipType;
    if (type === "parent_of" && rel.fromId === p.id) parents.push(p);
    else if (type === "parent_of" && rel.toId === p.id) children.push(p);
    else if (type === "child_of" && rel.fromId === p.id) children.push(p);
    else if (type === "child_of" && rel.toId === p.id) parents.push(p);
    else if (type === "spouse_of") spouses.push(p);
    else if (type === "sibling_of") siblings.push(p);
    else others.push(p);
  }

  const cx = 500;
  const cy = 400;
  const spacing = 140;
  const nodes: Node[] = [];

  nodes.push({
    id: `person-${center.id}`,
    type: "personNode",
    position: { x: cx, y: cy },
    data: { label: center.fullName, entityId: center.id, entityType: "person", isHovered: false },
  });

  parents.forEach((p, i) => {
    nodes.push({
      id: `person-${p.id}`,
      type: "personNode",
      position: { x: cx + (i - (parents.length - 1) / 2) * spacing, y: cy - spacing * 1.5 },
      data: { label: p.fullName, entityId: p.id, entityType: "person", isHovered: false },
    });
  });

  children.forEach((p, i) => {
    nodes.push({
      id: `person-${p.id}`,
      type: "personNode",
      position: { x: cx + (i - (children.length - 1) / 2) * spacing, y: cy + spacing * 1.5 },
      data: { label: p.fullName, entityId: p.id, entityType: "person", isHovered: false },
    });
  });

  spouses.forEach((p, i) => {
    nodes.push({
      id: `person-${p.id}`,
      type: "personNode",
      position: { x: cx + spacing * (i + 1), y: cy },
      data: { label: p.fullName, entityId: p.id, entityType: "person", isHovered: false },
    });
  });

  siblings.forEach((p, i) => {
    nodes.push({
      id: `person-${p.id}`,
      type: "personNode",
      position: { x: cx - spacing * (i + 1), y: cy },
      data: { label: p.fullName, entityId: p.id, entityType: "person", isHovered: false },
    });
  });

  others.forEach((p, i) => {
    const angle = (2 * Math.PI * i) / Math.max(others.length, 1);
    nodes.push({
      id: `person-${p.id}`,
      type: "personNode",
      position: { x: cx + Math.cos(angle) * spacing * 2.5, y: cy + Math.sin(angle) * spacing * 2.5 },
      data: { label: p.fullName, entityId: p.id, entityType: "person", isHovered: false },
    });
  });

  return nodes;
}

function GraphView({
  holes,
  people,
  relationships,
  showPeople,
  showFamilyEdges,
  viewMode,
  familyCenterId,
  onNodeClick,
}: {
  holes: RabbitHole[];
  people: Person[];
  relationships: Relationship[];
  showPeople: boolean;
  showFamilyEdges: boolean;
  viewMode: ViewMode;
  familyCenterId?: number;
  onNodeClick: (entityType: string, entityId: number, slug?: string) => void;
}) {
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (positions: { type: string; id: number; x: number; y: number }[]) => {
      const res = await fetch("/api/admin/graph-positions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ positions }),
      });
      return res.ok;
    },
  });

  const initialData = useMemo(() => {
    if (viewMode === "family") {
      const familyNodes = computeFamilyLayout(people, relationships, familyCenterId);
      const familyEdges: Edge[] = [];
      const nodeIdSet = new Set(familyNodes.map(n => n.id));

      relationships.forEach(r => {
        if (r.fromType !== "person" || r.toType !== "person") return;
        if (!(FAMILY_RELATIONSHIP_TYPES as readonly string[]).includes(r.relationshipType)) return;
        const fromId = `person-${r.fromId}`;
        const toId = `person-${r.toId}`;
        if (!nodeIdSet.has(fromId) || !nodeIdSet.has(toId)) return;

        familyEdges.push({
          id: `rel-${r.id}`,
          source: fromId,
          target: toId,
          type: "relationship",
          data: { relationshipType: r.relationshipType, isFamily: true, isHovered: false },
        });
      });

      return { nodes: familyNodes, edges: familyEdges };
    }

    const caseData = holes.map(h => ({
      id: `case-${h.id}`,
      entityId: h.id,
      label: h.title,
      graphX: (h as any).graphX as number | null | undefined,
      graphY: (h as any).graphY as number | null | undefined,
    }));

    const personData = people.map(p => ({
      id: `person-${p.id}`,
      entityId: p.id,
      label: p.fullName,
      graphX: p.graphX,
      graphY: p.graphY,
    }));

    const allEdgesRaw: { source: string; target: string; relationshipType: string; isFamily: boolean }[] = [];
    const slugToId: Record<string, string> = {};
    holes.forEach(h => { slugToId[h.slug] = `case-${h.id}`; });

    holes.forEach(h => {
      const connected = (h.connectedSlugs as string[]) || [];
      connected.forEach(cs => {
        const sourceId = `case-${h.id}`;
        const targetId = slugToId[cs];
        if (targetId && !allEdgesRaw.find(e =>
          (e.source === sourceId && e.target === targetId) ||
          (e.source === targetId && e.target === sourceId)
        )) {
          allEdgesRaw.push({ source: sourceId, target: targetId, relationshipType: "connected", isFamily: false });
        }
      });
    });

    relationships.forEach(r => {
      const fromId = r.fromType === "person" ? `person-${r.fromId}` : `case-${r.fromId}`;
      const toId = r.toType === "person" ? `person-${r.toId}` : `case-${r.toId}`;
      const isFamily = (FAMILY_RELATIONSHIP_TYPES as readonly string[]).includes(r.relationshipType);
      if (!allEdgesRaw.find(e =>
        (e.source === fromId && e.target === toId) ||
        (e.source === toId && e.target === fromId)
      )) {
        allEdgesRaw.push({ source: fromId, target: toId, relationshipType: r.relationshipType, isFamily });
      }
    });

    const initialNodes = computeInitialLayout(caseData, showPeople ? personData : [], allEdgesRaw);
    const nodeIdSet = new Set(initialNodes.map(n => n.id));

    const initialEdges: Edge[] = allEdgesRaw
      .filter(e => {
        if (!nodeIdSet.has(e.source) || !nodeIdSet.has(e.target)) return false;
        if (!showFamilyEdges && e.isFamily) return false;
        return true;
      })
      .map((e, i) => ({
        id: `edge-${i}`,
        source: e.source,
        target: e.target,
        type: "relationship",
        data: { relationshipType: e.relationshipType, isFamily: e.isFamily, isHovered: false },
      }));

    return { nodes: initialNodes, edges: initialEdges };
  }, [holes, people, relationships, showPeople, showFamilyEdges, viewMode, familyCenterId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);
  const prevKeyRef = useRef("");

  useEffect(() => {
    const key = JSON.stringify({ hLen: holes.length, pLen: people.length, rLen: relationships.length, showPeople, showFamilyEdges, viewMode, familyCenterId });
    if (key !== prevKeyRef.current) {
      prevKeyRef.current = key;
      setNodes(initialData.nodes);
      setEdges(initialData.edges);
    }
  }, [initialData, setNodes, setEdges]);

  const draggedNodeIds = useRef<Set<string>>(new Set());

  const handleNodesChange: OnNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);

    for (const c of changes) {
      if (c.type === "position" && (c as any).dragging === true) {
        draggedNodeIds.current.add(c.id);
      }
    }

    const dragEnded = changes.some(
      c => c.type === "position" && (c as any).dragging === false
    );

    if (dragEnded && draggedNodeIds.current.size > 0 && viewMode === "graph") {
      const movedIds = new Set(draggedNodeIds.current);
      draggedNodeIds.current.clear();

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setNodes(currentNodes => {
          const positions = currentNodes
            .filter(n => movedIds.has(n.id))
            .map(n => ({
              type: n.type === "caseNode" ? "case" : "person",
              id: n.data.entityId as number,
              x: n.position.x,
              y: n.position.y,
            }));
          if (positions.length > 0) saveMutation.mutate(positions);
          return currentNodes;
        });
      }, 500);
    }
  }, [onNodesChange, viewMode, saveMutation, setNodes]);

  const onEdgeMouseEnter = useCallback((_: React.MouseEvent, edge: Edge) => {
    setHoveredEdge(edge.id);
    setEdges(eds => eds.map(e =>
      e.id === edge.id ? { ...e, data: { ...e.data, isHovered: true } } : e
    ));
  }, [setEdges]);

  const onEdgeMouseLeave = useCallback(() => {
    setHoveredEdge(null);
    setEdges(eds => eds.map(e => ({ ...e, data: { ...e.data, isHovered: false } })));
  }, [setEdges]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const entityType = node.data.entityType as string;
    const entityId = node.data.entityId as number;
    onNodeClick(entityType, entityId);
  }, [onNodeClick]);

  return (
    <div style={{ width: "100%", height: "100%" }} data-testid="reactflow-graph">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onEdgeMouseEnter={onEdgeMouseEnter}
        onEdgeMouseLeave={onEdgeMouseLeave}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.2}
        maxZoom={2.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
        nodesDraggable={viewMode === "graph"}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        proOptions={{ hideAttribution: true }}
        style={{ background: "transparent" }}
      >
        <Background color="rgba(255,255,255,0.03)" gap={60} />
        <MiniMap
          nodeColor={(node) => node.type === "caseNode" ? "rgba(255,255,255,0.4)" : "#3b82f6"}
          maskColor="rgba(17,20,24,0.85)"
          style={{ background: "#161a1e", border: "1px solid rgba(255,255,255,0.1)" }}
          pannable
          zoomable
        />
        <Controls
          showInteractive={false}
          style={{
            background: "#161a1e",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 0,
          }}
        />
      </ReactFlow>
    </div>
  );
}

export default function Connections() {
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const [showPeople, setShowPeople] = useState(true);
  const [showFamilyEdges, setShowFamilyEdges] = useState(true);
  const [familyCenterId, setFamilyCenterId] = useState<number | undefined>();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [, navigate] = useLocation();

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
    try { localStorage.setItem("connections-view-mode", mode); } catch {}
  }, []);

  const handleNodeClick = useCallback((entityType: string, entityId: number) => {
    if (viewMode === "family" && entityType === "person") {
      setFamilyCenterId(entityId);
      return;
    }
    if (entityType === "case") {
      const hole = holes.find(h => h.id === entityId);
      if (hole) navigate(`/rabbithole/${hole.slug}`);
    } else if (entityType === "person") {
      const person = people.find(p => p.id === entityId);
      navigate(`/people/${person?.handle || entityId}`);
    }
  }, [viewMode, holes, people, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      data-testid="page-connections"
      style={{
        background: "linear-gradient(145deg, #131619 0%, #0f1114 100%)",
      }}
    >
      <div className="border-b border-white/10 px-5 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Network className="w-5 h-5 text-muted-foreground" />
          <h1 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-white/90" data-testid="heading-situation-room">
            Research Network
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {viewMode === "graph" && (
            <>
              <button
                data-testid="toggle-show-people"
                onClick={() => setShowPeople(p => !p)}
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
                onClick={() => setShowFamilyEdges(f => !f)}
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
          <div style={{ width: "100%", height: "calc(100vh - 60px)" }}>
            <ReactFlowProvider>
              <GraphView
                holes={holes}
                people={people}
                relationships={relationships}
                showPeople={showPeople}
                showFamilyEdges={showFamilyEdges}
                viewMode={viewMode}
                familyCenterId={familyCenterId}
                onNodeClick={handleNodeClick}
              />
            </ReactFlowProvider>
          </div>

          {viewMode === "family" && (
            <div className="absolute top-4 left-4 px-3 py-2 border border-white/10 bg-card/80 backdrop-blur-sm z-10">
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
                      className="rounded-sm border border-white/10 transition-all duration-300"
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
        .react-flow__node {
          cursor: pointer !important;
        }
        .react-flow__controls button {
          background: #161a1e !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: rgba(255,255,255,0.5) !important;
          border-radius: 0 !important;
        }
        .react-flow__controls button:hover {
          background: #1e2228 !important;
          color: rgba(255,255,255,0.8) !important;
        }
        .react-flow__controls button svg {
          fill: currentColor !important;
        }
        .react-flow__minimap {
          border-radius: 0 !important;
        }
      `}</style>
    </div>
  );
}
