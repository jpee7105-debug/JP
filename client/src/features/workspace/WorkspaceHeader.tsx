import { Search, User, Shield, ChevronDown } from "lucide-react";
import { C, KIND_META, type NodeKind } from "./workspace.types";

interface WorkspaceHeaderProps {
  title: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  nodeCounts: Partial<Record<NodeKind, number>>;
  isReal?: boolean;
}

const STAT_KINDS: NodeKind[] = ["person", "org", "event", "claim", "evidence", "source", "section", "investigation"];

export function WorkspaceHeader({ title, searchQuery, onSearchChange, nodeCounts, isReal = false }: WorkspaceHeaderProps) {
  return (
    <div style={{ height: 46, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", paddingInline: 14, gap: 16, flexShrink: 0, background: C.surface, zIndex: 10 }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div style={{ width: 22, height: 22, borderRadius: 5, background: `linear-gradient(135deg, ${C.accent}, #4039AA)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>R</span>
        </div>
        <span style={{ color: C.text, fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif", letterSpacing: "-0.01em" }}>
          Rabbit<span style={{ color: C.accent }}>Hole</span>
        </span>
        <span style={{ color: C.textMuted, fontSize: 11 }}>·</span>
        <span style={{ color: C.textDim, fontSize: 12, fontFamily: "'Space Grotesk',sans-serif" }}>
          Workspace <span style={{ color: C.textMuted }}>v2</span>
          {isReal && <span style={{ color: C.accent, marginLeft: 4, fontSize: 9 }}>LIVE</span>}
        </span>
      </div>

      {/* Board title */}
      <div style={{ height: "60%", width: 1, background: C.border }} />
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Shield size={12} color={C.accent} />
        <span style={{ color: C.text, fontSize: 12, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500 }}>
          {title}
        </span>
        <ChevronDown size={12} color={C.textDim} />
      </div>

      {/* Global search */}
      <div style={{ flex: 1, maxWidth: 340, position: "relative", marginInline: "auto" }}>
        <Search size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textDim }} />
        <input
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search nodes, claims, people…"
          style={{
            width: "100%", padding: "5px 10px 5px 30px",
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${C.border}`, borderRadius: 5,
            color: C.text, fontSize: 12, fontFamily: "'Inter',sans-serif", outline: "none",
          }}
        />
        <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 2 }}>
          <kbd style={{ color: C.textMuted, fontSize: 9, fontFamily: "'JetBrains Mono',monospace", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 3, padding: "1px 4px" }}>⌘</kbd>
          <kbd style={{ color: C.textMuted, fontSize: 9, fontFamily: "'JetBrains Mono',monospace", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 3, padding: "1px 4px" }}>K</kbd>
        </div>
      </div>

      {/* Stats chips — only show kinds with > 0 nodes */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {STAT_KINDS.filter(k => (nodeCounts[k] ?? 0) > 0).map(kind => (
          <div key={kind} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 4 }}>
            <span style={{ color: KIND_META[kind].palette[2] }}>{KIND_META[kind].icon}</span>
            <span style={{ color: C.textDim, fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>{nodeCounts[kind]}</span>
          </div>
        ))}
      </div>

      {/* View selector */}
      <div style={{ height: "60%", width: 1, background: C.border }} />
      <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
        {["Graph", "Timeline", "Matrix"].map(v => (
          <button key={v} style={{ padding: "4px 10px", background: v === "Graph" ? C.accentDim : "transparent", border: v === "Graph" ? `1px solid ${C.accent}44` : "1px solid transparent", borderRadius: 4, color: v === "Graph" ? C.accent : C.textDim, fontSize: 11, fontFamily: "'Inter',sans-serif", cursor: "pointer" }}>
            {v}
          </button>
        ))}
      </div>

      {/* User avatar */}
      <div style={{ height: "60%", width: 1, background: C.border }} />
      <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, #3A4A6B, #1E2E4A)", border: `1px solid ${C.borderHi}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
        <User size={12} color={C.textDim} />
      </div>
    </div>
  );
}
