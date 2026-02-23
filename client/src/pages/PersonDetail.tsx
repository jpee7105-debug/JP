import { useState, useCallback, useMemo, memo } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, User, Calendar, Tag, GitBranch, Users, ArrowLeft, MapPin, Maximize, LocateFixed, ChevronDown, Shield } from "lucide-react";
import type { Person, Relationship, RabbitHole } from "@shared/schema";
import { FAMILY_RELATIONSHIP_TYPES } from "@shared/schema";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

function formatRelType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

const FamilyNode = memo(({ data, selected }: NodeProps) => {
  const isCurrent = data.isCurrent as boolean;
  const size = isCurrent ? 40 : 30;
  const highlight = selected || isCurrent;

  return (
    <div
      data-testid={`tree-node-${data.personId}`}
      style={{ width: size, height: size, position: "relative", cursor: "pointer" }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none" }} />

      {data.avatarUrl ? (
        <img
          src={data.avatarUrl as string}
          alt=""
          style={{
            width: size, height: size, borderRadius: "50%",
            border: `${highlight ? 2 : 1}px solid ${isCurrent ? "hsl(0 72% 30%)" : highlight ? "#3b82f6" : "rgba(255,255,255,0.2)"}`,
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            width: size, height: size, borderRadius: "50%",
            background: isCurrent ? "rgba(139,0,0,0.15)" : "#161a1e",
            border: `${highlight ? 2 : 1}px solid ${isCurrent ? "hsl(0 72% 30%)" : highlight ? "#3b82f6" : "rgba(255,255,255,0.2)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <User style={{ width: size * 0.45, height: size * 0.45, color: isCurrent ? "hsl(0 72% 30%)" : "rgba(255,255,255,0.3)" }} />
        </div>
      )}

      <div
        style={{
          position: "absolute", bottom: -18, left: "50%", transform: "translateX(-50%)",
          whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace",
          fontSize: isCurrent ? "9px" : "8px", textAlign: "center", pointerEvents: "none",
          color: isCurrent ? "#e0e0e0" : "rgba(255,255,255,0.5)",
          textTransform: "uppercase", letterSpacing: "0.03em",
          fontWeight: isCurrent ? 700 : 400,
        }}
      >
        {(data.label as string).length > 14 ? (data.label as string).slice(0, 12) + ".." : data.label as string}
      </div>

      {data.relLabel ? (
        <div
          style={{
            position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
            whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace",
            fontSize: "7px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase",
            pointerEvents: "none",
          }}
        >
          {String(data.relLabel)}
        </div>
      ) : null}
    </div>
  );
});
FamilyNode.displayName = "FamilyNode";

const FamilyEdge = memo(({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style }: EdgeProps) => {
  const [edgePath] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  return (
    <path id={id} d={edgePath} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="5,5" style={style} />
  );
});
FamilyEdge.displayName = "FamilyEdge";

const nodeTypes = { familyNode: FamilyNode };
const edgeTypes = { familyEdge: FamilyEdge };

function buildTreeLayout(
  people: Person[],
  relationships: Relationship[],
  centerId: number
): { nodes: Node[]; edges: Edge[] } {
  const center = people.find(p => p.id === centerId);
  if (!center) return { nodes: [], edges: [] };

  const familyTypes = new Set(FAMILY_RELATIONSHIP_TYPES as readonly string[]);
  const familyRels = relationships.filter(r =>
    familyTypes.has(r.relationshipType) && r.fromType === "person" && r.toType === "person"
  );

  const peopleMap = new Map(people.map(p => [p.id, p]));
  const cx = 400;
  const cy = 300;
  const hSpacing = 120;
  const vSpacing = 160;

  const parents: { person: Person; relType: string }[] = [];
  const children: { person: Person; relType: string }[] = [];
  const spouses: { person: Person; relType: string }[] = [];
  const siblings: { person: Person; relType: string }[] = [];

  for (const rel of familyRels) {
    const otherId = rel.fromId === centerId ? rel.toId : rel.fromId;
    const other = peopleMap.get(otherId);
    if (!other || other.id === centerId) continue;

    const type = rel.relationshipType;
    if (type === "parent_of" && rel.fromId === otherId) parents.push({ person: other, relType: "parent" });
    else if (type === "parent_of" && rel.toId === otherId) children.push({ person: other, relType: "child" });
    else if (type === "child_of" && rel.fromId === otherId) children.push({ person: other, relType: "child" });
    else if (type === "child_of" && rel.toId === otherId) parents.push({ person: other, relType: "parent" });
    else if (type === "spouse_of") spouses.push({ person: other, relType: "spouse" });
    else if (type === "sibling_of") siblings.push({ person: other, relType: "sibling" });
  }

  const placed = new Set<number>([centerId]);
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  nodes.push({
    id: `p-${center.id}`, type: "familyNode",
    position: { x: cx, y: cy },
    data: { label: center.fullName, personId: center.id, isCurrent: true, avatarUrl: center.avatarUrl, handle: center.handle },
  });

  parents.forEach((item, i) => {
    if (placed.has(item.person.id)) return;
    placed.add(item.person.id);
    const x = cx + (i - (parents.length - 1) / 2) * hSpacing;
    nodes.push({
      id: `p-${item.person.id}`, type: "familyNode",
      position: { x, y: cy - vSpacing },
      data: { label: item.person.fullName, personId: item.person.id, isCurrent: false, avatarUrl: item.person.avatarUrl, handle: item.person.handle, relLabel: "parent" },
    });
    edges.push({ id: `e-${item.person.id}-${centerId}`, source: `p-${item.person.id}`, target: `p-${centerId}`, type: "familyEdge" });
  });

  spouses.forEach((item, i) => {
    if (placed.has(item.person.id)) return;
    placed.add(item.person.id);
    nodes.push({
      id: `p-${item.person.id}`, type: "familyNode",
      position: { x: cx + hSpacing * (i + 1), y: cy },
      data: { label: item.person.fullName, personId: item.person.id, isCurrent: false, avatarUrl: item.person.avatarUrl, handle: item.person.handle, relLabel: "spouse" },
    });
    edges.push({ id: `e-${centerId}-${item.person.id}`, source: `p-${centerId}`, target: `p-${item.person.id}`, type: "familyEdge" });
  });

  siblings.forEach((item, i) => {
    if (placed.has(item.person.id)) return;
    placed.add(item.person.id);
    nodes.push({
      id: `p-${item.person.id}`, type: "familyNode",
      position: { x: cx - hSpacing * (i + 1), y: cy },
      data: { label: item.person.fullName, personId: item.person.id, isCurrent: false, avatarUrl: item.person.avatarUrl, handle: item.person.handle, relLabel: "sibling" },
    });
    edges.push({ id: `e-${centerId}-${item.person.id}`, source: `p-${centerId}`, target: `p-${item.person.id}`, type: "familyEdge" });
  });

  children.forEach((item, i) => {
    if (placed.has(item.person.id)) return;
    placed.add(item.person.id);
    const x = cx + (i - (children.length - 1) / 2) * hSpacing;
    nodes.push({
      id: `p-${item.person.id}`, type: "familyNode",
      position: { x, y: cy + vSpacing },
      data: { label: item.person.fullName, personId: item.person.id, isCurrent: false, avatarUrl: item.person.avatarUrl, handle: item.person.handle, relLabel: "child" },
    });
    edges.push({ id: `e-${centerId}-${item.person.id}`, source: `p-${centerId}`, target: `p-${item.person.id}`, type: "familyEdge" });
  });

  for (const p of people) {
    if (placed.has(p.id)) continue;
    placed.add(p.id);
    const angle = (2 * Math.PI * (nodes.length - 1)) / Math.max(people.length, 1);
    nodes.push({
      id: `p-${p.id}`, type: "familyNode",
      position: { x: cx + Math.cos(angle) * hSpacing * 2.5, y: cy + Math.sin(angle) * vSpacing * 1.5 },
      data: { label: p.fullName, personId: p.id, isCurrent: false, avatarUrl: p.avatarUrl, handle: p.handle },
    });
    const relToCenter = familyRels.find(r =>
      (r.fromId === p.id && r.toId === centerId) || (r.toId === p.id && r.fromId === centerId)
    );
    if (relToCenter) {
      edges.push({ id: `e-${centerId}-${p.id}`, source: `p-${centerId}`, target: `p-${p.id}`, type: "familyEdge" });
    }
  }

  return { nodes, edges };
}

function FamilyTreePanel({ personId, onNavigate }: { personId: number; onNavigate: (handle: string | null, id: number) => void }) {
  const [depth, setDepth] = useState(2);
  const { data, isLoading } = useQuery<{ people: Person[]; relationships: Relationship[] }>({
    queryKey: [`/api/people/${personId}/family-tree?depth=${depth}`],
    enabled: !!personId,
  });

  const treeData = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };
    return buildTreeLayout(data.people, data.relationships, personId);
  }, [data, personId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!data || data.people.length <= 1) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <Users className="w-10 h-10 text-white/10 mb-3" />
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">No family connections found</p>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <FamilyTreeGraph
        nodes={treeData.nodes}
        edges={treeData.edges}
        personId={personId}
        depth={depth}
        onDepthChange={setDepth}
        onNavigate={onNavigate}
      />
    </ReactFlowProvider>
  );
}

function FamilyTreeGraph({
  nodes: initialNodes, edges: initialEdges, personId, depth, onDepthChange, onNavigate,
}: {
  nodes: Node[]; edges: Edge[]; personId: number; depth: number;
  onDepthChange: (d: number) => void; onNavigate: (handle: string | null, id: number) => void;
}) {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const { fitView, setCenter } = useReactFlow();

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const nPersonId = node.data.personId as number;
    if (nPersonId !== personId) {
      onNavigate(node.data.handle as string | null, nPersonId);
    }
  }, [personId, onNavigate]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.3, maxZoom: 1.5, duration: 400 });
  }, [fitView]);

  const handleRecenter = useCallback(() => {
    const centerNode = initialNodes.find(n => (n.data.isCurrent as boolean));
    if (centerNode) {
      setCenter(centerNode.position.x + 20, centerNode.position.y + 20, { zoom: 1.2, duration: 400 });
    }
  }, [setCenter, initialNodes]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }} data-testid="family-tree-panel">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.3}
        maxZoom={2.5}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1.5 }}
        nodesDraggable={false}
        nodesConnectable={false}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        proOptions={{ hideAttribution: true }}
        style={{ background: "transparent" }}
      >
        <Background color="rgba(255,255,255,0.02)" gap={40} />
        <Controls
          showInteractive={false}
          style={{ background: "#161a1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 0 }}
        />
      </ReactFlow>

      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
        <button
          onClick={handleFitView}
          className="flex items-center gap-1 px-2 py-1 text-[9px] font-mono uppercase tracking-wider border border-white/10 bg-card/80 text-white/50 hover:text-white/80 hover:border-white/20 transition-colors"
          data-testid="button-fit-view"
          title="Fit to screen"
        >
          <Maximize className="w-3 h-3" /> Fit
        </button>
        <button
          onClick={handleRecenter}
          className="flex items-center gap-1 px-2 py-1 text-[9px] font-mono uppercase tracking-wider border border-white/10 bg-card/80 text-white/50 hover:text-white/80 hover:border-white/20 transition-colors"
          data-testid="button-recenter"
          title="Recenter on person"
        >
          <LocateFixed className="w-3 h-3" /> Center
        </button>
        {depth < 5 && (
          <button
            onClick={() => onDepthChange(depth + 1)}
            className="flex items-center gap-1 px-2 py-1 text-[9px] font-mono uppercase tracking-wider border border-white/10 bg-card/80 text-white/50 hover:text-white/80 hover:border-white/20 transition-colors"
            data-testid="button-expand-depth"
            title="Load deeper relatives"
          >
            <GitBranch className="w-3 h-3" /> Expand
          </button>
        )}
      </div>

      <div className="absolute bottom-3 left-3 z-10">
        <span className="font-mono text-[8px] text-white/30 uppercase tracking-wider">
          Depth: {depth} | {nodes.length} members
        </span>
      </div>
    </div>
  );
}

export default function PersonDetail() {
  const { handle } = useParams<{ handle: string }>();
  const [, navigate] = useLocation();

  const isNumeric = /^\d+$/.test(handle || "");

  const { data: personByHandle, isLoading: loadingHandle } = useQuery<Person>({
    queryKey: [`/api/people/handle/${handle}`],
    enabled: !!handle && !isNumeric,
    retry: false,
  });

  const { data: personById, isLoading: loadingId } = useQuery<Person>({
    queryKey: [`/api/people/${handle}`],
    enabled: !!handle && isNumeric,
    retry: false,
  });

  const person = isNumeric ? personById : personByHandle;
  const isLoading = isNumeric ? loadingId : loadingHandle;

  const { data: allHoles = [] } = useQuery<RabbitHole[]>({
    queryKey: ["/api/holes"],
    enabled: !!person,
  });

  const { data: caseRels = [] } = useQuery<Relationship[]>({
    queryKey: [`/api/people/${person?.id}/relationships`],
    enabled: !!person?.id,
  });

  const handleNavigate = useCallback((nodeHandle: string | null, nodeId: number) => {
    if (nodeHandle) {
      navigate(`/people/${nodeHandle}`);
    } else {
      navigate(`/people/${nodeId}`);
    }
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" data-testid="loader-person" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center">
        <User className="w-16 h-16 text-white/10 mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">Person Not Found</h2>
        <p className="text-muted-foreground font-mono text-sm mb-6">This profile does not exist or has been removed.</p>
        <Link href="/connections" className="font-mono text-sm text-primary hover:underline flex items-center gap-2" data-testid="link-back-connections">
          <ArrowLeft className="w-4 h-4" /> Back to Connections
        </Link>
      </div>
    );
  }

  const holesMap = new Map(allHoles.map(h => [h.id, h]));
  const caseRelationships = caseRels.filter(r => r.fromType === "hole" || r.toType === "hole");
  const personRelationships = caseRels.filter(r => r.fromType === "person" && r.toType === "person");
  const familyRels = personRelationships.filter(r => (FAMILY_RELATIONSHIP_TYPES as readonly string[]).includes(r.relationshipType));
  const otherPersonRels = personRelationships.filter(r => !(FAMILY_RELATIONSHIP_TYPES as readonly string[]).includes(r.relationshipType));

  function getCaseId(r: Relationship) {
    if (r.fromType === "hole") return r.fromId;
    if (r.toType === "hole") return r.toId;
    return null;
  }

  const isDraftOrReview = person.status === "Draft" || person.status === "Review";

  return (
    <div className="min-h-screen bg-background" data-testid="page-person-detail">
      {person.bannerUrl && (
        <div className="h-48 w-full overflow-hidden relative">
          <img src={person.bannerUrl} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        </div>
      )}

      <div className="flex" style={{ minHeight: person.bannerUrl ? "calc(100vh - 12rem)" : "calc(100vh - 4rem)" }}>
        <div className="flex-1 overflow-y-auto px-6 py-6 max-w-3xl">
          <Link href="/connections" className="inline-flex items-center gap-2 font-mono text-[10px] text-muted-foreground hover:text-primary transition-colors mb-6 uppercase tracking-wider" data-testid="link-back-connections">
            <ArrowLeft className="w-3 h-3" /> Connections
          </Link>

          {isDraftOrReview && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 border border-yellow-500/30 bg-yellow-500/5" data-testid="badge-draft-status">
              <Shield className="w-4 h-4 text-yellow-500" />
              <span className="font-mono text-[10px] text-yellow-500 uppercase tracking-wider">{person.status} - Employee Preview</span>
            </div>
          )}

          <div className="flex items-start gap-5 mb-6">
            {person.avatarUrl ? (
              <img src={person.avatarUrl} alt="" className="w-20 h-20 rounded-full border-2 border-white/10 object-cover flex-shrink-0" data-testid="img-avatar" />
            ) : (
              <div className="w-20 h-20 border-2 border-white/10 rounded-full flex items-center justify-center flex-shrink-0 bg-white/5">
                <User className="w-10 h-10 text-primary/50" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-bold" data-testid="text-person-name">{person.fullName}</h1>
              {person.handle && (
                <p className="font-mono text-xs text-muted-foreground mt-0.5" data-testid="text-person-handle">@{person.handle}</p>
              )}
              {person.aliases && (
                <AliasesCollapsible aliases={person.aliases} />
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6 font-mono text-xs text-muted-foreground">
            {(person.birthDate || person.deathDate) && (
              <span className="flex items-center gap-1.5" data-testid="text-dates">
                <Calendar className="w-3 h-3 text-primary" />
                {person.birthDate && `b. ${person.birthDate}`}
                {person.birthDate && person.deathDate && " — "}
                {person.deathDate && `d. ${person.deathDate}`}
              </span>
            )}
            {person.nationality && (
              <span className="flex items-center gap-1.5" data-testid="text-nationality">
                <MapPin className="w-3 h-3 text-primary" /> {person.nationality}
              </span>
            )}
          </div>

          {person.tags && person.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6" data-testid="tags-container">
              {person.tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] bg-primary/10 text-primary border border-primary/20 uppercase">
                  <Tag className="w-2.5 h-2.5" /> {tag}
                </span>
              ))}
            </div>
          )}

          {person.description && (
            <div className="border-t border-white/10 pt-5 mb-8">
              <h2 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Overview</h2>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap" data-testid="text-person-description">{person.description}</p>
            </div>
          )}

          {caseRelationships.length > 0 && (
            <div className="border-t border-white/10 pt-5 mb-6">
              <h2 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2" data-testid="section-related-cases">
                <GitBranch className="w-3.5 h-3.5 text-primary" /> Connections to Cases
              </h2>
              <CaseConnectionsGrouped caseRels={caseRelationships} holesMap={holesMap} personId={person.id} />
            </div>
          )}

          {otherPersonRels.length > 0 && (
            <div className="border-t border-white/10 pt-5 mb-6">
              <h2 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2" data-testid="section-other-connections">
                <Users className="w-3.5 h-3.5 text-primary" /> Other Connections
              </h2>
              <div className="space-y-2">
                {otherPersonRels.map(r => {
                  const otherId = r.fromId === person.id && r.fromType === "person" ? r.toId : r.fromId;
                  return (
                    <OtherPersonLink key={r.id} otherId={otherId} relType={r.relationshipType} label={r.label} />
                  );
                })}
              </div>
            </div>
          )}

          {caseRelationships.length === 0 && familyRels.length === 0 && otherPersonRels.length === 0 && (
            <div className="border-t border-white/10 pt-8 text-center">
              <Users className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="font-mono text-xs text-muted-foreground">No known connections for this person.</p>
            </div>
          )}
        </div>

        <div className="w-[400px] min-w-[320px] border-l border-white/10 bg-card/30 flex flex-col" style={{ height: person.bannerUrl ? "calc(100vh - 12rem)" : "calc(100vh - 4rem)", position: "sticky", top: person.bannerUrl ? "12rem" : "4rem" }}>
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-primary" /> Family Tree
            </h3>
          </div>
          <div className="flex-1">
            <FamilyTreePanel personId={person.id} onNavigate={handleNavigate} />
          </div>
        </div>
      </div>

      <style>{`
        .react-flow__controls button {
          background: #111 !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: rgba(255,255,255,0.5) !important;
          border-radius: 0 !important;
        }
        .react-flow__controls button:hover {
          background: #222 !important;
          color: rgba(255,255,255,0.8) !important;
        }
        .react-flow__controls button svg {
          fill: currentColor !important;
        }
      `}</style>
    </div>
  );
}

function AliasesCollapsible({ aliases }: { aliases: string }) {
  const [open, setOpen] = useState(false);
  if (!aliases) return null;
  return (
    <button
      onClick={() => setOpen(o => !o)}
      className="flex items-center gap-1 mt-1 font-mono text-[10px] text-muted-foreground hover:text-white/60 transition-colors"
      data-testid="button-toggle-aliases"
    >
      <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      {open ? `AKA: ${aliases}` : "Show aliases"}
    </button>
  );
}

function CaseConnectionsGrouped({ caseRels, holesMap, personId }: { caseRels: Relationship[]; holesMap: Map<number, RabbitHole>; personId: number }) {
  const grouped = useMemo(() => {
    const map = new Map<string, { hole: RabbitHole; rels: Relationship[] }>();
    for (const r of caseRels) {
      const caseId = r.fromType === "hole" ? r.fromId : r.toId;
      const hole = holesMap.get(caseId);
      if (!hole) continue;
      const key = String(caseId);
      if (!map.has(key)) map.set(key, { hole, rels: [] });
      map.get(key)!.rels.push(r);
    }
    return Array.from(map.values());
  }, [caseRels, holesMap]);

  return (
    <div className="space-y-3">
      {grouped.map(({ hole, rels }) => (
        <div key={hole.id} className="border border-white/5 p-3 hover:border-primary/20 transition-colors" data-testid={`case-group-${hole.id}`}>
          <Link href={`/rabbithole/${hole.slug}`} className="font-display text-sm font-semibold hover:text-primary transition-colors" data-testid={`link-case-${hole.slug}`}>
            {hole.title}
          </Link>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {rels.map(r => (
              <span key={r.id} className="font-mono text-[9px] text-primary bg-primary/10 px-2 py-0.5 uppercase">
                {formatRelType(r.relationshipType)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function OtherPersonLink({ otherId, relType, label }: { otherId: number; relType: string; label: string }) {
  const { data: otherPerson } = useQuery<Person>({
    queryKey: [`/api/people/${otherId}`],
    retry: false,
  });

  return (
    <div className="flex items-center gap-3 border border-white/5 p-3 hover:border-primary/20 transition-colors" data-testid={`other-rel-${otherId}`}>
      <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div>
        {otherPerson ? (
          <Link href={`/people/${otherPerson.handle || otherId}`} className="font-display text-sm font-semibold hover:text-primary transition-colors" data-testid={`link-person-${otherId}`}>
            {otherPerson.fullName}
          </Link>
        ) : (
          <span className="font-display text-sm font-semibold text-muted-foreground">Person #{otherId}</span>
        )}
        <span className="ml-2 font-mono text-[9px] text-primary bg-primary/10 px-2 py-0.5 uppercase">
          {formatRelType(relType)}
        </span>
        {label && <span className="ml-2 font-mono text-[10px] text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}
