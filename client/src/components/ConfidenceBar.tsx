import React from "react";

interface ConfidenceBarProps {
  /** 0–100 */
  value: number;
  /** Show the numeric label to the right of the bar */
  showLabel?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function barColor(value: number): string {
  if (value >= 80) return "var(--v2-status-verified)";   /* #4FC87A — green */
  if (value >= 60) return "var(--v2-status-disputed)";   /* #E8923A — amber */
  return "var(--v2-status-danger)";                       /* #E85A5A — red   */
}

/**
 * ConfidenceBar — thin progress bar representing a 0–100 confidence value.
 *
 * Colour changes semantically: green ≥ 80%, amber 60–79%, red < 60%.
 * Extracted from WorkspaceDetailsPanel so pages can use it without the
 * full workspace import tree.
 */
export function ConfidenceBar({
  value,
  showLabel = false,
  className = "",
  style,
}: ConfidenceBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--v2-space-2)",
        ...style,
      }}
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Confidence ${clamped}%`}
    >
      {/* Track */}
      <div
        style={{
          flex: 1,
          height: 3,
          borderRadius: "var(--v2-radius-xs)",
          background: "var(--v2-border)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Fill */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${clamped}%`,
            borderRadius: "var(--v2-radius-xs)",
            background: barColor(clamped),
            transition: "width var(--v2-transition-fill)",
          }}
        />
      </div>
      {showLabel && (
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9.5px",
            color: barColor(clamped),
            minWidth: "28px",
            textAlign: "right",
          }}
        >
          {clamped}%
        </span>
      )}
    </div>
  );
}

export default ConfidenceBar;
