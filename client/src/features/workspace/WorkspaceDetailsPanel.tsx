import { useMemo } from "react";
import { X, Circle, ExternalLink, GitBranch } from "lucide-react";
import { C, KIND_META, type WNode, type WEdge } from "./workspace.types";

// ─── Confidence bar ───────────────────────────────────────────────────────────
export function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? "#4FC87A" : value >= 60 ? "#E8923A" : "#E85A5A";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.4s ease" }} />
      </div>
      <span style={{ color, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", minWidth: 32 }}>{value}%</span>
    </div>
  );
}

// ─── Right detail panel ───────────────────────────────────────────────────────
interface RightPanelProps {
  node: WNode | null;
  edges: WEdge[];
  nodeMap: Record<string, WNode>;
  onClose: () => void;
}

export function WorkspaceDetailsPanel({ node, edges, nodeMap, onClose }: RightPanelProps) {
  const meta = node ? KIND_META[node.kind] : null;
  const accent = meta ? meta.palette[2] : C.accent;

  const connected = useMemo(() => {
    if (!node) return [];
    return edges
      .filter(e => e.source === node.id || e.target === node.id)
      .map(e => {
        const otherId = e.source === node.id ? e.target : e.source;
        const other = nodeMap[otherId];
        const rel = e.source === node.id ? e.label : (e.label ? `← ${e.label}` : undefined);
        return other ? { node: other, rel } : null;
      })
      .filter((x): x is { node: WNode; rel: string | undefined } => x !== null);
  }, [node, edges, nodeMap]);

  return (
    <div style={{
      width: 300,
      minWidth: 300,
      borderLeft: `1px solid ${C.border}`,
      background: C.surface,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Header */}
      <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: C.textDim, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em", flex: 1 }}>
          {node ? `${meta!.label} Detail` : "Context"}
        </span>
        {node && (
          <button onClick={onClose} style={{ color: C.textDim, background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}>
            <X size={13} />
          </button>
        )}
      </div>

      {!node ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Circle size={16} color={C.textMuted} />
          </div>
          <p style={{ color: C.textDim, fontSize: 12, textAlign: "center", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 }}>
            Hover or click a node to inspect it
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Title block */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <div style={{ color: accent }}>{meta!.icon}</div>
              <span style={{ color: accent, fontSize: 9.5, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.07em" }}>{meta!.label}</span>
            </div>
            <h2 style={{ color: C.text, fontSize: 15, fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1.3, margin: 0 }}>
              {node.label}
            </h2>
            <p style={{ color: C.textDim, fontSize: 11, margin: "4px 0 0", fontFamily: "'Inter',sans-serif" }}>{node.sub}</p>
          </div>

          {/* Confidence */}
          {node.confidence !== undefined && (
            <div>
              <div style={{ color: C.textDim, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Confidence</div>
              <ConfidenceBar value={node.confidence} />
            </div>
          )}

          {/* Description */}
          <div>
            <div style={{ color: C.textDim, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Description</div>
            <p style={{ color: C.text, fontSize: 12, fontFamily: "'Inter',sans-serif", lineHeight: 1.7, margin: 0 }}>{node.desc}</p>
          </div>

          {/* URL (source nodes) */}
          {node.url && (
            <div>
              <div style={{ color: C.textDim, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Source URL</div>
              <a
                href={node.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: C.accent, fontSize: 11, fontFamily: "'Inter',sans-serif", wordBreak: "break-all", textDecoration: "none" }}
              >
                {node.url}
              </a>
            </div>
          )}

          {/* Tags */}
          {node.tags && node.tags.length > 0 && (
            <div>
              <div style={{ color: C.textDim, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Tags</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {node.tags.map(t => (
                  <span key={t} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 4, padding: "2px 7px", color: C.textDim, fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Date */}
          {node.date && (
            <div>
              <div style={{ color: C.textDim, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Date</div>
              <div style={{ color: C.text, fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>{node.date}</div>
            </div>
          )}

          {/* Connected nodes */}
          {connected.length > 0 && (
            <div>
              <div style={{ color: C.textDim, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Connections ({connected.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {connected.slice(0, 8).map(({ node: cn, rel }) => {
                  const cm = KIND_META[cn.kind];
                  return (
                    <div key={cn.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, borderRadius: 5 }}>
                      <div style={{ color: cm.palette[2], flexShrink: 0 }}>{cm.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: C.text, fontSize: 11, fontWeight: 500, fontFamily: "'Inter',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cn.label}</div>
                        {rel && <div style={{ color: C.textDim, fontSize: 9.5, fontFamily: "'Inter',sans-serif" }}>{rel}</div>}
                      </div>
                    </div>
                  );
                })}
                {connected.length > 8 && (
                  <div style={{ color: C.textDim, fontSize: 10, fontFamily: "'Inter',sans-serif", textAlign: "center", paddingTop: 4 }}>
                    +{connected.length - 8} more connections
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            <button style={{ padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 5, color: C.text, fontSize: 11, fontFamily: "'Inter',sans-serif", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <ExternalLink size={11} /> View Full Detail
            </button>
            <button style={{ padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 5, color: C.text, fontSize: 11, fontFamily: "'Inter',sans-serif", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <GitBranch size={11} /> Focus Subgraph
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
