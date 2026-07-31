import { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
} from "@xyflow/react";
import { nodeTypes } from "./WorkspaceNode";
import { C, KIND_META, type WNode, type NodeKind } from "./workspace.types";

interface GraphCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  nodeMap: Record<string, WNode>;
  kindFilter: NodeKind | null;
  onNodeHover: (id: string | null) => void;
  onNodeSelect: (id: string | null) => void;
  selectedNodeId: string | null;
  focusNodeId: string | null;
}

export function GraphCanvas({
  initialNodes,
  initialEdges,
  nodeMap,
  kindFilter,
  onNodeHover,
  onNodeSelect,
  selectedNodeId,
  focusNodeId,
}: GraphCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView, setCenter } = useReactFlow();
  const hoveredIdRef = useRef<string | null>(null);

  // Re-initialize when initial data changes (switching from mock→real)
  const prevInitialRef = useRef(initialNodes);
  useEffect(() => {
    if (prevInitialRef.current !== initialNodes) {
      prevInitialRef.current = initialNodes;
      setNodes(initialNodes);
      setEdges(initialEdges);
      setTimeout(() => fitView({ padding: 0.08, duration: 600 }), 50);
    }
  }, [initialNodes, initialEdges, setNodes, setEdges, fitView]);

  // Compute neighbor set for a given node id
  const getNeighbors = useCallback((id: string): Set<string> => {
    const set = new Set<string>([id]);
    edges.forEach(e => {
      if (e.source === id) set.add(e.target);
      if (e.target === id) set.add(e.source);
    });
    return set;
  }, [edges]);

  // Apply highlight + kind filter
  const applyHighlight = useCallback((activeId: string | null) => {
    setNodes(ns => ns.map(n => {
      const wn = (n.data as { wnode: WNode }).wnode;
      const filteredOut = kindFilter !== null && wn.kind !== kindFilter;

      if (!activeId) {
        return { ...n, data: { ...n.data, isHighlighted: false, isFaded: filteredOut } };
      }
      const neighbors = getNeighbors(activeId);
      const isNeighbor = neighbors.has(n.id);
      return {
        ...n,
        data: {
          ...n.data,
          isHighlighted: isNeighbor && !filteredOut,
          isFaded: filteredOut || !isNeighbor,
        },
      };
    }));
    setEdges(es => es.map(e => {
      if (!activeId) {
        return { ...e, animated: false, style: { stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 } };
      }
      const active = e.source === activeId || e.target === activeId;
      return {
        ...e,
        animated: active,
        style: {
          stroke: active ? C.accent : "rgba(255,255,255,0.04)",
          strokeWidth: active ? 2 : 1,
        },
      };
    }));
  }, [getNeighbors, kindFilter, setNodes, setEdges]);

  // Reapply filter whenever kindFilter changes
  useEffect(() => {
    applyHighlight(selectedNodeId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kindFilter]);

  // Focus (pan to) a node when focusNodeId changes
  useEffect(() => {
    if (!focusNodeId) return;
    const wn = nodeMap[focusNodeId];
    if (wn) {
      setCenter(wn.x + 90, wn.y + 40, { zoom: 1.4, duration: 600 });
      applyHighlight(focusNodeId);
    }
  }, [focusNodeId, nodeMap, setCenter, applyHighlight]);

  const handleNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    hoveredIdRef.current = node.id;
    onNodeHover(node.id);
    applyHighlight(node.id);
  }, [onNodeHover, applyHighlight]);

  const handleNodeMouseLeave = useCallback(() => {
    hoveredIdRef.current = null;
    onNodeHover(null);
    applyHighlight(selectedNodeId ?? null);
  }, [onNodeHover, selectedNodeId, applyHighlight]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    onNodeSelect(node.id);
    applyHighlight(node.id);
  }, [onNodeSelect, applyHighlight]);

  const handlePaneClick = useCallback(() => {
    onNodeSelect(null);
    applyHighlight(null);
  }, [onNodeSelect, applyHighlight]);

  useEffect(() => {
    fitView({ padding: 0.08, duration: 600 });
  }, [fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      onNodeMouseEnter={handleNodeMouseEnter}
      onNodeMouseLeave={handleNodeMouseLeave}
      onNodeClick={handleNodeClick}
      onPaneClick={handlePaneClick}
      minZoom={0.05}
      maxZoom={3}
      fitView
      proOptions={{ hideAttribution: true }}
      style={{ background: C.bg }}
    >
      <Background color={C.textMuted} gap={28} size={0.5} style={{ opacity: 0.35 }} />
      <Controls style={{ background: C.surfaceEl, border: `1px solid ${C.border}`, borderRadius: 6 }} />
      <MiniMap
        style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6 }}
        nodeColor={(n) => {
          const wn = (n.data as { wnode: WNode }).wnode;
          return KIND_META[wn.kind]?.palette[1] ?? C.border;
        }}
        maskColor="rgba(8,8,13,0.75)"
      />
    </ReactFlow>
  );
}
