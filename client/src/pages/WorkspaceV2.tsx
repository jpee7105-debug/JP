// /workspace-v2 — mock demonstration using "Operation Cobalt Network" data.
// This page exists alongside /workspace-v2/:slug (real data) and is kept as
// a standalone demo that does not require any database content.
import { WorkspaceLayout } from "@/features/workspace/WorkspaceLayout";
import { MOCK_WORKSPACE_DATA } from "@/features/workspace/mockWorkspaceData";

export default function WorkspaceV2() {
  return (
    <WorkspaceLayout
      title={MOCK_WORKSPACE_DATA.title}
      nodes={MOCK_WORKSPACE_DATA.nodes}
      edges={MOCK_WORKSPACE_DATA.edges}
      isReal={false}
    />
  );
}
