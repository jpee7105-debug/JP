---
name: Workspace V2 architecture
description: Component split, routing, and data flow for the /workspace-v2 feature
---

## Component locations

All workspace components live in `client/src/features/workspace/`:
- `workspace.types.ts` — NodeKind (8 kinds), WNode, WEdge, WorkspaceData, C (design tokens), KIND_META
- `mockWorkspaceData.ts` — Operation Cobalt Network mock data; MOCK_WORKSPACE_DATA export
- `workspace.adapters.ts` — adaptHoleToWorkspace(), buildRFNodes(), buildRFEdges(), buildNodeMap()
- `WorkspaceNode.tsx` — WNodeComponent (memo), nodeTypes
- `WorkspaceGraph.tsx` — GraphCanvas (accepts initialNodes, initialEdges, nodeMap, kindFilter)
- `WorkspaceDetailsPanel.tsx` — WorkspaceDetailsPanel (accepts edges, nodeMap as props, not module globals)
- `WorkspaceTimeline.tsx` — WorkspaceTimeline (accepts events[], title)
- `WorkspaceSidebar.tsx` — WorkspaceSidebar + SIDEBAR_ITEMS (items have optional filterKind: NodeKind)
- `WorkspaceHeader.tsx` — WorkspaceHeader
- `WorkspaceLayout.tsx` — main orchestrator, takes { title, nodes, edges, isReal? }

## Pages

- `client/src/pages/WorkspaceV2.tsx` — thin wrapper: passes MOCK_WORKSPACE_DATA to WorkspaceLayout
- `client/src/pages/WorkspaceReal.tsx` — fetches 7 APIs in parallel, calls adaptHoleToWorkspace, passes to WorkspaceLayout

## Routing (App.tsx)

AppRouter checks `location.startsWith("/workspace-v2")` and renders a Switch:
- `/workspace-v2/:slug` → WorkspaceReal
- `/workspace-v2`       → WorkspaceV2

## Node kinds (extended from original 5)

Original: person, event, claim, evidence, org
Added: investigation (rabbit hole center), section (depth node), source (source record)

## Adapter mapping

hole → investigation node (center)
depthNode → section node + edge from hole
hole.timeline[] → event nodes + edges from hole
depthNode.timeline[] → event nodes + edges from depthNode
claim → claim node + edge from hole or depthNode (via nodeId)
source → source node + edge from hole or depthNode (via nodeId)
claim.evidence[].sourceId → edge claim→source "supported by"
claim.counterpoints[].sourceId → edge claim→source "countered by"
media → evidence node + edge from hole or depthNode
person (published) → person node (shows all published people if no relationships exist)
relationship record → edge between person/hole nodes

**Why:** The existing schema doesn't have a direct hole↔person join table; relationships records are the bridge.

## Sidebar filtering

SIDEBAR_ITEMS entries with filterKind set → GraphCanvas receives kindFilter: NodeKind | null.
Non-matching nodes get isFaded=true. Counts shown in sidebar per kind.
