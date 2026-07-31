import React from "react";

interface CardProps {
  children: React.ReactNode;
  /** Adds hover border-brightening for clickable/interactive cards */
  interactive?: boolean;
  /** Extra class names */
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  /** Used for accessibility when the card is interactive */
  role?: string;
  tabIndex?: number;
  "aria-label"?: string;
}

/**
 * V2 Card — the standard surface container.
 *
 * Uses `--v2-surface` background, `--v2-border` border, and `--v2-radius-lg`
 * radius. When `interactive` is true, the border brightens on hover.
 */
export function Card({
  children,
  interactive = false,
  className = "",
  style,
  onClick,
  role,
  tabIndex,
  "aria-label": ariaLabel,
}: CardProps) {
  return (
    <div
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      onClick={onClick}
      className={[
        "v2-card",
        interactive ? "v2-card--interactive" : "",
        interactive ? "v2-focus-ring" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        background: "var(--v2-surface)",
        border: "1px solid var(--v2-border)",
        borderRadius: "var(--v2-radius-lg)",
        padding: "var(--v2-space-4)",
        transition: "border-color var(--v2-transition-micro)",
        cursor: interactive ? "pointer" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default Card;
