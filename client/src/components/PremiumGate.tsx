import React from "react";
import { Lock } from "lucide-react";
import { useLocation } from "wouter";

interface PremiumGateProps {
  /** Main heading shown on the gate */
  title?: string;
  /** Supporting description */
  description?: string;
  /** Label on the upgrade CTA */
  ctaLabel?: string;
  /** Called when the user clicks the CTA. Defaults to navigating to /pricing. */
  onUpgrade?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * PremiumGate — paywall overlay shown when premium content requires an upgrade.
 *
 * Replaces the inline premium walls in Watch.tsx and Replay.tsx. Can be used
 * both as a full-container overlay (position:absolute/fixed from parent) or
 * inline within a content section.
 */
export function PremiumGate({
  title = "Premium Content",
  description = "Upgrade your plan to access this content.",
  ctaLabel = "Upgrade to Pro",
  onUpgrade,
  className = "",
  style,
}: PremiumGateProps) {
  const [, navigate] = useLocation();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate("/pricing");
    }
  };

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--v2-space-4)",
        padding: "var(--v2-space-12) var(--v2-space-6)",
        background: "var(--v2-surface)",
        border: "1px solid var(--v2-border)",
        borderRadius: "var(--v2-radius-xl)",
        textAlign: "center",
        ...style,
      }}
      role="region"
      aria-label="Premium content gate"
    >
      {/* Lock icon */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "var(--v2-radius-xl)",
          background: "var(--v2-surface-el)",
          border: "1px solid var(--v2-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--v2-accent)",
        }}
      >
        <Lock size={20} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--v2-space-2)" }}>
        <h3
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--v2-text)",
            margin: 0,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "12px",
            color: "var(--v2-text-dim)",
            maxWidth: "320px",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {description}
        </p>
      </div>

      <button
        onClick={handleUpgrade}
        className="v2-focus-ring"
        style={{
          padding: "8px 20px",
          borderRadius: "var(--v2-radius-md)",
          border: "none",
          background: "var(--v2-accent)",
          color: "#fff",
          fontFamily: "'Inter', sans-serif",
          fontSize: "12px",
          fontWeight: 500,
          cursor: "pointer",
          transition: "opacity var(--v2-transition-micro)",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
      >
        {ctaLabel}
      </button>
    </div>
  );
}

export default PremiumGate;
