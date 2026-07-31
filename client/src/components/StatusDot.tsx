import React from "react";

export type DotStatus = "live" | "active" | "inactive" | "pending" | "error";

const DOT_COLORS: Record<DotStatus, string> = {
  live:     "var(--v2-status-live)",
  active:   "var(--v2-status-verified)",
  inactive: "var(--v2-text-muted)",
  pending:  "var(--v2-status-disputed)",
  error:    "var(--v2-status-danger)",
};

interface StatusDotProps {
  status: DotStatus;
  /** Dot diameter in px. Default: 6 */
  size?: number;
  /** Show a pulsing ring for live/active statuses */
  pulse?: boolean;
  /** Accessible label — defaults to the status name */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * StatusDot — small circle indicator for live, active, inactive, pending,
 * and error states.
 *
 * The `pulse` prop adds a CSS ring animation (respects prefers-reduced-motion).
 * Use the `live` status for broadcasting; it automatically pulses.
 */
export function StatusDot({
  status,
  size = 6,
  pulse,
  label,
  className = "",
  style,
}: StatusDotProps) {
  const color = DOT_COLORS[status];
  const shouldPulse = pulse ?? status === "live";
  const ariaLabel = label ?? status;

  return (
    <span
      className={className}
      role="img"
      aria-label={ariaLabel}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Pulsing ring behind the dot */}
      {shouldPulse && (
        <span
          className="status-dot-ring"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `1px solid ${color}`,
            opacity: 0.6,
          }}
        />
      )}
      {/* Core dot */}
      <span
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
          display: "block",
        }}
      />
    </span>
  );
}

export default StatusDot;
