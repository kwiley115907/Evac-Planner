"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AiChatDrawer } from "@/components/AiChatDrawer";
import { DraggableMarker } from "@/components/DraggableMarker";
import { MarkerIcon } from "@/components/MarkerIcon";
import type { AiAction } from "@/lib/aiClient";
import { clamp, readFileAsDataUrl } from "@/lib/fileUtils";
import { pdfFileToImageDataUrl } from "@/lib/pdfToImage";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_LOGO_DATA_URL,
  FLOOR_OPTIONS,
  LOGO_POSITIONS,
  MARKER_DEFS,
  MARKER_TYPE_ORDER,
  PAINT_TOOLS,
  paintToolColor,
  type MarkerType,
  type PaintTool,
} from "@/lib/planner-config";
import { isMarkerType, newMarkerId, type PlacedMarker, type PlanData } from "@/lib/plannerTypes";
import { computeRoutes, createEmptyGrid, pixelToCell, type GridMap } from "@/lib/routing";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { FloatingDeleteBox } from "./FloatingDeleteBox";
import { FloatingToolbox } from "./FloatingToolbox";
import { PrintSheet } from "./PrintSheet";

declare global {
  interface Window {
    html2canvas?: unknown;
  }
}

function logoPresetPosition(position: string): { x: number; y: number } {
  const centerX = 470;
  switch (position) {
    case "bottom-left":
      return { x: 20, y: 580 };
    case "top-center":
      return { x: centerX, y: 20 };
    case "bottom-center":
      return { x: centerX, y: 580 };
    case "top-right":
      return { x: 920, y: 20 };
    case "bottom-right":
      return { x: 920, y: 580 };
    case "top-left":
    default:
      return { x: 20, y: 20 };
  }
}

export function PlannerApp() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const toolboxAnchorRef = useRef<HTMLDivElement>(null);

  const [plannerTitle, setPlannerTitle] = useState("Evacuation Planner");
  const [facilityName, setFacilityName] = useState("Main Office / Facility");
  const [floorName, setFloorName] = useState("Ground Floor");
  const [preparedBy, setPreparedBy] = useState("");
  const [approvedBy, setApprovedBy] = useState("");

  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO_DATA_URL);
  const [manualLogoPlacement, setManualLogoPlacement] = useState(false);
  const [logoPosition, setLogoPosition] = useState("top-left");
  const [showLogoOverFloorplan, setShowLogoOverFloorplan] = useState(true);
  const [logoOpacity, setLogoOpacity] = useState(0.22);
  const [logoCanvasPosition, setLogoCanvasPosition] = useState(logoPresetPosition("top-left"));
  const [logoDragging, setLogoDragging] = useState(false);

  const [floorplanOpacity, setFloorplanOpacity] = useState(0.45);
  const [markerScale, setMarkerScale] = useState(1);
  const [nudgeStep, setNudgeStep] = useState(0.5);

  const [floorplan, setFloorplan] = useState<PlanData["floorplan"]>(null);
  const [items, setItems] = useState<PlacedMarker[]>([]);
  const [activeTool, setActiveTool] = useState<MarkerType>("room");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showRoutes, setShowRoutes] = useState(true);

  const [paintMode, setPaintMode] = useState(false);
  const [paintTool, setPaintTool] = useState<PaintTool>("walkable");
  const [brushSize, setBrushSize] = useState(1);
  const [isPainting, setIsPainting] = useState(false);
  const [gridMap, setGridMap] = useState<GridMap>(() => createEmptyGrid());

  const [printPreviewImage, setPrintPreviewImage] = useState<string | null>(null);
  const [toolboxDefaultPos, setToolboxDefaultPos] = useState({ x: 16, y: 120 });
  const [deleteBoxDefaultPos, setDeleteBoxDefaultPos] = useState({ x: 16, y: 260 });

  const supabase = useMemo(() => getSupabaseClient(), []);
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get("id");

  const [ready, setReady] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedItem = useMemo(() => items.find((i) => i.id === selectedId) ?? null, [items, selectedId]);

  const routes = useMemo(() => (showRoutes ? computeRoutes(items, gridMap) : []), [items, gridMap, showRoutes]);

  const planSnapshot = useMemo<PlanData>(
    () => ({
      plannerTitle,
      facilityName,
      floorName,
      preparedBy,
      approvedBy,
      logoUrl,
      manualLogoPlacement,
      logoPosition,
      showLogoOverFloorplan,
      logoOpacity,
      floorplanOpacity,
      logoCanvasPosition,
      markerScale,
      floorplan,
      showRoutes,
      paintMode,
      paintTool,
      gridMap,
      items,
    }),
    [
      plannerTitle,
      facilityName,
      floorName,
      preparedBy,
      approvedBy,
      logoUrl,
      manualLogoPlacement,
      logoPosition,
      showLogoOverFloorplan,
      logoOpacity,
      floorplanOpacity,
      logoCanvasPosition,
      markerScale,
      floorplan,
      showRoutes,
      paintMode,
      paintTool,
      gridMap,
      items,
    ]
  );

  // ---------- coordinate helpers ----------

  const clientToCanvasPoint = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 6, y: 6 };
    return {
      x: clamp(clientX - rect.left, 6, CANVAS_WIDTH - 6),
      y: clamp(clientY - rect.top, 6, CANVAS_HEIGHT - 6),
    };
  }, []);

  const clientToGridCell = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return pixelToCell(0, 0);
    return pixelToCell(clamp(clientX - rect.left, 0, CANVAS_WIDTH - 1), clamp(clientY - rect.top, 0, CANVAS_HEIGHT - 1));
  }, []);

  const paintDisk = useCallback(
    (row: number, col: number) => {
      setGridMap((prev) => {
        const next = prev.map((r) => [...r]);
        const radius = Math.max(0, brushSize - 1);
        for (let r = row - radius; r <= row + radius; r += 1) {
          for (let c = col - radius; c <= col + radius; c += 1) {
            if (r < 0 || r >= next.length || c < 0 || c >= next[0].length) continue;
            if (Math.hypot(c - col, r - row) > radius + 0.35) continue;
            next[r][c] = paintTool === "erase" ? "unpainted" : paintTool;
          }
        }
        return next;
      });
    },
    [brushSize, paintTool]
  );

  // ---------- load plan from Supabase ----------

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      if (!planId) {
        router.push("/dashboard");
        return;
      }
      const { data, error } = await supabase.from("plans").select("data, title").eq("id", planId).single();
      if (cancelled) return;
      if (error || !data?.data) {
        setNotFound(true);
        setReady(true);
        return;
      }
      const p = data.data as Partial<PlanData>;
      setPlannerTitle(p.plannerTitle ?? "Evacuation Planner");
      setFacilityName(p.facilityName ?? "Main Office / Facility");
      setFloorName(p.floorName ?? "Ground Floor");
      setPreparedBy(p.preparedBy ?? "");
      setApprovedBy(p.approvedBy ?? "");
      setLogoUrl(p.logoUrl ?? DEFAULT_LOGO_DATA_URL);
      setManualLogoPlacement(!!p.manualLogoPlacement);
      setLogoPosition(p.logoPosition ?? "top-left");
      setShowLogoOverFloorplan(p.showLogoOverFloorplan !== false);
      setLogoOpacity(typeof p.logoOpacity === "number" ? p.logoOpacity : 0.22);
      setFloorplanOpacity(typeof p.floorplanOpacity === "number" ? p.floorplanOpacity : 0.45);
      setLogoCanvasPosition(p.logoCanvasPosition ?? logoPresetPosition(p.logoPosition ?? "top-left"));
      setMarkerScale(typeof p.markerScale === "number" ? p.markerScale : 1);
      setFloorplan(p.floorplan ?? null);
      setItems(Array.isArray(p.items) ? p.items.filter((i) => i && isMarkerType(i.type)) : []);
      setShowRoutes(p.showRoutes !== false);
      setPaintMode(!!p.paintMode);
      setPaintTool((p.paintTool as PaintTool) ?? "walkable");
      setGridMap(Array.isArray(p.gridMap) ? p.gridMap : createEmptyGrid());
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  // ---------- autosave ----------

  useEffect(() => {
    if (!ready || !planId) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSaveStatus("error");
        return;
      }
      setSaveStatus("saving");
      const { error } = await supabase
        .from("plans")
        .upsert({ id: planId, user_id: user.id, title: plannerTitle || "Untitled plan", data: planSnapshot, updated_at: new Date().toISOString() }, { onConflict: "id" });
      setSaveStatus(error ? "error" : "saved");
    }, 1200);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, planId, planSnapshot]);

  // ---------- toolbox/delete-box initial placement ----------

  useEffect(() => {
    function place() {
      const w = window.innerWidth;
      setToolboxDefaultPos({ x: Math.max(16, w - 240 - 16), y: 120 });
      setDeleteBoxDefaultPos({ x: Math.max(16, w - 280 - 16), y: 420 });
    }
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, []);

  function handlePaintModeChange(value: boolean) {
    setPaintMode(value);
    if (value) setSelectedId(null);
  }

  // ---------- files ----------

  async function handleLogoFile(file: File | null) {
    if (!file) return;
    try {
      setLogoUrl(await readFileAsDataUrl(file));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Unable to load logo.");
    }
  }

  async function handleFloorplanFile(file: File | null) {
    if (!file) return;
    const lower = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || lower.endsWith(".pdf");
    const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp)$/.test(lower);
    if (!isPdf && !isImage) {
      window.alert("Please upload a PDF, PNG, JPG, JPEG, or WEBP file.");
      return;
    }
    try {
      const src = isPdf ? await pdfFileToImageDataUrl(file) : await readFileAsDataUrl(file);
      setFloorplan({ kind: "image", src, name: file.name });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Unable to load floorplan.");
    }
  }

  async function handleImportJson(file: File | null) {
    if (!file) return;
    try {
      const text = await file.text();
      const p = JSON.parse(text) as Partial<PlanData>;
      setPlannerTitle(p.plannerTitle || "Evacuation Planner");
      setFacilityName(p.facilityName || "Main Office / Facility");
      setFloorName(FLOOR_OPTIONS.includes(p.floorName ?? "") ? (p.floorName as string) : "Ground Floor");
      setPreparedBy(typeof p.preparedBy === "string" ? p.preparedBy : "");
      setApprovedBy(typeof p.approvedBy === "string" ? p.approvedBy : "");
      const position = LOGO_POSITIONS.some((o) => o.value === p.logoPosition) ? (p.logoPosition as string) : "top-left";
      const manual = !!p.manualLogoPlacement;
      setLogoUrl(p.logoUrl || DEFAULT_LOGO_DATA_URL);
      setManualLogoPlacement(manual);
      setLogoPosition(position);
      setShowLogoOverFloorplan(p.showLogoOverFloorplan !== false);
      setLogoOpacity(typeof p.logoOpacity === "number" ? clamp(p.logoOpacity, 0, 1) : 0.22);
      setFloorplanOpacity(typeof p.floorplanOpacity === "number" ? clamp(p.floorplanOpacity, 0, 1) : 0.45);
      setLogoCanvasPosition(p.logoCanvasPosition ?? logoPresetPosition(position));
      setMarkerScale(typeof p.markerScale === "number" ? clamp(p.markerScale, 0.2, 1.5) : 1);
      setFloorplan(p.floorplan ?? null);
      setShowRoutes(p.showRoutes !== false);
      setPaintMode(!!p.paintMode);
      setPaintTool(PAINT_TOOLS.some((t) => t.value === p.paintTool) ? (p.paintTool as PaintTool) : "walkable");
      setGridMap(Array.isArray(p.gridMap) ? p.gridMap : createEmptyGrid());
      setItems(Array.isArray(p.items) ? p.items.filter((i) => i && typeof i.id === "string" && isMarkerType(i.type)).map((i) => ({ ...i, label: i.label ?? "" })) : []);
      setSelectedId(null);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Unable to import planner JSON.");
    }
  }

  function handleExportJson() {
    const blob = new Blob([JSON.stringify(planSnapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${plannerTitle.toLowerCase().replace(/\s+/g, "-")}-plan.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handlePrint() {
    if (!canvasRef.current) {
      window.print();
      return;
    }
    const html2canvas = (await import("html2canvas")).default;
    const el = canvasRef.current;
    const shot = await html2canvas(el, {
      backgroundColor: "#ffffff",
      scale: Math.max(2, window.devicePixelRatio || 1),
      useCORS: true,
      logging: false,
      width: el.scrollWidth,
      height: el.scrollHeight,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
    });
    setPrintPreviewImage(shot.toDataURL("image/png", 1));
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    window.print();
  }

  // ---------- marker actions ----------

  function addMarker(type: MarkerType, x: number, y: number, label = "") {
    const marker: PlacedMarker = { id: newMarkerId(), type, x: clamp(x, 6, CANVAS_WIDTH - 6), y: clamp(y, 6, CANVAS_HEIGHT - 6), label };
    setItems((prev) => [...prev, marker]);
    setSelectedId(marker.id);
  }

  function moveMarker(id: string, clientX: number, clientY: number) {
    const { x, y } = clientToCanvasPoint(clientX, clientY);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, x, y } : i)));
  }

  function nudgeSelected(dx: number, dy: number) {
    if (!selectedId) return;
    setItems((prev) => prev.map((i) => (i.id !== selectedId ? i : { ...i, x: clamp(i.x + dx, 6, CANVAS_WIDTH - 6), y: clamp(i.y + dy, 6, CANVAS_HEIGHT - 6) })));
  }

  function deleteSelected() {
    if (!selectedId) return;
    setItems((prev) => prev.filter((i) => i.id !== selectedId));
    setSelectedId(null);
  }

  function fillAllWalkable() {
    setGridMap((prev) => prev.map((row) => row.map(() => "walkable")));
  }

  function clearGrid() {
    setGridMap(createEmptyGrid());
  }

  // ---------- AI Smart Route actions ----------

  function applyAiActions(actions: AiAction[]) {
    for (const action of actions) {
      if (action.action === "add_marker") {
        addMarker(action.type, action.x, action.y, action.label ?? "");
      } else if (action.action === "remove_marker") {
        setItems((prev) => prev.filter((i) => i.id !== action.id));
      } else if (action.action === "paint_rect") {
        const startCell = pixelToCell(Math.min(action.x1, action.x2), Math.min(action.y1, action.y2));
        const endCell = pixelToCell(Math.max(action.x1, action.x2), Math.max(action.y1, action.y2));
        setGridMap((prev) => {
          const next = prev.map((r) => [...r]);
          for (let r = startCell.row; r <= endCell.row; r += 1) {
            for (let c = startCell.col; c <= endCell.col; c += 1) {
              if (r < 0 || r >= next.length || c < 0 || c >= next[0].length) continue;
              next[r][c] = action.tool === "erase" ? "unpainted" : action.tool;
            }
          }
          return next;
        });
      }
    }
  }

  // ---------- canvas pointer handling ----------

  function onCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (paintMode) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-marker='true']") || target.closest("[data-logo='true']")) return;
    const { x, y } = clientToCanvasPoint(e.clientX, e.clientY);
    addMarker(activeTool, x, y);
  }

  function onCanvasPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!paintMode) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-marker='true']") || target.closest("[data-logo='true']")) return;
    const { row, col } = clientToGridCell(e.clientX, e.clientY);
    paintDisk(row, col);
    setIsPainting(true);
  }

  function onCanvasPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!paintMode || !isPainting) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-marker='true']") || target.closest("[data-logo='true']")) return;
    const { row, col } = clientToGridCell(e.clientX, e.clientY);
    paintDisk(row, col);
  }

  function stopPainting() {
    setIsPainting(false);
  }

  // ---------- logo drag ----------

  const logoDrag = useRef({ active: false, pointerId: -1 });

  function onLogoPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!manualLogoPlacement) return;
    e.preventDefault();
    e.stopPropagation();
    logoDrag.current = { active: true, pointerId: e.pointerId };
    (e.target as Element).setPointerCapture(e.pointerId);
    setLogoDragging(true);
  }

  function onLogoPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!logoDrag.current.active || logoDrag.current.pointerId !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    const { x, y } = clientToCanvasPoint(e.clientX, e.clientY);
    setLogoCanvasPosition({ x: clamp(x - 60, 0, CANVAS_WIDTH - 120), y: clamp(y - 40, 0, CANVAS_HEIGHT - 80) });
  }

  function onLogoPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (logoDrag.current.pointerId !== e.pointerId) return;
    logoDrag.current = { active: false, pointerId: -1 };
    setLogoDragging(false);
  }

  if (!ready) {
    return (
      <main className="app-shell">
        <div className="container">
          <p style={{ padding: 24 }}>Loading planner...</p>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="app-shell">
        <div className="container">
          <section className="panel header">
            <h1>Plan not found</h1>
            <p>This plan doesn&apos;t exist or you don&apos;t have access to it.</p>
            <div className="actions">
              <button type="button" className="primary" onClick={() => router.push("/dashboard")}>Back to Dashboard</button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="container">
        <section className="panel header">
          <div className="header-grid">
            <div>
              <h1>{plannerTitle}</h1>
              <p>
                Upload a floorplan, place exits, assembly points, extinguishers, pull alarm stations, elevators, rooms, and
                other safety assets. Paint the routing layer so exit paths follow walkable corridors instead of cutting
                across balconies or blocked areas.
              </p>
            </div>
            <div className="fields">
              <div className="field">
                <label htmlFor="plannerTitle">Planner Title</label>
                <input id="plannerTitle" value={plannerTitle} onChange={(e) => setPlannerTitle(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="facilityName">Facility Name</label>
                <input id="facilityName" value={facilityName} onChange={(e) => setFacilityName(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="floorName">Floor / Area</label>
                <select id="floorName" value={floorName} onChange={(e) => setFloorName(e.target.value)}>
                  {FLOOR_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="status">Planner Status</label>
                <input
                  id="status"
                  readOnly
                  value={`Markers: ${items.length} • Routes: ${routes.length} • Paint mode: ${paintMode ? "On" : "Off"} • ${saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Save error" : ""}`}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="layout">
          <aside className="panel sidebar">
            <div className="section">
              <h2>Placement Tools</h2>
              <p>All tools are always available.</p>
              <div className="tool-list">
                {MARKER_TYPE_ORDER.map((type) => (
                  <button key={type} type="button" className={`tool-btn ${activeTool === type ? "active" : ""}`} onClick={() => setActiveTool(type)}>
                    <MarkerIcon type={type} scale={markerScale} variant="tool" />
                    <span className="meta">
                      <strong>{MARKER_DEFS[type].label}</strong>
                      <span>{MARKER_DEFS[type].description}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="section">
              <h3>Routing Paint Tools</h3>
              <p>Mark real walkable corridors in green. Mark blocked areas and balconies so routes avoid them.</p>
              <label className="toggle">
                <span className="meta">
                  <strong>Routing Paint Mode</strong>
                  <span>While on, clicking and dragging paints the routing grid instead of placing markers.</span>
                </span>
                <input type="checkbox" checked={paintMode} onChange={(e) => handlePaintModeChange(e.target.checked)} />
              </label>
              <div className="tool-list compact">
                {PAINT_TOOLS.map((t) => (
                  <button key={t.value} type="button" className={`tool-btn ${paintTool === t.value ? "active" : ""}`} onClick={() => setPaintTool(t.value)}>
                    <span className="swatch" style={{ background: t.color, color: "#0f172a", width: 44, height: 44, fontSize: 12 }}>
                      {t.swatch}
                    </span>
                    <span className="meta">
                      <strong>{t.label}</strong>
                      <span>{t.description}</span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="actions">
                <button type="button" onClick={fillAllWalkable}>Fill All Walkable</button>
                <button type="button" onClick={clearGrid}>Clear Routing Layer</button>
              </div>
            </div>

            <div className="section">
              <h3>Appearance</h3>
              <div className="field">
                <label htmlFor="floorplanOpacity">Floorplan Opacity ({Math.round(floorplanOpacity * 100)}%)</label>
                <input id="floorplanOpacity" type="range" min="0" max="1" step="0.05" value={floorplanOpacity} onChange={(e) => setFloorplanOpacity(Number(e.target.value))} />
              </div>
              <div className="field">
                <label htmlFor="markerScale">Placement Tool Size ({Math.round(markerScale * 100)}%)</label>
                <input id="markerScale" type="range" min="0.2" max="1.5" step="0.05" value={markerScale} onChange={(e) => setMarkerScale(Number(e.target.value))} />
              </div>
              <p>Tip: drag markers on the planner canvas for exact placement.</p>
            </div>

            <div className="section">
              <h3>Company Logo Placement</h3>
              <label className="toggle">
                <span className="meta">
                  <strong>Show Logo On Floorplan</strong>
                  <span>Overlays your uploaded logo on the canvas as a watermark.</span>
                </span>
                <input type="checkbox" checked={showLogoOverFloorplan} onChange={(e) => setShowLogoOverFloorplan(e.target.checked)} />
              </label>
              <label className="toggle">
                <span className="meta">
                  <strong>Manual Placement</strong>
                  <span>Drag the logo anywhere on the canvas instead of using a preset corner.</span>
                </span>
                <input
                  type="checkbox"
                  checked={manualLogoPlacement}
                  onChange={(e) => {
                    const manual = e.target.checked;
                    setManualLogoPlacement(manual);
                    if (!manual) setLogoCanvasPosition(logoPresetPosition(logoPosition));
                  }}
                />
              </label>
              {!manualLogoPlacement && (
                <div className="field">
                  <label htmlFor="logoPosition">Preset Position</label>
                  <select
                    id="logoPosition"
                    value={logoPosition}
                    onChange={(e) => {
                      setLogoPosition(e.target.value);
                      setLogoCanvasPosition(logoPresetPosition(e.target.value));
                    }}
                  >
                    {LOGO_POSITIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              )}
              <div className="field">
                <label htmlFor="logoOpacity">Logo Opacity ({Math.round(logoOpacity * 100)}%)</label>
                <input id="logoOpacity" type="range" min="0" max="1" step="0.05" value={logoOpacity} onChange={(e) => setLogoOpacity(Number(e.target.value))} />
              </div>
            </div>

            <div className="section">
              <h3>Auto Pathing</h3>
              <label className="toggle">
                <span className="meta">
                  <strong>Show Auto Routes</strong>
                  <span>Draws routes from rooms to the nearest exit.</span>
                </span>
                <input type="checkbox" checked={showRoutes} onChange={(e) => setShowRoutes(e.target.checked)} />
              </label>
            </div>

            <div className="section">
              <h3>Files</h3>
              <div className="field">
                <label htmlFor="logoUpload">Company Logo</label>
                <input id="logoUpload" type="file" accept="image/*" onChange={(e) => handleLogoFile(e.target.files?.[0] ?? null)} />
              </div>
              <div className="field">
                <label htmlFor="floorplanUpload">Floorplan PDF / PNG / JPG / WEBP</label>
                <input
                  id="floorplanUpload"
                  type="file"
                  accept="application/pdf,.pdf,image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => handleFloorplanFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="field">
                <label htmlFor="importJson">Import Planner JSON</label>
                <input id="importJson" type="file" accept="application/json,.json" onChange={(e) => handleImportJson(e.target.files?.[0] ?? null)} />
              </div>
              <div className="actions">
                <button type="button" className="primary" onClick={handleExportJson}>Export Planner JSON</button>
                <button type="button" onClick={handlePrint}>Print / Save PDF</button>
                <button type="button" onClick={() => setFloorplan(null)}>Clear Floorplan</button>
                <button type="button" className="danger" onClick={() => { setItems([]); setSelectedId(null); }}>Clear Planner</button>
              </div>
            </div>

            <div className="section">
              <h3>Selected Marker Controls</h3>
              <div className="field">
                <label htmlFor="selectedLabel">Selected Marker Label</label>
                <input
                  id="selectedLabel"
                  value={selectedItem?.label ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (selectedId) setItems((prev) => prev.map((i) => (i.id === selectedId ? { ...i, label: value } : i)));
                  }}
                  placeholder="Enter room number/location or custom label"
                  disabled={!selectedItem}
                />
              </div>
              <div className="actions">
                <button type="button" onClick={() => nudgeSelected(0, -nudgeStep)}>Move Up</button>
                <button type="button" onClick={() => nudgeSelected(0, nudgeStep)}>Move Down</button>
                <button type="button" onClick={() => nudgeSelected(-nudgeStep, 0)}>Move Left</button>
                <button type="button" onClick={() => nudgeSelected(nudgeStep, 0)}>Move Right</button>
                <button type="button" className="danger" onClick={deleteSelected}>Delete Selected</button>
              </div>
              <p>Selected: {selectedItem ? `${MARKER_DEFS[selectedItem.type].label} (${selectedItem.x}, ${selectedItem.y})` : "None"}</p>
              <div className="field">
                <label htmlFor="nudgeStep">Nudge Step</label>
                <input id="nudgeStep" type="number" min="0.5" step="0.5" value={nudgeStep} onChange={(e) => setNudgeStep(Number(e.target.value) || 0.5)} />
              </div>
            </div>
          </aside>

          <section className="panel main">
            <div className="main-top">
              <div>
                <h2>{facilityName}</h2>
                <p>{floorName} &middot; Active tool: <strong>{MARKER_DEFS[activeTool].label}</strong></p>
              </div>
              <span className="status">{items.length} symbol{items.length === 1 ? "" : "s"} &middot; {routes.length} route{routes.length === 1 ? "" : "s"}</span>
            </div>

            <div className="planner-sheet">
              <div className="planner-sheet__map">
                <div className="planner-sign-overlay no-print" data-html2canvas-ignore="true">
                  <div className="field">
                    <label htmlFor="preparedBy">Prepared By</label>
                    <input id="preparedBy" value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} placeholder="Enter name" />
                  </div>
                  <div className="field">
                    <label htmlFor="approvedBy">Approved By</label>
                    <input id="approvedBy" value={approvedBy} onChange={(e) => setApprovedBy(e.target.value)} placeholder="Enter name" />
                  </div>
                </div>

                <div className="canvas-wrap">
                  <div
                    ref={canvasRef}
                    className={`canvas ${paintMode ? "paint-mode" : ""}`}
                    style={{ cursor: paintMode ? "crosshair" : "default" }}
                    onClick={onCanvasClick}
                    onPointerDown={onCanvasPointerDown}
                    onPointerMove={onCanvasPointerMove}
                    onPointerUp={stopPainting}
                    onPointerLeave={stopPainting}
                  >
                    {floorplan && (
                      <div className="floorplan" style={{ opacity: floorplanOpacity }}>
                        <img src={floorplan.src} alt={floorplan.name} draggable={false} />
                      </div>
                    )}

                    {gridMap.map((row, r) =>
                      row.map((cell, c) =>
                        cell === "unpainted" ? null : (
                          <div
                            key={`cell-${r}-${c}`}
                            style={{ position: "absolute", left: 6 * c, top: 6 * r, width: 6, height: 6, background: paintToolColor(cell), pointerEvents: "none", zIndex: 2 }}
                          />
                        )
                      )
                    )}

                    {showLogoOverFloorplan && logoUrl && (
                      <div
                        data-logo="true"
                        className={`logo-inside ${logoDragging ? "dragging" : ""}`}
                        style={{
                          left: logoCanvasPosition.x,
                          top: logoCanvasPosition.y,
                          width: 120,
                          height: 80,
                          opacity: logoOpacity,
                          backgroundImage: `url(${logoUrl})`,
                          cursor: manualLogoPlacement ? "grab" : "default",
                        }}
                        onPointerDown={onLogoPointerDown}
                        onPointerMove={onLogoPointerMove}
                        onPointerUp={onLogoPointerUp}
                        onPointerCancel={onLogoPointerUp}
                      />
                    )}

                    <svg className="route-layer" viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`} preserveAspectRatio="none">
                      <defs>
                        <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                          <path d="M0,0 L0,6 L9,3 z" fill="#0f8f55" />
                        </marker>
                      </defs>
                      {routes.map((r) => (
                        <polyline key={r.id} points={r.points} className="route-line" markerEnd="url(#arrow)" />
                      ))}
                    </svg>

                    {items.map((item) => (
                      <DraggableMarker
                        key={item.id}
                        item={item}
                        selected={item.id === selectedId}
                        dragging={item.id === draggingId}
                        scale={markerScale}
                        onSelect={() => setSelectedId(item.id)}
                        onMove={(x, y) => moveMarker(item.id, x, y)}
                        onDragStateChange={(dragging) => setDraggingId(dragging ? item.id : null)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <aside className="planner-sheet__legend">
                <div className="sheet-card">
                  <h2>Legend</h2>
                  <p>Symbol appearance and meaning.</p>
                  <div className="legend-list">
                    {MARKER_TYPE_ORDER.map((type) => (
                      <div className="legend-item" key={type}>
                        <MarkerIcon type={type} scale={markerScale} variant="tool" />
                        <span className="meta">
                          <strong>{MARKER_DEFS[type].label}</strong>
                          <span>{MARKER_DEFS[type].description}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>

              <div className="planner-sheet__notes">
                <div className="notes">
                  <div className="note-card">
                    <h3>Emergency Notes / English</h3>
                    <ul>
                      {["In case of fire, medical emergency, hazardous spill, or any life-safety incident, remain calm and activate the nearest alarm if needed.",
                        "Use the nearest safe exit. Do not use elevators unless directed by emergency personnel.",
                        "Proceed to the designated assembly point and stay clear of building entrances, drive lanes, and fire department access areas.",
                        "Supervisors should account for team members and immediately report missing or injured persons to emergency responders.",
                        "Only re-enter the building after the fire department or authorized safety personnel give an official all-clear."].map((line) => <li key={line}>{line}</li>)}
                    </ul>
                  </div>
                  <div className="note-card">
                    <h3>Notas de Emergencia / Espa&ntilde;ol</h3>
                    <ul>
                      {["En caso de incendio, emergencia médica, derrame peligroso o cualquier incidente de seguridad, mantenga la calma y active la alarma más cercana si es necesario.",
                        "Use la salida segura más cercana. No use los elevadores a menos que el personal de emergencia lo autorice.",
                        "Diríjase al punto de reunión designado y manténgase alejado de las entradas del edificio, carriles de acceso y zonas de acceso para bomberos.",
                        "Los supervisores deben verificar a sus equipos e informar de inmediato a los socorristas sobre personas desaparecidas o lesionadas.",
                        "No vuelva a entrar al edificio hasta que el departamento de bomberos o el personal de seguridad autorizado emita la autorización oficial."].map((line) => <li key={line}>{line}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </section>
      </div>

      <PrintSheet
        plannerTitle={plannerTitle}
        facilityName={facilityName}
        floorName={floorName}
        preparedBy={preparedBy}
        approvedBy={approvedBy}
        logoUrl={logoUrl}
        items={items}
        routeCount={routes.length}
        printPreviewImage={printPreviewImage}
      />

      <footer className="panel footer">Copyright 2026 - All Rights Reserved - Evacuation Planner - Prepared by: K.A. Wiley -</footer>

      <div ref={toolboxAnchorRef} />
      <FloatingToolbox
        activeTool={activeTool}
        onActiveToolChange={setActiveTool}
        showRoutes={showRoutes}
        onShowRoutesChange={setShowRoutes}
        paintMode={paintMode}
        onPaintModeChange={handlePaintModeChange}
        brushSize={brushSize}
        onBrushSizeChange={setBrushSize}
        paintTool={paintTool}
        onPaintToolChange={setPaintTool}
        onFillAll={fillAllWalkable}
        onClear={clearGrid}
        defaultPosition={toolboxDefaultPos}
      />
      <FloatingDeleteBox selectedItem={selectedItem} onDelete={deleteSelected} defaultPosition={deleteBoxDefaultPos} />
      <AiChatDrawer canvasRef={canvasRef} markers={items} onActions={applyAiActions} />
    </main>
  );
}
