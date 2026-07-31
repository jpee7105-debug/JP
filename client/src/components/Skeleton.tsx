import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  /** Border radius. Defaults to --v2-radius-sm (4px). Pass "full" for circles. */
  radius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Skeleton — shimmer placeholder for loading states.
 *
 * Uses the `.v2-skeleton` CSS class (defined in index.css) for the shimmer
 * animation so the effect respects `prefers-reduced-motion`.
 */
export function Skeleton({
  width,
  height = 16,
  radius,
  className = "",
  style,
}: SkeletonProps) {
  const r =
    radius === "full"
      ? "50%"
      : radius !== undefined
      ? typeof radius === "number"
        ? `${radius}px`
        : radius
      : "var(--v2-radius-sm)";

  return (
    <div
      className={["v2-skeleton", className].filter(Boolean).join(" ")}
      style={{
        width: typeof width === "number" ? `${width}px` : width ?? "100%",
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: r,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

/** Convenience wrapper that stacks multiple skeletons with a gap */
export function SkeletonGroup({
  children,
  gap = 8,
}: {
  children: React.ReactNode;
  gap?: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {children}
    </div>
  );
}

export default Skeleton;
