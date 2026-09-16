"use client";

import { useEffect } from "react";
import { MARKER_DEFS } from "@/lib/planner-config";
import { useDraggableFixed } from "@/lib/useDraggableFixed";
import type { PlacedMarker } from "@/lib/plannerTypes";

interface FloatingDeleteBoxProps {
  selectedItem: PlacedMarker | null;
  onDelete: () => void;
  defaultPosition: { x: number; y: number };
}

export function FloatingDeleteBox({ selectedItem, onDelete, defaultPosition }: FloatingDeleteBoxProps) {
  const { ref, position, setPosition, handlers } = useDraggableFixed(".floating-delete-box__header");

  useEffect(() => {
    setPosition(defaultPosition);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      className="floating-delete-box no-print"
      data-html2canvas-ignore="true"
      style={{ left: position.x, top: position.y, right: "auto", bottom: "auto" }}
      {...handlers}
    >
      <div className="floating-delete-box__header">
        <strong>Selected Tool</strong>
        <span>Hold here and drag</span>
      </div>
      <div className="floating-delete-box__meta">
        <strong>{selectedItem ? MARKER_DEFS[selectedItem.type].label : "No tool selected"}</strong>
        <span>Tap a placed marker to select it</span>
      </div>
      <button type="button" onClick={onDelete} disabled={!selectedItem}>
        Delete Selected
      </button>
    </div>
  );
}
