import {
  LayoutGrid, GitBranch, Clock, Users, MessageSquare,
  Link2, Building2, Map, FileText, Image, Cpu, Settings, ChevronLeft, ChevronRight,
} from "lucide-react";
import { C, type NodeKind } from "./workspace.types";

export const SIDEBAR_ITEMS: { id: string; icon: React.ReactElement; label: string; filterKind?: NodeKind }[] = [
  { id: "overview",  icon: <LayoutGrid size={15} />,    label: "Overview" },
  { id: "graph",     icon: <GitBranch size={15} />,     label: "Graph" },
  { id: "timeline",  icon: <Clock size={15} />,         label: "Timeline" },
  { id: "people",    icon: <Users size={15} />,         label: "People",        filterKind: "person" },
  { id: "claims",    icon: <MessageSquare size={15} />, label: "Claims",        filterKind: "claim" },
  { id: "evidence",  icon: <FileText size={15} />,      label: "Evidence",      filterKind: "evidence" },
  { id: "sources",   icon: <Link2 size={15} />,         label: "Sources",       filterKind: "source" },
  { id: "orgs",      icon: <Building2 size={15} />,     label: "Organizations", filterKind: "org" },
  { id: "locations", icon: <Map size={15} />,           label: "Locations" },
  { id: "files",     icon: <FileText size={15} />,      label: "Files" },
  { id: "images",    icon: <Image size={15} />,         label: "Images" },
  { id: "ai",        icon: <Cpu size={15} />,           label: "AI" },
  { id: "settings",  icon: <Settings size={15} />,      label: "Settings" },
];

interface WorkspaceSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeSection: string;
  setActiveSection: (id: string) => void;
  nodeCounts: Record<string, number>;
}

export function WorkspaceSidebar({
  sidebarOpen,
  setSidebarOpen,
  activeSection,
  setActiveSection,
  nodeCounts,
}: WorkspaceSidebarProps) {
  const sidebarW = sidebarOpen ? 220 : 44;
  const total = Object.values(nodeCounts).reduce((a, b) => a + b, 0);
  const edgeCount = nodeCounts["_edges"] ?? 0;

  return (
    <div style={{ width: sidebarW, minWidth: sidebarW, borderRight: `1px solid ${C.border}`, background: C.surface, display: "flex", flexDirection: "column", transition: "width 0.22s ease, min-width 0.22s ease", overflow: "hidden", flexShrink: 0, zIndex: 5 }}>
      {/* Toggle */}
      <div style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: sidebarOpen ? "flex-end" : "center" }}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 4, padding: "4px 6px", color: C.textDim, cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          {sidebarOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
        </button>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "6px 0", scrollbarWidth: "none" }}>
        {SIDEBAR_ITEMS.map(item => {
          const isActive = activeSection === item.id;
          const count = item.filterKind ? nodeCounts[item.filterKind] : undefined;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              title={!sidebarOpen ? item.label : undefined}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: sidebarOpen ? "8px 14px" : "8px 0",
                justifyContent: sidebarOpen ? "flex-start" : "center",
                background: isActive ? C.accentDim : "transparent",
                border: "none",
                borderLeft: isActive ? `2px solid ${C.accent}` : "2px solid transparent",
                cursor: "pointer",
                color: isActive ? C.accent : C.textDim,
                fontSize: 12, fontFamily: "'Inter',sans-serif", fontWeight: isActive ? 500 : 400,
                transition: "background 0.15s, color 0.15s", whiteSpace: "nowrap",
              }}
            >
              <div style={{ flexShrink: 0, marginLeft: sidebarOpen ? 0 : 2 }}>{item.icon}</div>
              {sidebarOpen && (
                <>
                  <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                  {count !== undefined && count > 0 && (
                    <span style={{ color: C.textMuted, fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>{count}</span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer stats */}
      {sidebarOpen && (
        <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ color: C.textMuted, fontSize: 9.5, fontFamily: "'JetBrains Mono',monospace", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Network</div>
          <div style={{ color: C.textDim, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.8 }}>
            <div>{total - (nodeCounts["_edges"] ?? 0)} nodes</div>
            <div>{edgeCount} edges</div>
          </div>
        </div>
      )}
    </div>
  );
}
