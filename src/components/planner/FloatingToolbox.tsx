"use client";

import { useEffect, useState } from "react";
import { MarkerIcon } from "@/components/MarkerIcon";
import { MARKER_DEFS, MARKER_TYPE_ORDER, type MarkerType, type PaintTool } from "@/lib/planner-config";
import { useDraggableFixed } from "@/lib/useDraggableFixed";

interface FloatingToolboxProps {
  activeTool: MarkerType;
  onActiveToolChange: (type: MarkerType) => void;
  showRoutes: boolean;
  onShowRoutesChange: (value: boolean) => void;
  paintMode: boolean;
  onPaintModeChange: (value: boolean) => void;
  brushSize: number;
  onBrushSizeChange: (value: number) => void;
  paintTool: PaintTool;
  onPaintToolChange: (value: PaintTool) => void;
  onFillAll: () => void;
  onClear: () => void;
  defaultPosition: { x: number; y: number };
}

export function FloatingToolbox({
  activeTool,
  onActiveToolChange,
  showRoutes,
  onShowRoutesChange,
  paintMode,
  onPaintModeChange,
  brushSize,
  onBrushSizeChange,
  paintTool,
  onPaintToolChange,
  onFillAll,
  onClear,
  defaultPosition,
}: FloatingToolboxProps) {
  const [closed, setClosed] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const { ref, position, setPosition, handlers } = useDraggableFixed(".floating-toolbox__header");

  useEffect(() => {
    setPosition(defaultPosition);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (closed) {
    return (
      <button type="button" className="floating-toolbox__restore no-print" data-html2canvas-ignore="true" onClick={() => setClosed(false)}>
        Tools
      </button>
    );
  }

  return (
    <div
      ref={ref}
      className={`floating-toolbox no-print ${minimized ? "minimized" : ""}`}
      data-html2canvas-ignore="true"
      style={{ left: position.x, top: position.y }}
      {...handlers}
    >
      <div className="floating-toolbox__header">
        <div className="floating-toolbox__title">
          <strong>Placement Tools</strong>
          <span>Hold here and drag</span>
        </div>
        <div className="floating-toolbox__controls">
          <button type="button" title={minimized ? "Expand" : "Minimize"} onClick={(e) => { e.stopPropagation(); setMinimized((v) => !v); }}>
            {minimized ? "▢" : "—"}
          </button>
          <button type="button" title="Close" onClick={(e) => { e.stopPropagation(); setClosed(true); }}>
            {"×"}
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="floating-toolbox__body">
          <div className="floating-toolbox__section">
            <strong className="floating-toolbox__section-title">Evacuation Route</strong>
            <label className="floating-toolbox__toggle">
              <span>Show Routes</span>
              <input type="checkbox" checked={showRoutes} onChange={(e) => onShowRoutesChange(e.target.checked)} />
            </label>
            <label className="floating-toolbox__toggle">
              <span>Routing Paint Mode</span>
              <input type="checkbox" checked={paintMode} onChange={(e) => onPaintModeChange(e.target.checked)} />
            </label>
            <div className="floating-toolbox__field">
              <label htmlFor="paintBrushSize">Brush Size</label>
              <input
                id="paintBrushSize"
                type="range"
                min="1"
                max="4"
                step="1"
                value={brushSize}
                onChange={(e) => onBrushSizeChange(Number(e.target.value))}
              />
            </div>
            <div className="floating-toolbox__paint-actions">
              <button type="button" className={paintTool === "walkable" ? "active" : ""} onClick={() => onPaintToolChange("walkable")}>
                Walkable
              </button>
              <button type="button" className={paintTool === "blocked" ? "active" : ""} onClick={() => onPaintToolChange("blocked")}>
                Blocked
              </button>
              <button type="button" className={paintTool === "erase" ? "active" : ""} onClick={() => onPaintToolChange("erase")}>
                Erase
              </button>
            </div>
            <div className="floating-toolbox__paint-actions floating-toolbox__paint-actions--two">
              <button type="button" onClick={onFillAll}>Fill All</button>
              <button type="button" onClick={onClear}>Clear</button>
            </div>
          </div>

          <div className="floating-toolbox__section">
            <strong className="floating-toolbox__section-title">Placement Tools</strong>
            <div className="floating-toolbox__list">
              {MARKER_TYPE_ORDER.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`floating-toolbox__btn ${activeTool === type ? "active" : ""}`}
                  onClick={() => onActiveToolChange(type)}
                >
                  <span className="floating-toolbox__icon">
                    <MarkerIcon type={type} scale={0.9} variant="map" />
                  </span>
                  <span className="floating-toolbox__label">{MARKER_DEFS[type].label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
