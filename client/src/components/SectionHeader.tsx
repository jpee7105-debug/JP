import React from "react";

interface SectionHeaderProps {
  /** Section label — rendered in uppercase mono */
  label: string;
  /** Optional count shown after the label */
  count?: number;
  /** Optional action element rendered on the right */
  action?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * SectionHeader — consistent heading for list sections, panel areas, and
 * sidebar categories.
 *
 * Label is ALL CAPS in JetBrains Mono. Count is dimmed. Action floats right.
 */
export function SectionHeader({
  label,
  count,
  action,
  className = "",
  style,
}: SectionHeaderProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--v2-space-2)",
        paddingBottom: "var(--v2-space-2)",
        borderBottom: "1px solid var(--v2-border)",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--v2-space-2)" }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9.5px",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--v2-text-dim)",
          }}
        >
          {label}
        </span>
        {count !== undefined && (
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "9.5px",
              color: "var(--v2-text-muted)",
            }}
          >
            {count}
          </span>
        )}
      </div>
      {action && (
        <div style={{ display: "flex", alignItems: "center" }}>{action}</div>
      )}
    </div>
  );
}

export default SectionHeader;
