import { type Node, type Edge } from "@xyflow/react";
import { type WNode, type WEdge, type WorkspaceData } from "./workspace.types";

// ─── API response shapes (read-only, matches server DTOs) ────────────────────
export interface ApiHole {
  id: number;
  slug: string;
  title: string;
  summary: string;
  status: string;
  completion: number;
  timeline: { year: string; event: string; type: string }[];
  labels: string[];
  connections: number;
  sourceCount: number;
}

export interface ApiDepthNode {
  id: number;
  holeId: number;
  title: string;
  summary: string;
  content: string;
  position: number;
  status: string;
  timeline: { year: string; event: string; type: string }[];
  locked: boolean;
}

export interface ApiClaim {
  id: number;
  holeId: number;
  nodeId: number | null;
  statement: string;
  stance: string;
  confidence: number;
  evidence: { sourceId: number; excerpt: string }[];
  counterpoints: { sourceId: number; excerpt: string }[];
}

export interface ApiSource {
  id: number;
  holeId: number;
  nodeId: number | null;
  title: string;
  author: string;
  origin: string;
  publishedDate: string;
  url: string;
  summary: string;
  type: string;
  stanceTag: string;
  credibility: number;
}

export interface ApiMedia {
  id: number;
  holeId: number;
  nodeId: number | null;
  title: string;
  url: string;
  type: string;
  caption: string;
}

export interface ApiPerson {
  id: number;
  fullName: string;
  handle: string;
  aliases: string;
  description: string;
  nationality: string;
  tags: string[];
  graphX: number | null;
  graphY: number | null;
}

export interface ApiRelationship {
  id: number;
  fromType: string;
  fromId: number;
  toType: string;
  toId: number;
  relationshipType: string;
  label: string;
  confidence: number;
  status: string;
}

// ─── Layout helpers ───────────────────────────────────────────────────────────
function gridLayout(
  nodes: WNode[],
  cols: number,
  originX: number,
  originY: number,
  colGap: number,
  rowGap: number,
): WNode[] {
  return nodes.map((n, i) => ({
    ...n,
    x: originX + (i % cols) * colGap,
    y: originY + Math.floor(i / cols) * rowGap,
  }));
}

function spineLayout(
  nodes: WNode[],
  originX: number,
  originY: number,
  gap: number,
): WNode[] {
  return nodes.map((n, i) => ({
    ...n,
    x: originX + i * gap,
    y: originY + (i % 3 === 0 ? 0 : i % 3 === 1 ? -60 : 60),
  }));
}

// ─── ReactFlow builders (shared with mock data) ───────────────────────────────
export function buildRFNodes(wnodes: WNode[]): Node[] {
  return wnodes.map(n => ({
    id: n.id,
    type: "wnode",
    position: { x: n.x, y: n.y },
    data: { wnode: n, isHighlighted: false, isFaded: false },
    draggable: true,
  }));
}

export function buildRFEdges(edges: WEdge[]): Edge[] {
  return edges.map((e, i) => ({
    id: `edge-${i}`,
    source: e.source,
    target: e.target,
    label: e.label,
    type: "default",
    animated: false,
    style: { stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 },
    labelStyle: { fill: "rgba(255,255,255,0.3)", fontSize: 9 },
    labelBgStyle: { fill: "#0F0F18", fillOpacity: 0.8 },
  }));
}

// ─── Main adapter ─────────────────────────────────────────────────────────────
export function adaptHoleToWorkspace(
  hole: ApiHole,
  depthNodes: ApiDepthNode[],
  claims: ApiClaim[],
  sources: ApiSource[],
  media: ApiMedia[],
  allPeople: ApiPerson[],
  relationships: ApiRelationship[],
): WorkspaceData {
  const nodes: WNode[] = [];
  const edges: WEdge[] = [];

  // ── 1. Central investigation node ─────────────────────────────────────────
  const holeNodeId = `hole-${hole.id}`;
  nodes.push({
    id: holeNodeId,
    kind: "investigation",
    label: hole.title,
    sub: `${hole.completion}% complete · ${hole.sourceCount} sources`,
    desc: hole.summary,
    confidence: hole.completion,
    tags: hole.labels,
    x: 0, y: 0,
  });

  // ── 2. Depth nodes → section nodes ────────────────────────────────────────
  const publishedDepthNodes = depthNodes.filter(dn => !dn.locked);
  for (const dn of publishedDepthNodes) {
    const dnId = `dn-${dn.id}`;
    nodes.push({
      id: dnId,
      kind: "section",
      label: dn.title,
      sub: `Section ${dn.position + 1}`,
      desc: dn.summary || dn.content.slice(0, 200),
      x: 0, y: 0,
    });
    edges.push({ source: holeNodeId, target: dnId, label: "contains" });
  }

  // ── 3. Hole timeline → event nodes ────────────────────────────────────────
  for (let i = 0; i < hole.timeline.length; i++) {
    const tlItem = hole.timeline[i];
    const evId = `htl-${hole.id}-${i}`;
    nodes.push({
      id: evId,
      kind: "event",
      label: tlItem.event,
      sub: tlItem.year,
      desc: tlItem.event,
      date: tlItem.year,
      x: 0, y: 0,
    });
    edges.push({ source: holeNodeId, target: evId, label: tlItem.type || "event" });
  }

  // ── 4. Depth node timelines → event nodes ─────────────────────────────────
  for (const dn of publishedDepthNodes) {
    const dnId = `dn-${dn.id}`;
    for (let i = 0; i < dn.timeline.length; i++) {
      const tlItem = dn.timeline[i];
      const evId = `dntl-${dn.id}-${i}`;
      nodes.push({
        id: evId,
        kind: "event",
        label: tlItem.event,
        sub: tlItem.year,
        desc: tlItem.event,
        date: tlItem.year,
        x: 0, y: 0,
      });
      edges.push({ source: dnId, target: evId, label: tlItem.type || "event" });
    }
  }

  // ── 5. Claims ─────────────────────────────────────────────────────────────
  for (const claim of claims) {
    const claimId = `claim-${claim.id}`;
    nodes.push({
      id: claimId,
      kind: "claim",
      label: claim.statement.length > 60
        ? claim.statement.slice(0, 57) + "…"
        : claim.statement,
      sub: claim.stance,
      desc: claim.statement,
      confidence: claim.confidence,
      x: 0, y: 0,
    });
    // Connect to parent depth node if it has one
    if (claim.nodeId != null) {
      const dnId = `dn-${claim.nodeId}`;
      if (publishedDepthNodes.some(dn => dn.id === claim.nodeId)) {
        edges.push({ source: dnId, target: claimId, label: "contains claim" });
      }
    } else {
      edges.push({ source: holeNodeId, target: claimId, label: "contains claim" });
    }
  }

  // ── 6. Sources ────────────────────────────────────────────────────────────
  const sourceMap: Record<number, string> = {}; // apiId → nodeId
  for (const src of sources) {
    const srcId = `src-${src.id}`;
    sourceMap[src.id] = srcId;
    nodes.push({
      id: srcId,
      kind: "source",
      label: src.title,
      sub: [src.type, src.author].filter(Boolean).join(" · "),
      desc: src.summary || src.title,
      confidence: src.credibility,
      url: src.url || undefined,
      tags: [src.stanceTag].filter(t => t && t !== "neutral"),
      x: 0, y: 0,
    });
    if (src.nodeId != null) {
      const dnId = `dn-${src.nodeId}`;
      if (publishedDepthNodes.some(dn => dn.id === src.nodeId)) {
        edges.push({ source: dnId, target: srcId, label: "references" });
      }
    } else {
      edges.push({ source: holeNodeId, target: srcId, label: "references" });
    }
  }

  // Claims → sources via evidence / counterpoints
  for (const claim of claims) {
    const claimId = `claim-${claim.id}`;
    for (const ev of claim.evidence ?? []) {
      if (sourceMap[ev.sourceId]) {
        edges.push({ source: claimId, target: sourceMap[ev.sourceId], label: "supported by" });
      }
    }
    for (const cp of claim.counterpoints ?? []) {
      if (sourceMap[cp.sourceId]) {
        edges.push({ source: claimId, target: sourceMap[cp.sourceId], label: "countered by" });
      }
    }
  }

  // ── 7. Media → evidence nodes ─────────────────────────────────────────────
  for (const m of media) {
    const mediaId = `media-${m.id}`;
    nodes.push({
      id: mediaId,
      kind: "evidence",
      label: m.title,
      sub: m.type,
      desc: m.caption || m.title,
      url: m.url || undefined,
      x: 0, y: 0,
    });
    if (m.nodeId != null) {
      const dnId = `dn-${m.nodeId}`;
      if (publishedDepthNodes.some(dn => dn.id === m.nodeId)) {
        edges.push({ source: dnId, target: mediaId, label: "contains media" });
      }
    } else {
      edges.push({ source: holeNodeId, target: mediaId, label: "contains media" });
    }
  }

  // ── 8. People connected via relationship records ───────────────────────────
  const addedPeople = new Set<number>();
  for (const rel of relationships) {
    const involvesPerson =
      (rel.fromType === "person" || rel.toType === "person") &&
      (rel.fromType === "hole" || rel.toType === "hole" ||
       rel.fromType === "person" || rel.toType === "person");

    if (rel.fromType === "person") {
      addedPeople.add(rel.fromId);
    }
    if (rel.toType === "person") {
      addedPeople.add(rel.toId);
    }
    // Also include any person↔person relationship
    if (!involvesPerson) continue;
  }

  // Also add people referenced by any relationship touching this hole
  const holeRelationships = relationships.filter(
    r =>
      (r.fromType === "hole" && r.fromId === hole.id) ||
      (r.toType === "hole" && r.toId === hole.id) ||
      r.fromType === "person" ||
      r.toType === "person",
  );
  for (const rel of holeRelationships) {
    if (rel.fromType === "person") addedPeople.add(rel.fromId);
    if (rel.toType === "person") addedPeople.add(rel.toId);
  }

  const personNodeIds: Record<number, string> = {};
  for (const person of allPeople) {
    if (!addedPeople.has(person.id) && addedPeople.size > 0) continue;
    // If there are no relationships at all, still show all published people
    const personNodeId = `person-${person.id}`;
    personNodeIds[person.id] = personNodeId;
    nodes.push({
      id: personNodeId,
      kind: "person",
      label: person.fullName,
      sub: [person.nationality, person.aliases].filter(Boolean).join(" · ") || "Person",
      desc: person.description || person.fullName,
      tags: person.tags ?? [],
      x: 0, y: 0,
    });
  }

  // Relationship edges between people and hole / people and people
  for (const rel of relationships) {
    const fromId =
      rel.fromType === "person" ? personNodeIds[rel.fromId] :
      rel.fromType === "hole"   ? holeNodeId : null;
    const toId =
      rel.toType === "person" ? personNodeIds[rel.toId] :
      rel.toType === "hole"   ? holeNodeId : null;
    if (fromId && toId) {
      edges.push({ source: fromId, target: toId, label: rel.label || rel.relationshipType });
    }
  }

  // ── 9. Apply layout by kind ────────────────────────────────────────────────
  const byKind: Partial<Record<WNode["kind"], WNode[]>> = {};
  for (const n of nodes) {
    (byKind[n.kind] ??= []).push(n);
  }

  const investigationNodes = byKind["investigation"] ?? [];
  const sectionNodes       = byKind["section"]       ?? [];
  const eventNodes         = byKind["event"]         ?? [];
  const claimNodes         = byKind["claim"]         ?? [];
  const sourceNodes        = byKind["source"]        ?? [];
  const evidenceNodes      = byKind["evidence"]      ?? [];
  const personNodes        = byKind["person"]        ?? [];

  // Investigation: center
  investigationNodes.forEach(n => { n.x = 900; n.y = 100; });

  // Sections: horizontal strip below investigation
  gridLayout(sectionNodes, Math.max(sectionNodes.length, 1), 300, 280, 320, 160)
    .forEach((n, i) => { sectionNodes[i].x = n.x; sectionNodes[i].y = n.y; });

  // Events: spine across the middle
  spineLayout(eventNodes, 60, 520, Math.max(180, 3600 / Math.max(eventNodes.length, 1)))
    .forEach((n, i) => { eventNodes[i].x = n.x; eventNodes[i].y = n.y; });

  // Claims: grid below events
  gridLayout(claimNodes, 5, 60, 720, 280, 150)
    .forEach((n, i) => { claimNodes[i].x = n.x; claimNodes[i].y = n.y; });

  // Sources: right side
  gridLayout(sourceNodes, 3, 1800, 100, 280, 150)
    .forEach((n, i) => { sourceNodes[i].x = n.x; sourceNodes[i].y = n.y; });

  // Evidence: far right lower
  gridLayout(evidenceNodes, 3, 1800, 700, 280, 150)
    .forEach((n, i) => { evidenceNodes[i].x = n.x; evidenceNodes[i].y = n.y; });

  // People: top left
  gridLayout(personNodes, 5, 60, 60, 240, 150)
    .forEach((n, i) => { personNodes[i].x = n.x; personNodes[i].y = n.y; });

  return { title: hole.title, nodes, edges };
}

// ─── Build node map for lookup ────────────────────────────────────────────────
export function buildNodeMap(nodes: WNode[]): Record<string, WNode> {
  return Object.fromEntries(nodes.map(n => [n.id, n]));
}
