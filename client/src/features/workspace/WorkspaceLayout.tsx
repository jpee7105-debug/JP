import { useState, useCallback, useMemo } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Minus } from "lucide-react";

import { C, KIND_META, type WNode, type WEdge, type NodeKind } from "./workspace.types";
import { buildRFNodes, buildRFEdges, buildNodeMap } from "./workspace.adapters";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { WorkspaceSidebar, SIDEBAR_ITEMS } from "./WorkspaceSidebar";
import { GraphCanvas } from "./WorkspaceGraph";
import { WorkspaceDetailsPanel } from "./WorkspaceDetailsPanel";
import { WorkspaceTimeline } from "./WorkspaceTimeline";

interface WorkspaceLayoutProps {
  title: string;
  nodes: WNode[];
  edges: WEdge[];
  isReal?: boolean;
}

export function WorkspaceLayout({ title, nodes, edges, isReal = false }: WorkspaceLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("graph");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Derive active node (hover takes priority)
  const activeNodeId = hoveredNodeId ?? selectedNodeId;

  // Build ReactFlow-ready data (memoised — only recalculates when raw data changes)
  const rfNodes = useMemo(() => buildRFNodes(nodes), [nodes]);
  const rfEdges = useMemo(() => buildRFEdges(edges), [edges]);
  const nodeMap  = useMemo(() => buildNodeMap(nodes), [nodes]);

  // Active node object
  const activeNode: WNode | null = activeNodeId ? (nodeMap[activeNodeId] ?? null) : null;

  // Kind filter from sidebar selection
  const kindFilter: NodeKind | null = useMemo(() => {
    const item = SIDEBAR_ITEMS.find(i => i.id === activeSection);
    return item?.filterKind ?? null;
  }, [activeSection]);

  // Search filtering: highlight matching nodes, dim everything else
  const searchFilter: NodeKind | null = useMemo(() => {
    // Search doesn't use kindFilter — it's handled separately in the graph via the query
    return null;
  }, []);
  void searchFilter;

  // Filtered nodes for search (used in search overlay, not the graph directly)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return nodes.filter(
      n =>
        n.label.toLowerCase().includes(q) ||
        n.desc.toLowerCase().includes(q) ||
        n.sub.toLowerCase().includes(q) ||
        n.tags?.some(t => t.toLowerCase().includes(q)),
    );
  }, [searchQuery, nodes]);

  // Node counts by kind (for header chips + sidebar)
  const nodeCounts = useMemo(() => {
    const counts: Partial<Record<NodeKind, number>> = {};
    for (const n of nodes) {
      counts[n.kind] = (counts[n.kind] ?? 0) + 1;
    }
    return counts;
  }, [nodes]);

  const sidebarCounts: Record<string, number> = {
    ...(nodeCounts as Record<string, number>),
    _edges: edges.length,
  };

  // Event nodes for timeline (sorted chronologically by adapters; sorted again in timeline)
  const eventNodes = useMemo(
    () => nodes.filter(n => n.kind === "event"),
    [nodes],
  );

  // Timeline selected event id: only pass when the selected node is itself an event
  const timelineSelectedId =
    selectedNodeId && nodeMap[selectedNodeId]?.kind === "event" ? selectedNodeId : null;

  // Handlers
  const handleTimelineSelect = useCallback((id: string) => {
    setSelectedNodeId(id);
    setFocusNodeId(id);
    setTimeout(() => setFocusNodeId(null), 50);
  }, []);

  const handleNodeHover = useCallback((id: string | null) => setHoveredNodeId(id), []);
  const handleNodeSelect = useCallback((id: string | null) => setSelectedNodeId(id), []);

  const handleClose = useCallback(() => {
    setSelectedNodeId(null);
    setHoveredNodeId(null);
  }, []);

  const handleSearchChange = useCallback((q: string) => setSearchQuery(q), []);

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", background: C.bg, overflow: "hidden", fontFamily: "'Inter',sans-serif" }}>

      {/* Top navigation */}
      <WorkspaceHeader
        title={title}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        nodeCounts={nodeCounts}
        isReal={isReal}
      />

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* Left sidebar */}
        <WorkspaceSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          nodeCounts={sidebarCounts}
        />

        {/* Center graph canvas */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden", minWidth: 0 }}>
          {/* Active node tooltip bar */}
          <div style={{ position: "absolute", top: 10, left: 10, zIndex: 5, display: "flex", gap: 6, alignItems: "center" }}>
            {activeNode && (
              <div style={{ padding: "5px 10px", background: "rgba(8,8,13,0.85)", backdropFilter: "blur(12px)", border: `1px solid ${C.border}`, borderRadius: 5, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ color: KIND_META[activeNode.kind].palette[2] }}>{KIND_META[activeNode.kind].icon}</div>
                <span style={{ color: C.text, fontSize: 11, fontFamily: "'Inter',sans-serif" }}>{activeNode.label}</span>
                {activeNode.confidence !== undefined && (
                  <>
                    <Minus size={9} color={C.textDim} />
                    <span style={{ color: C.textDim, fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>{activeNode.confidence}% confidence</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Search results overlay */}
          {searchQuery.trim() && searchResults.length > 0 && (
            <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", zIndex: 20, background: C.surfaceEl, border: `1px solid ${C.borderHi}`, borderRadius: 8, padding: "8px 0", minWidth: 320, maxHeight: 300, overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
              {searchResults.slice(0, 12).map(n => (
                <button
                  key={n.id}
                  onClick={() => {
                    handleTimelineSelect(n.id);
                    handleSearchChange("");
                  }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                >
                  <span style={{ color: KIND_META[n.kind].palette[2] }}>{KIND_META[n.kind].icon}</span>
                  <div>
                    <div style={{ color: C.text, fontSize: 12, fontFamily: "'Inter',sans-serif" }}>{n.label}</div>
                    <div style={{ color: C.textDim, fontSize: 10, fontFamily: "'Inter',sans-serif" }}>{n.sub}</div>
                  </div>
                </button>
              ))}
              {searchResults.length > 12 && (
                <div style={{ color: C.textMuted, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", textAlign: "center", padding: "6px 0" }}>
                  +{searchResults.length - 12} more results
                </div>
              )}
            </div>
          )}
          {searchQuery.trim() && searchResults.length === 0 && (
            <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", zIndex: 20, background: C.surfaceEl, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 20px" }}>
              <span style={{ color: C.textDim, fontSize: 12, fontFamily: "'Inter',sans-serif" }}>No results for "{searchQuery}"</span>
            </div>
          )}

          {/* Kind legend */}
          <div style={{ position: "absolute", bottom: 14, left: 14, zIndex: 5, display: "flex", flexDirection: "column", gap: 4 }}>
            {(Object.entries(KIND_META) as [NodeKind, typeof KIND_META[NodeKind]][])
              .filter(([kind]) => (nodeCounts[kind] ?? 0) > 0)
              .map(([kind, meta]) => (
                <div key={kind} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: meta.palette[0], border: `1px solid ${meta.palette[1]}` }} />
                  <span style={{ color: C.textDim, fontSize: 9.5, fontFamily: "'JetBrains Mono',monospace" }}>{meta.label}</span>
                </div>
              ))}
          </div>

          <ReactFlowProvider>
            <GraphCanvas
              initialNodes={rfNodes}
              initialEdges={rfEdges}
              nodeMap={nodeMap}
              kindFilter={kindFilter}
              onNodeHover={handleNodeHover}
              onNodeSelect={handleNodeSelect}
              selectedNodeId={selectedNodeId}
              focusNodeId={focusNodeId}
            />
          </ReactFlowProvider>
        </div>

        {/* Right detail panel */}
        <WorkspaceDetailsPanel
          node={activeNode}
          edges={edges}
          nodeMap={nodeMap}
          onClose={handleClose}
        />
      </div>

      {/* Bottom timeline */}
      <WorkspaceTimeline
        events={eventNodes}
        title={title}
        selectedEventId={timelineSelectedId}
        onSelect={handleTimelineSelect}
      />
    </div>
  );
}
