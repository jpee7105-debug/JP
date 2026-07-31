import { useEffect, useRef } from "react";
import { Clock } from "lucide-react";
import { C, type WNode } from "./workspace.types";

interface WorkspaceTimelineProps {
  events: WNode[];
  title: string;
  selectedEventId: string | null;
  onSelect: (id: string) => void;
}

export function WorkspaceTimeline({ events, title, selectedEventId, onSelect }: WorkspaceTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedEventId && scrollRef.current) {
      const el = scrollRef.current.querySelector(`[data-id="${selectedEventId}"]`) as HTMLElement | null;
      el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [selectedEventId]);

  // Sort events chronologically by date or sub field
  const sorted = [...events].sort((a, b) => {
    const da = a.date ?? a.sub ?? "";
    const db = b.date ?? b.sub ?? "";
    return da.localeCompare(db);
  });

  // Determine date range label
  const dates = sorted.map(e => e.date ?? e.sub ?? "").filter(Boolean);
  const earliest = dates[0]?.slice(0, 4) ?? "";
  const latest   = dates[dates.length - 1]?.slice(0, 4) ?? "";
  const rangeLabel = earliest && latest && earliest !== latest
    ? `${earliest} – ${latest}`
    : earliest;

  if (sorted.length === 0) {
    return (
      <div style={{ borderTop: `1px solid ${C.border}`, background: C.surface, height: 46, display: "flex", alignItems: "center", paddingInline: 16, gap: 8 }}>
        <Clock size={12} color={C.textDim} />
        <span style={{ color: C.textMuted, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          No timeline events
        </span>
      </div>
    );
  }

  return (
    <div style={{ borderTop: `1px solid ${C.border}`, background: C.surface, height: 110, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderBottom: `1px solid ${C.border}` }}>
        <Clock size={12} color={C.textDim} />
        <span style={{ color: C.textDim, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Timeline · {title}
        </span>
        {rangeLabel && (
          <span style={{ marginLeft: "auto", color: C.textMuted, fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>
            {rangeLabel}
          </span>
        )}
      </div>

      {/* Scrollable events */}
      <div ref={scrollRef} style={{ flex: 1, display: "flex", alignItems: "center", gap: 0, overflowX: "auto", padding: "0 16px", scrollbarWidth: "none" }}>
        {sorted.map((ev, i) => {
          const isSelected = selectedEventId === ev.id;
          const year = (ev.date ?? ev.sub ?? "").slice(0, 4);
          const prevYear = i > 0 ? (sorted[i - 1].date ?? sorted[i - 1].sub ?? "").slice(0, 4) : null;
          const showYear = year !== prevYear;
          return (
            <div key={ev.id} data-id={ev.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, marginRight: 2 }}>
              {/* Year label */}
              <div style={{ height: 14, display: "flex", alignItems: "center" }}>
                {showYear && (
                  <span style={{ color: C.textMuted, fontSize: 9, fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap", paddingRight: 4 }}>
                    {year}
                  </span>
                )}
              </div>
              {/* Connector + dot */}
              <div style={{ display: "flex", alignItems: "center", width: "100%", position: "relative" }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <button
                  onClick={() => onSelect(ev.id)}
                  style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: isSelected ? C.accent : C.textMuted,
                    border: isSelected ? `2px solid ${C.accent}` : `1px solid ${C.borderHi}`,
                    cursor: "pointer",
                    transition: "background 0.2s, transform 0.15s",
                    transform: isSelected ? "scale(1.5)" : "scale(1)",
                    outline: "none",
                    boxShadow: isSelected ? `0 0 8px ${C.accent}88` : "none",
                  }}
                />
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>
              {/* Event label */}
              <button
                onClick={() => onSelect(ev.id)}
                style={{
                  maxWidth: 120, padding: "4px 6px", background: "transparent",
                  border: isSelected ? `1px solid ${C.accent}44` : "1px solid transparent",
                  borderRadius: 4, cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                }}
              >
                <div style={{ color: isSelected ? C.text : C.textDim, fontSize: 9.5, fontFamily: "'Inter',sans-serif", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110 }}>
                  {ev.label}
                </div>
                {(ev.date ?? ev.sub) && (
                  <div style={{ color: isSelected ? C.accent : C.textMuted, fontSize: 8.5, fontFamily: "'JetBrains Mono',monospace", marginTop: 1 }}>
                    {(ev.date ?? ev.sub ?? "").slice(5) || (ev.date ?? ev.sub ?? "").slice(0, 4)}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
