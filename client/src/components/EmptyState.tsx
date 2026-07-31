import React from "react";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  /** Lucide icon element or any React node */
  icon?: React.ReactNode;
  /** Short primary message */
  message: string;
  /** Longer supporting description */
  description?: string;
  /** Optional primary action */
  action?: EmptyStateAction;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * EmptyState — vertically centred placeholder shown when a list or view has
 * no content to display.
 *
 * Always includes a message. Icon and description are optional.
 * Never show a raw "No results" string without using this component.
 */
export function EmptyState({
  icon,
  message,
  description,
  action,
  className = "",
  style,
}: EmptyStateProps) {
  return (
    <div
      className={className}
      role="status"
      aria-label={message}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--v2-space-2)",
        padding: "var(--v2-space-8) var(--v2-space-4)",
        textAlign: "center",
        ...style,
      }}
    >
      {icon && (
        <div
          style={{
            color: "var(--v2-text-muted)",
            lineHeight: 1,
            marginBottom: "var(--v2-space-1)",
          }}
        >
          {icon}
        </div>
      )}
      <p
        style={{
          color: "var(--v2-text-dim)",
          fontSize: "12px",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          margin: 0,
        }}
      >
        {message}
      </p>
      {description && (
        <p
          style={{
            color: "var(--v2-text-muted)",
            fontSize: "11px",
            fontFamily: "'Inter', sans-serif",
            maxWidth: "280px",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="v2-focus-ring"
          style={{
            marginTop: "var(--v2-space-2)",
            padding: "6px 14px",
            borderRadius: "var(--v2-radius-md)",
            border: "1px solid var(--v2-border-hi)",
            background: "var(--v2-surface-el)",
            color: "var(--v2-text)",
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            cursor: "pointer",
            transition: "border-color var(--v2-transition-micro), background var(--v2-transition-micro)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--v2-surface-el)";
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
