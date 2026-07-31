import React from "react";

export type BadgeVariant =
  | "verified"
  | "disputed"
  | "speculative"
  | "active"
  | "live"
  | "danger"
  | "default";

const VARIANT_STYLES: Record<
  BadgeVariant,
  { color: string; bg: string; border: string }
> = {
  verified:    { color: "var(--v2-status-verified)",    bg: "rgba(79,200,122,0.10)",  border: "rgba(79,200,122,0.25)"  },
  disputed:    { color: "var(--v2-status-disputed)",    bg: "rgba(232,146,58,0.10)",  border: "rgba(232,146,58,0.25)"  },
  speculative: { color: "var(--v2-status-speculative)", bg: "rgba(155,110,255,0.10)", border: "rgba(155,110,255,0.25)" },
  active:      { color: "var(--v2-status-active)",      bg: "rgba(91,163,232,0.10)",  border: "rgba(91,163,232,0.25)"  },
  live:        { color: "var(--v2-status-live)",        bg: "rgba(232,90,90,0.10)",   border: "rgba(232,90,90,0.25)"   },
  danger:      { color: "var(--v2-status-danger)",      bg: "rgba(232,90,90,0.10)",   border: "rgba(232,90,90,0.25)"   },
  default:     { color: "var(--v2-text-dim)",            bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.10)" },
};

interface MonoBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Icon rendered before the text label */
  icon?: React.ReactNode;
}

/**
 * MonoBadge — ALL CAPS mono-label badge used for statuses, types, and tags.
 *
 * Maps directly to the semantic status colour tokens (--v2-status-*).
 * Text is forced uppercase via CSS; pass lowercase labels for accessibility.
 */
export function MonoBadge({
  variant = "default",
  children,
  className = "",
  style,
  icon,
}: MonoBadgeProps) {
  const { color, bg, border } = VARIANT_STYLES[variant];
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 7px",
        borderRadius: "var(--v2-radius-sm)",
        border: `1px solid ${border}`,
        background: bg,
        color,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "9.5px",
        fontWeight: 500,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        lineHeight: 1.5,
        ...style,
      }}
      aria-label={typeof children === "string" ? children : undefined}
    >
      {icon && (
        <span style={{ display: "flex", alignItems: "center", lineHeight: 1 }}>
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}

export default MonoBadge;
