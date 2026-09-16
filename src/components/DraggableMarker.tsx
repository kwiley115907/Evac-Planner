"use client";

import { useRef } from "react";
import { MarkerIcon } from "./MarkerIcon";
import type { PlacedMarker } from "@/lib/plannerTypes";

interface DraggableMarkerProps {
  item: PlacedMarker;
  selected: boolean;
  dragging: boolean;
  scale: number;
  onSelect: () => void;
  onMove: (clientX: number, clientY: number) => void;
  onDragStateChange: (dragging: boolean) => void;
}

export function DraggableMarker({ item, selected, dragging, scale, onSelect, onMove, onDragStateChange }: DraggableMarkerProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ active: boolean; pointerId: number }>({ active: false, pointerId: -1 });

  function endDrag(e: React.PointerEvent<HTMLButtonElement>) {
    if (!drag.current.active || drag.current.pointerId !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    onDragStateChange(false);
    onMove(e.clientX, e.clientY);
    if (ref.current?.hasPointerCapture(e.pointerId)) ref.current.releasePointerCapture(e.pointerId);
    drag.current.active = false;
    drag.current.pointerId = -1;
  }

  return (
    <button
      ref={ref}
      type="button"
      data-marker="true"
      className={`marker marker--plain ${selected ? "selected" : ""} ${dragging ? "dragging" : ""}`}
      style={{ left: item.x, top: item.y }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect();
        drag.current.active = true;
        drag.current.pointerId = e.pointerId;
        ref.current?.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current.active || drag.current.pointerId !== e.pointerId) return;
        e.preventDefault();
        e.stopPropagation();
        onDragStateChange(true);
        onMove(e.clientX, e.clientY);
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <span className="marker-visual">
        <MarkerIcon type={item.type} scale={scale} variant="map" />
      </span>
      {item.label?.trim() ? <span className="marker-label">{item.label}</span> : null}
    </button>
  );
}
