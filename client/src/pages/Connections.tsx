import { useState, useCallback, useMemo, memo, useEffect, useRef, lazy, Suspense } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Network, Loader2, ExternalLink, ChevronDown, Users, GitFork, Eye, EyeOff, X, Focus, MapPin } from "lucide-react";
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
  ReactFlowProvider,
  useViewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { MapItem, MapBounds } from "@/components/IntelMap";

const IntelMap = lazy(() => import("@/components/IntelMap"));

type ViewMode = "graph" | "family" | "timeline" | "map";

const ZOOM_LABEL_THRESHOLD = 0.5;
const ZOOM_DETAIL_THRESHOLD = 0.9;

function getInitialViewMode(): ViewMode {
  try {
    const stored = localStorage.getItem("connections-view-mode");
    if (stored === "graph" || stored === "family" || stored === "timeline") return stored;
  } catch {}
  return "graph";
}

function labelColor(label: string) {
  switch (label) {
    case "Verified": return "#4FC87A";
    case "Disputed": return "#E8923A";
    case "Speculative": return "#E85A5A";
    default: return "#6B6B8A";
  }
}

const CaseNode = memo(({ data, selected }: NodeProps) => {
  const isHovered = data.isHovered as boolean;
  const focusState = data.focusState as string | undefined;
  const hideLabel = data.hideLabel as boolean | undefined;
  const highlight = selected || isHovered;
  const isFaded = focusState === "faded";
  const isFocused = focusState === "focused";
  const size = highlight ? 52 : 44;
  const half = size / 2;

  const opacity = isFaded ? 0.15 : 1;
  const strokeColor = isFocused
    ? "rgba(255,255,255,0.6)"
    : highlight
      ? "rgba(255,255,255,0.5)"
      : "rgba(255,255,255,0.25)";
  const strokeW = isFocused || highlight ? 2 : 1;

  return (
    <div
      data-testid={`node-case-${data.entityId}`}
      style={{ width: size, height: size, position: "relative", cursor: "pointer", opacity, transition: "opacity 0.3s ease" }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none" }} />

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", top: 0, left: 0 }}>
        <polygon
          points={`${half},2 ${size - 2},${half} ${half},${size - 2} 2,${half}`}
          fill="#0F0F18"
          stroke={strokeColor}
          strokeWidth={strokeW}
        />
      </svg>

      {!hideLabel && (
        <div
          style={{
            position: "absolute",
            bottom: -18,
            left: "50%",
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px",
            color: isFocused ? "#f0f0f0" : highlight ? "#e0e0e0" : "rgba(255,255,255,0.6)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            textAlign: "center",
            pointerEvents: "none",
            opacity: isFaded ? 0.3 : 1,
            transition: "opacity 0.3s ease",
          }}
        >
          {(data.label as string).length > 16 ? (data.label as string).slice(0, 14) + ".." : data.label as string}
        </div>
      )}
    </div>
  );
});
CaseNode.displayName = "CaseNode";

const PersonNode = memo(({ data, selected }: NodeProps) => {
  const isHovered = data.isHovered as boolean;
  const focusState = data.focusState as string | undefined;
  const hideLabel = data.hideLabel as boolean | undefined;
  const highlight = selected || isHovered;
  const isFaded = focusState === "faded";
  const isFocused = focusState === "focused";
  const size = highlight ? 32 : 28;

  const opacity = isFaded ? 0.15 : 1;
  const borderColor = isFocused
    ? "#7BB8F0"
    : highlight
      ? "#5BA3E8"
      : "rgba(91,163,232,0.4)";

  return (
    <div
      data-testid={`node-person-${data.entityId}`}
      style={{ width: size, height: size, position: "relative", cursor: "pointer", opacity, transition: "opacity 0.3s ease" }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none" }} />

      {(highlight || isFocused) && (
        <div
          style={{
            position: "absolute",
            inset: -8,
            background: isFocused
              ? "radial-gradient(circle, rgba(91,163,232,0.25) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(91,163,232,0.35) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
      )}

      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "#0F0F18",
          border: `${highlight || isFocused ? 2 : 1}px solid ${borderColor}`,
          boxSizing: "border-box",
        }}
      />

      {!hideLabel && (
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
            color: isFocused ? "#e0e0e0" : highlight ? "#e0e0e0" : "rgba(255,255,255,0.5)",
            textTransform: "uppercase",
            letterSpacing: "0.03em",
            textAlign: "center",
            pointerEvents: "none",
            opacity: isFaded ? 0.3 : 1,
            transition: "opacity 0.3s ease",
          }}
        >
          {(data.label as string).length > 12 ? (data.label as string).slice(0, 10) + ".." : data.label as string}
        </div>
      )}
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
  const focusState = data?.focusState as string | undefined;
  const showDetail = data?.showDetail as boolean | undefined;
  const isFaded = focusState === "faded";
  const isFocused = focusState === "focused";

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
  });

  const baseOpacity = isFaded ? 0.05 : 1;
  const strokeVal = isFocused
    ? "rgba(255,255,255,0.4)"
    : isHovered
      ? "rgba(255,255,255,0.55)"
      : "rgba(255,255,255,0.18)";
  const sw = isHovered ? 2 : isFocused ? 1.5 : (isFamily ? 0.8 : 1);

  return (
    <>
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeVal}
        strokeWidth={sw}
        strokeDasharray={isFamily ? "5,5" : undefined}
        style={{ ...style, opacity: baseOpacity, transition: "opacity 0.3s ease" }}
      />
      {isFocused && (
        <path
          d={edgePath}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={sw + 2}
          strokeDasharray={isFamily ? "5,5" : undefined}
          style={{ opacity: baseOpacity }}
          className="focus-edge-pulse"
        />
      )}
      {(isHovered || (isFocused && showDetail)) && data?.relationshipType && (
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
                backgroundColor: "rgba(8,8,13,0.95)",
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
      data: { label: c.label, entityId: c.entityId, entityType: "case", isHovered: false, focusState: undefined, hideLabel: false },
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
      data: { label: p.label, entityId: p.entityId, entityType: "person", isHovered: false, focusState: undefined, hideLabel: false },
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

  const mkData = (label: string, entityId: number) => ({
    label, entityId, entityType: "person", isHovered: false, focusState: undefined, hideLabel: false,
  });

  nodes.push({
    id: `person-${center.id}`, type: "personNode",
    position: { x: cx, y: cy },
    data: mkData(center.fullName, center.id),
  });

  parents.forEach((p, i) => {
    nodes.push({
      id: `person-${p.id}`, type: "personNode",
      position: { x: cx + (i - (parents.length - 1) / 2) * spacing, y: cy - spacing * 1.5 },
      data: mkData(p.fullName, p.id),
    });
  });

  children.forEach((p, i) => {
    nodes.push({
      id: `person-${p.id}`, type: "personNode",
      position: { x: cx + (i - (children.length - 1) / 2) * spacing, y: cy + spacing * 1.5 },
      data: mkData(p.fullName, p.id),
    });
  });

  spouses.forEach((p, i) => {
    nodes.push({
      id: `person-${p.id}`, type: "personNode",
      position: { x: cx + spacing * (i + 1), y: cy },
      data: mkData(p.fullName, p.id),
    });
  });

  siblings.forEach((p, i) => {
    nodes.push({
      id: `person-${p.id}`, type: "personNode",
      position: { x: cx - spacing * (i + 1), y: cy },
      data: mkData(p.fullName, p.id),
    });
  });

  others.forEach((p, i) => {
    const angle = (2 * Math.PI * i) / Math.max(others.length, 1);
    nodes.push({
      id: `person-${p.id}`, type: "personNode",
      position: { x: cx + Math.cos(angle) * spacing * 2.5, y: cy + Math.sin(angle) * spacing * 2.5 },
      data: mkData(p.fullName, p.id),
    });
  });

  return nodes;
}

function ZoomWatcher({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const { zoom } = useViewport();
  const prevRef = useRef(zoom);
  useEffect(() => {
    const prevHideLabel = prevRef.current < ZOOM_LABEL_THRESHOLD;
    const curHideLabel = zoom < ZOOM_LABEL_THRESHOLD;
    const prevShowDetail = prevRef.current >= ZOOM_DETAIL_THRESHOLD;
    const curShowDetail = zoom >= ZOOM_DETAIL_THRESHOLD;
    if (prevHideLabel !== curHideLabel || prevShowDetail !== curShowDetail) {
      onZoomChange(zoom);
    }
    prevRef.current = zoom;
  }, [zoom, onZoomChange]);
  return null;
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
  focusedNodeId,
  onFocusNode,
}: {
  holes: RabbitHole[];
  people: Person[];
  relationships: Relationship[];
  showPeople: boolean;
  showFamilyEdges: boolean;
  viewMode: ViewMode;
  familyCenterId?: number;
  onNodeClick: (entityType: string, entityId: number, slug?: string) => void;
  focusedNodeId: string | null;
  onFocusNode: (nodeId: string | null) => void;
}) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zoomRef = useRef(0.8);

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
          data: { relationshipType: r.relationshipType, isFamily: true, isHovered: false, focusState: undefined, showDetail: false },
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
        data: { relationshipType: e.relationshipType, isFamily: e.isFamily, isHovered: false, focusState: undefined, showDetail: false },
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

  const neighborMapRef = useRef<Map<string, Set<string>>>(new Map());
  useEffect(() => {
    const map = new Map<string, Set<string>>();
    edges.forEach(e => {
      if (!map.has(e.source)) map.set(e.source, new Set());
      if (!map.has(e.target)) map.set(e.target, new Set());
      map.get(e.source)!.add(e.target);
      map.get(e.target)!.add(e.source);
    });
    neighborMapRef.current = map;
  }, [edges]);

  useEffect(() => {
    const hideLabel = zoomRef.current < ZOOM_LABEL_THRESHOLD;
    const showDetail = zoomRef.current >= ZOOM_DETAIL_THRESHOLD;

    if (focusedNodeId) {
      const neighbors = neighborMapRef.current.get(focusedNodeId) || new Set();
      setNodes(ns => ns.map(n => ({
        ...n,
        data: {
          ...n.data,
          focusState: n.id === focusedNodeId ? "focused" : neighbors.has(n.id) ? "focused" : "faded",
          hideLabel: hideLabel && n.id !== focusedNodeId && !neighbors.has(n.id),
        },
      })));
      setEdges(es => es.map(e => ({
        ...e,
        data: {
          ...e.data,
          focusState: (e.source === focusedNodeId || e.target === focusedNodeId) ? "focused" : "faded",
          showDetail: showDetail && (e.source === focusedNodeId || e.target === focusedNodeId),
        },
      })));
    } else {
      setNodes(ns => ns.map(n => ({
        ...n,
        data: { ...n.data, focusState: undefined, hideLabel },
      })));
      setEdges(es => es.map(e => ({
        ...e,
        data: { ...e.data, focusState: undefined, showDetail: false },
      })));
    }
  }, [focusedNodeId, setNodes, setEdges]);

  const handleZoomChange = useCallback((zoom: number) => {
    zoomRef.current = zoom;
    const hideLabel = zoom < ZOOM_LABEL_THRESHOLD;
    const showDetail = zoom >= ZOOM_DETAIL_THRESHOLD;

    if (focusedNodeId) {
      const neighbors = neighborMapRef.current.get(focusedNodeId) || new Set();
      setNodes(ns => ns.map(n => ({
        ...n,
        data: {
          ...n.data,
          hideLabel: hideLabel && n.id !== focusedNodeId && !neighbors.has(n.id),
        },
      })));
      setEdges(es => es.map(e => ({
        ...e,
        data: {
          ...e.data,
          showDetail: showDetail && (e.source === focusedNodeId || e.target === focusedNodeId),
        },
      })));
    } else {
      setNodes(ns => ns.map(n => ({
        ...n,
        data: { ...n.data, hideLabel },
      })));
    }
  }, [focusedNodeId, setNodes, setEdges]);

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
    setEdges(eds => eds.map(e =>
      e.id === edge.id ? { ...e, data: { ...e.data, isHovered: true } } : e
    ));
  }, [setEdges]);

  const onEdgeMouseLeave = useCallback(() => {
    setEdges(eds => eds.map(e => ({ ...e, data: { ...e.data, isHovered: false } })));
  }, [setEdges]);

  const isDraggingRef = useRef(false);

  const handleNodeDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleNodeDragStop = useCallback(() => {
    setTimeout(() => { isDraggingRef.current = false; }, 50);
  }, []);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (isDraggingRef.current) return;

    if (viewMode === "family" && (node.data.entityType as string) === "person") {
      onNodeClick("person", node.data.entityId as number);
      return;
    }

    if (focusedNodeId === node.id) {
      onFocusNode(null);
    } else {
      onFocusNode(node.id);
    }
  }, [focusedNodeId, onFocusNode, onNodeClick, viewMode]);

  const handleNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    const entityType = node.data.entityType as string;
    const entityId = node.data.entityId as number;
    onNodeClick(entityType, entityId);
  }, [onNodeClick]);

  const handlePaneClick = useCallback(() => {
    if (focusedNodeId) {
      onFocusNode(null);
    }
  }, [focusedNodeId, onFocusNode]);

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
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        onPaneClick={handlePaneClick}
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
          nodeColor={(node) => {
            if (node.data.focusState === "faded") return "rgba(255,255,255,0.08)";
            return node.type === "caseNode" ? "rgba(255,255,255,0.4)" : "#3b82f6";
          }}
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
        <ZoomWatcher onZoomChange={handleZoomChange} />
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
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [mapFilters, setMapFilters] = useState<{ types: ("investigation" | "person" | "timeline")[]; tag?: string }>({
    types: ["investigation", "person", "timeline"],
  });
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

  const mapQueryParams = mapBounds
    ? `?minLat=${mapBounds.minLat}&maxLat=${mapBounds.maxLat}&minLng=${mapBounds.minLng}&maxLng=${mapBounds.maxLng}${mapFilters.types.length < 3 ? `&type=${mapFilters.types[0] || ""}` : ""}${mapFilters.tag ? `&tag=${mapFilters.tag}` : ""}`
    : "";
  const { data: mapItems = [] } = useQuery<MapItem[]>({
    queryKey: ["/api/map/items", mapQueryParams],
    queryFn: async () => {
      if (!mapBounds) return [];
      const res = await fetch(`/api/map/items${mapQueryParams}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: viewMode === "map" && !!mapBounds,
    refetchOnWindowFocus: false,
  });

  const isLoading = holesLoading || peopleLoading || relsLoading;

  const handleViewChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    setFocusedNodeId(null);
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

  const focusedLabel = useMemo(() => {
    if (!focusedNodeId) return null;
    if (focusedNodeId.startsWith("case-")) {
      const id = parseInt(focusedNodeId.replace("case-", ""));
      const hole = holes.find(h => h.id === id);
      return hole?.title || focusedNodeId;
    }
    if (focusedNodeId.startsWith("person-")) {
      const id = parseInt(focusedNodeId.replace("person-", ""));
      const person = people.find(p => p.id === id);
      return person?.fullName || focusedNodeId;
    }
    return focusedNodeId;
  }, [focusedNodeId, holes, people]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && focusedNodeId) {
        setFocusedNodeId(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [focusedNodeId]);

  const handleMapItemClick = useCallback((item: MapItem) => {
    if (item.type === "investigation" && item.slug) {
      navigate(`/rabbithole/${item.slug}`);
    } else if (item.type === "person") {
      navigate(`/people/${item.handle || item.id}`);
    } else if (item.type === "timeline" && item.slug) {
      navigate(`/rabbithole/${item.slug}`);
    }
  }, [navigate]);

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
        background: "#0f1115",
      }}
    >
      <div className="border-b border-white/5 px-5 py-2.5 flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-3">
          <Network className="w-4 h-4 text-muted-foreground/60" />
          <h1 className="font-mono text-sm font-semibold text-white/80" data-testid="heading-situation-room">
            Research Network
          </h1>

          {focusedNodeId && (
            <div className="flex items-center gap-2 ml-2" data-testid="focus-indicator">
              <div className="w-px h-4 bg-white/10" />
              <Focus className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-blue-400" data-testid="text-focused-label">
                Focused: {focusedLabel && focusedLabel.length > 24 ? focusedLabel.slice(0, 22) + ".." : focusedLabel}
              </span>
              <button
                onClick={() => setFocusedNodeId(null)}
                className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase rounded-md bg-white/5 text-white/40 hover:text-white/80 hover:bg-white/8 transition-all"
                data-testid="button-clear-focus"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {viewMode === "graph" && (
            <>
              <button
                data-testid="toggle-show-people"
                onClick={() => setShowPeople(p => !p)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase rounded-lg transition-all"
                style={{
                  backgroundColor: showPeople ? "#3b82f614" : "rgba(255,255,255,0.04)",
                  color: showPeople ? "#60a5fa" : "rgba(255,255,255,0.35)",
                }}
              >
                {showPeople ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                People
              </button>

              <button
                data-testid="toggle-family-edges"
                onClick={() => setShowFamilyEdges(f => !f)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase rounded-lg transition-all"
                style={{
                  backgroundColor: showFamilyEdges ? "#4ade8010" : "rgba(255,255,255,0.04)",
                  color: showFamilyEdges ? "#4ade80" : "rgba(255,255,255,0.35)",
                }}
              >
                <GitFork className="w-3 h-3" />
                Family
              </button>
            </>
          )}
        </div>

        <div className="flex gap-0.5 bg-white/4 rounded-lg p-0.5">
          <button
            data-testid="toggle-graph"
            onClick={() => handleViewChange("graph")}
            className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all"
            style={{
              backgroundColor: viewMode === "graph" ? "rgba(255,255,255,0.1)" : "transparent",
              color: viewMode === "graph" ? "#e8e8e8" : "rgba(255,255,255,0.35)",
            }}
          >
            Graph
          </button>
          <button
            data-testid="toggle-family"
            onClick={() => handleViewChange("family")}
            className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all"
            style={{
              backgroundColor: viewMode === "family" ? "rgba(255,255,255,0.1)" : "transparent",
              color: viewMode === "family" ? "#e8e8e8" : "rgba(255,255,255,0.35)",
            }}
          >
            <Users className="w-3 h-3" /> Family
          </button>
          <button
            data-testid="toggle-timeline"
            onClick={() => handleViewChange("timeline")}
            className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all"
            style={{
              backgroundColor: viewMode === "timeline" ? "rgba(255,255,255,0.1)" : "transparent",
              color: viewMode === "timeline" ? "#e8e8e8" : "rgba(255,255,255,0.35)",
            }}
          >
            Timeline
          </button>
          <button
            data-testid="toggle-map"
            onClick={() => handleViewChange("map")}
            className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all"
            style={{
              backgroundColor: viewMode === "map" ? "rgba(255,255,255,0.1)" : "transparent",
              color: viewMode === "map" ? "#e8e8e8" : "rgba(255,255,255,0.35)",
            }}
          >
            <MapPin className="w-3 h-3" /> Map
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
                focusedNodeId={focusedNodeId}
                onFocusNode={setFocusedNodeId}
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

          {viewMode === "graph" && !focusedNodeId && (
            <div className="absolute bottom-4 left-4 px-3 py-2 border border-white/10 bg-card/80 backdrop-blur-sm z-10">
              <p className="font-mono text-[10px] uppercase tracking-wider text-white/30" data-testid="text-focus-hint">
                Click node to focus · Double-click to open · ESC to clear
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
                  <div key={hole.id} className="relative pl-10 mb-5" data-testid={`timeline-entry-${hole.id}`}>
                    <div
                      className="absolute left-[13px] top-5 w-2.5 h-2.5 rotate-45"
                      style={{
                        backgroundColor: glow + "35",
                        border: `1px solid ${glow}55`,
                      }}
                    />

                    <div
                      className="rounded-xl transition-all duration-300"
                      style={{ backgroundColor: "rgba(22,25,30,0.85)" }}
                    >
                      <button
                        className="w-full text-left p-4 flex items-center justify-between"
                        onClick={() => setExpandedCard(isExpanded ? null : String(hole.id))}
                        data-testid={`timeline-toggle-${hole.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-sm font-semibold text-white/85 truncate">
                            {hole.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 font-mono text-[10px] text-white/30">
                            <span>{dateStr}</span>
                            <span className="text-white/10">·</span>
                            <span>{hole.sourceCount || 0} sources</span>
                            <span className="text-white/10">·</span>
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
                          <div className="flex flex-wrap gap-1.5 mt-3 mb-3">
                            {((hole.labels as string[]) || []).map(l => (
                              <span
                                key={l}
                                className="text-[9px] font-mono px-2 py-0.5 uppercase tracking-wider rounded-md"
                                style={{
                                  color: labelColor(l),
                                  backgroundColor: labelColor(l) + "12",
                                }}
                              >
                                {l}
                              </span>
                            ))}
                          </div>

                          <div className="flex gap-5 mb-4 font-mono text-[9px] text-white/30">
                            <div>
                              <span className="uppercase tracking-widest">Connections</span>
                              <p className="text-white/55 text-xs mt-0.5">{hole.connections || 0}</p>
                            </div>
                            <div>
                              <span className="uppercase tracking-widest">Completion</span>
                              <p className="text-white/55 text-xs mt-0.5">{hole.completion}%</p>
                            </div>
                          </div>

                          <Link
                            href={`/rabbithole/${hole.slug}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-lg bg-white/6 text-white/50 hover:text-white/80 hover:bg-white/10 transition-all"
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

        <div
          style={{
            opacity: viewMode === "map" ? 1 : 0,
            pointerEvents: viewMode === "map" ? "auto" : "none",
            position: "absolute",
            inset: 0,
            transition: "opacity 0.4s ease",
          }}
          data-testid="map-view-container"
        >
          {viewMode === "map" && (
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            }>
              <IntelMap
                items={mapItems}
                onItemClick={handleMapItemClick}
                onBoundsChange={setMapBounds}
                filters={mapFilters}
                onFiltersChange={setMapFilters}
              />
            </Suspense>
          )}
        </div>
      </div>

      <style>{`
        .react-flow__node {
          cursor: pointer !important;
        }
        .react-flow__controls {
          border-radius: 10px !important;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4) !important;
        }
        .react-flow__controls button {
          background: #1a1e24 !important;
          border: none !important;
          border-bottom: 1px solid rgba(255,255,255,0.06) !important;
          color: rgba(255,255,255,0.45) !important;
        }
        .react-flow__controls button:last-child {
          border-bottom: none !important;
        }
        .react-flow__controls button:hover {
          background: #22272f !important;
          color: rgba(255,255,255,0.85) !important;
        }
        .react-flow__controls button svg {
          fill: currentColor !important;
        }
        .react-flow__minimap {
          border-radius: 10px !important;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4) !important;
        }
        @keyframes focus-pulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.35; }
        }
        .focus-edge-pulse {
          animation: focus-pulse 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
