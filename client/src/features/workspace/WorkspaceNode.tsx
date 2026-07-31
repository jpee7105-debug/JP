import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { C, KIND_META, type WNode } from "./workspace.types";

// ─── Custom node component ────────────────────────────────────────────────────
const WNodeComponent = memo(({ data, selected }: NodeProps) => {
  const wn = data.wnode as WNode;
  const isHighlighted = data.isHighlighted as boolean;
  const isFaded = data.isFaded as boolean;
  const meta = KIND_META[wn.kind];
  const [bg, border, accent] = meta.palette;

  const opacity = isFaded ? 0.12 : 1;
  const scale = isHighlighted || selected ? 1.06 : 1;
  const borderColor = selected ? accent : isHighlighted ? accent + "88" : border;
  const glowColor = accent + "33";

  return (
    <div style={{
      opacity,
      transform: `scale(${scale})`,
      transition: "opacity 0.22s ease, transform 0.18s ease, box-shadow 0.22s ease",
      background: bg,
      border: `1px solid ${borderColor}`,
      borderRadius: 6,
      minWidth: 150,
      maxWidth: 190,
      padding: "7px 10px",
      boxShadow: (selected || isHighlighted)
        ? `0 0 18px ${glowColor}, 0 2px 8px rgba(0,0,0,0.6)`
        : "0 2px 6px rgba(0,0,0,0.5)",
      cursor: "pointer",
      position: "relative",
    }}>
      <Handle type="target" position={Position.Left}  style={{ background: accent, width: 5, height: 5, border: "none" }} />
      <Handle type="source" position={Position.Right} style={{ background: accent, width: 5, height: 5, border: "none" }} />

      {/* Type badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
        <div style={{ color: accent, lineHeight: 1 }}>{meta.icon}</div>
        <span style={{ color: accent, fontSize: 9, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.8 }}>
          {meta.label}
        </span>
        {wn.confidence !== undefined && (
          <span style={{ marginLeft: "auto", color: C.textDim, fontSize: 9, fontFamily: "'JetBrains Mono',monospace" }}>
            {wn.confidence}%
          </span>
        )}
      </div>

      {/* Label */}
      <div style={{ color: C.text, fontSize: 11, fontWeight: 600, lineHeight: 1.3, fontFamily: "'Space Grotesk',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {wn.label}
      </div>

      {/* Sub */}
      <div style={{ color: C.textDim, fontSize: 9.5, marginTop: 2, fontFamily: "'Inter',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {wn.sub}
      </div>

      {/* Selection indicator */}
      {selected && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accent}, transparent)`, borderRadius: "6px 6px 0 0" }} />
      )}
    </div>
  );
});
WNodeComponent.displayName = "WNodeComponent";

export const nodeTypes = { wnode: WNodeComponent };
export { WNodeComponent };
