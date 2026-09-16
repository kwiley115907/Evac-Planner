"use client";

import { isElevator, MARKER_DEFS, type MarkerDef, type MarkerType } from "@/lib/planner-config";

function YouAreHereIcon({ scale, variant }: { scale: number; variant: "tool" | "map" }) {
  const main = variant === "map" ? Math.max(16, Math.round(22 * scale)) : Math.max(14, Math.round(20 * scale));
  const sub = variant === "map" ? Math.max(8, Math.round(10 * scale)) : Math.max(7, Math.round(9 * scale));
  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
        color: "#ca8a04",
        fontWeight: 800,
        textAlign: "center",
        minWidth: variant === "map" ? "auto" : "34px",
      }}
    >
      <span style={{ fontSize: `${main}px`, lineHeight: 1 }}>{"\u{1F9CD}"}</span>
      <span style={{ fontSize: `${sub}px`, lineHeight: 1.05 }}>YOU</span>
      <span style={{ fontSize: `${sub}px`, lineHeight: 1.05 }}>ARE</span>
      <span style={{ fontSize: `${sub}px`, lineHeight: 1.05 }}>HERE</span>
    </span>
  );
}

interface MarkerIconProps {
  type: MarkerType;
  scale: number;
  variant: "tool" | "map";
}

/** Renders the symbol for a marker type — the "You Are Here" figure, a
 * no-elevator circle-slash, the EXIT wordmark, or the marker's emoji. */
export function MarkerIcon({ type, scale, variant }: MarkerIconProps) {
  const def: MarkerDef = MARKER_DEFS[type];

  if (type === "room") return <YouAreHereIcon scale={scale} variant={variant} />;

  if (isElevator(type)) {
    const fontSize = variant === "map" ? Math.max(10, Math.round(13 * scale)) : Math.max(12, Math.round(16 * scale));
    return (
      <span
        className={variant === "map" ? "elevator-no-use-symbol marker-elevator-no-use-symbol" : "elevator-no-use-symbol"}
        style={{ color: def.color, fontSize: `${fontSize}px` }}
      >
        {def.short}
      </span>
    );
  }

  if (type === "exit") {
    const fontSize = variant === "map" ? Math.max(12, Math.round(15 * scale)) : Math.max(13, Math.round(16 * scale));
    return (
      <span
        className={variant === "map" ? "marker-symbol-only" : "tool-symbol"}
        style={{ color: def.color, fontSize: `${fontSize}px`, fontWeight: 900, letterSpacing: "0.06em", whiteSpace: "nowrap" }}
      >
        EXIT
      </span>
    );
  }

  const fontSize = variant === "map" ? Math.max(12, Math.round(22 * scale)) : Math.max(14, Math.round(24 * scale));
  return (
    <span
      className={variant === "map" ? "marker-symbol-only" : "tool-symbol"}
      style={{ color: def.color, whiteSpace: "nowrap", fontWeight: 900, lineHeight: 1, fontSize: `${fontSize}px` }}
    >
      {def.symbol}
    </span>
  );
}
