import React from "react";
import {
  User, Building2, Zap, FileText, MessageSquare,
  Shield, Layers, Link2,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
export const C = {
  bg:        "#08080D",
  surface:   "#0F0F18",
  surfaceEl: "#13131F",
  border:    "rgba(255,255,255,0.06)",
  borderHi:  "rgba(255,255,255,0.14)",
  accent:    "#6C63FF",
  accentDim: "rgba(108,99,255,0.18)",
  text:      "#DDDDF0",
  textDim:   "#6B6B8A",
  textMuted: "#3E3E58",
  // Node type palette: [bg, border, accent]
  person:        ["#0D1F35", "#1E4D7A", "#5BA3E8"] as [string, string, string],
  event:         ["#0D1F14", "#1E5C2E", "#4FC87A"] as [string, string, string],
  claim:         ["#1A0D30", "#4A1E7A", "#9B6EFF"] as [string, string, string],
  evidence:      ["#251500", "#6B3C00", "#E8923A"] as [string, string, string],
  org:           ["#200D0D", "#5C1A1A", "#E85A5A"] as [string, string, string],
  investigation: ["#120820", "#3A1060", "#C060FF"] as [string, string, string],
  section:       ["#081A20", "#104A58", "#30C0D8"] as [string, string, string],
  source:        ["#1A1500", "#4A3A00", "#D0A020"] as [string, string, string],
};

export type NodeKind =
  | "person"
  | "event"
  | "claim"
  | "evidence"
  | "org"
  | "investigation"
  | "section"
  | "source";

export interface WNode {
  id: string;
  kind: NodeKind;
  label: string;
  sub: string;        // role / date / type / position label
  desc: string;
  confidence?: number; // 0–100
  date?: string;
  tags?: string[];
  url?: string;       // for source nodes
  x: number;
  y: number;
}

export interface WEdge {
  source: string;
  target: string;
  label?: string;
}

export interface WorkspaceData {
  title: string;
  nodes: WNode[];
  edges: WEdge[];
}

// ─── Kind metadata: icon, palette, display label ──────────────────────────────
// JSX is not allowed in .ts files — use React.createElement so this file stays
// import-free from JSX. Components in .tsx files can use the shorthand directly.
export const KIND_META: Record<NodeKind, {
  icon: React.ReactElement;
  palette: [string, string, string];
  label: string;
}> = {
  person:        { icon: React.createElement(User,          { size: 10 }), palette: C.person,        label: "Person" },
  event:         { icon: React.createElement(Zap,           { size: 10 }), palette: C.event,         label: "Event" },
  claim:         { icon: React.createElement(MessageSquare, { size: 10 }), palette: C.claim,         label: "Claim" },
  evidence:      { icon: React.createElement(FileText,      { size: 10 }), palette: C.evidence,      label: "Evidence" },
  org:           { icon: React.createElement(Building2,     { size: 10 }), palette: C.org,           label: "Org" },
  investigation: { icon: React.createElement(Shield,        { size: 10 }), palette: C.investigation, label: "Investigation" },
  section:       { icon: React.createElement(Layers,        { size: 10 }), palette: C.section,       label: "Section" },
  source:        { icon: React.createElement(Link2,         { size: 10 }), palette: C.source,        label: "Source" },
};
