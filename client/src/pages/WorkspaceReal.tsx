// /workspace-v2/:slug — real-data workspace view.
// Fetches all investigation data for the given slug and adapts it into the
// workspace node/edge format. Read-only; no editing or creation.
import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { WorkspaceLayout } from "@/features/workspace/WorkspaceLayout";
import {
  adaptHoleToWorkspace,
  type ApiHole,
  type ApiDepthNode,
  type ApiClaim,
  type ApiSource,
  type ApiMedia,
  type ApiPerson,
  type ApiRelationship,
} from "@/features/workspace/workspace.adapters";
import { type WorkspaceData } from "@/features/workspace/workspace.types";
import { C } from "@/features/workspace/workspace.types";

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function Loading({ slug }: { slug: string }) {
  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, gap: 16 }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: `linear-gradient(135deg, #6C63FF, #4039AA)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>R</span>
      </div>
      <div style={{ color: C.textDim, fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
        Loading <span style={{ color: C.accent, fontFamily: "'JetBrains Mono',monospace" }}>{slug}</span>…
      </div>
      <div style={{ width: 200, height: 2, background: "rgba(255,255,255,0.04)", borderRadius: 1, overflow: "hidden" }}>
        <div style={{ height: "100%", background: C.accent, borderRadius: 1, animation: "ws-loading 1.4s ease-in-out infinite", width: "40%" }} />
      </div>
      <style>{`
        @keyframes ws-loading {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(600%); }
        }
      `}</style>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────
function ErrorState({ message, slug }: { message: string; slug: string }) {
  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, gap: 12 }}>
      <div style={{ color: "#E85A5A", fontSize: 13, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600 }}>
        Could not load investigation
      </div>
      <div style={{ color: C.textDim, fontSize: 12, fontFamily: "'Inter',sans-serif", maxWidth: 360, textAlign: "center", lineHeight: 1.6 }}>
        {message}
      </div>
      <div style={{ color: C.textMuted, fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>slug: {slug}</div>
      <a href="/workspace-v2" style={{ color: C.accent, fontSize: 12, fontFamily: "'Inter',sans-serif", marginTop: 8 }}>
        ← Open mock demonstration
      </a>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ title }: { title: string }) {
  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, gap: 12 }}>
      <div style={{ color: C.textDim, fontSize: 13, fontFamily: "'Space Grotesk',sans-serif" }}>{title}</div>
      <div style={{ color: C.textMuted, fontSize: 12, fontFamily: "'Inter',sans-serif" }}>
        This investigation has no depth nodes, claims, or sources yet.
      </div>
      <a href="/workspace-v2" style={{ color: C.accent, fontSize: 12, fontFamily: "'Inter',sans-serif", marginTop: 8 }}>
        ← Open mock demonstration
      </a>
    </div>
  );
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────
async function fetchAll(slug: string): Promise<{
  hole: ApiHole;
  depthNodes: ApiDepthNode[];
  claims: ApiClaim[];
  sources: ApiSource[];
  media: ApiMedia[];
  people: ApiPerson[];
  relationships: ApiRelationship[];
}> {
  const [holeRes, depthRes, claimsRes, sourcesRes, mediaRes, peopleRes, relsRes] =
    await Promise.all([
      fetch(`/api/holes/${slug}`),
      fetch(`/api/holes/${slug}/depth-nodes`),
      fetch(`/api/holes/${slug}/claims`),
      fetch(`/api/holes/${slug}/sources`),
      fetch(`/api/holes/${slug}/media`),
      fetch(`/api/people`),
      fetch(`/api/relationships`),
    ]);

  if (!holeRes.ok) {
    const body = await holeRes.json().catch(() => ({}));
    throw new Error(
      holeRes.status === 404
        ? `Investigation "${slug}" not found or not published.`
        : (body as { message?: string }).message ?? `HTTP ${holeRes.status}`,
    );
  }

  const [hole, depthNodes, claims, sources, media, people, relationships] = await Promise.all([
    holeRes.json(),
    depthRes.ok ? depthRes.json() : Promise.resolve([]),
    claimsRes.ok ? claimsRes.json() : Promise.resolve([]),
    sourcesRes.ok ? sourcesRes.json() : Promise.resolve([]),
    mediaRes.ok ? mediaRes.json() : Promise.resolve([]),
    peopleRes.ok ? peopleRes.json() : Promise.resolve([]),
    relsRes.ok ? relsRes.json() : Promise.resolve([]),
  ]);

  return { hole, depthNodes, claims, sources, media, people, relationships };
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function WorkspaceReal() {
  const [, params] = useRoute("/workspace-v2/:slug");
  const slug = params?.slug ?? "";

  const [status, setStatus] = useState<"loading" | "error" | "empty" | "ready">("loading");
  const [error, setError] = useState("");
  const [data, setData] = useState<WorkspaceData | null>(null);

  useEffect(() => {
    if (!slug) return;
    setStatus("loading");
    fetchAll(slug)
      .then(({ hole, depthNodes, claims, sources, media, people, relationships }) => {
        const workspace = adaptHoleToWorkspace(
          hole, depthNodes, claims, sources, media, people, relationships,
        );
        if (workspace.nodes.length <= 1) {
          // Only the investigation node itself — nothing useful to display
          setStatus("empty");
          setData(workspace);
        } else {
          setData(workspace);
          setStatus("ready");
        }
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      });
  }, [slug]);

  if (status === "loading") return <Loading slug={slug} />;
  if (status === "error")   return <ErrorState message={error} slug={slug} />;
  if (status === "empty" && data)  return <EmptyState title={data.title} />;
  if (!data) return null;

  return (
    <WorkspaceLayout
      title={data.title}
      nodes={data.nodes}
      edges={data.edges}
      isReal={true}
    />
  );
}
