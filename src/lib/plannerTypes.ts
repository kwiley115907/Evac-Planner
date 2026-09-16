import type { GridMap } from "./routing";
import type { MarkerType } from "./planner-config";

export interface PlacedMarker {
  id: string;
  type: MarkerType;
  x: number;
  y: number;
  label: string;
}

export type Floorplan = { kind: "image"; src: string; name: string } | null;

export interface PlanData {
  plannerTitle: string;
  facilityName: string;
  floorName: string;
  preparedBy: string;
  approvedBy: string;
  logoUrl: string;
  manualLogoPlacement: boolean;
  logoPosition: string;
  showLogoOverFloorplan: boolean;
  logoOpacity: number;
  floorplanOpacity: number;
  logoCanvasPosition: { x: number; y: number };
  markerScale: number;
  floorplan: Floorplan;
  showRoutes: boolean;
  paintMode: boolean;
  paintTool: string;
  gridMap: GridMap;
  items: PlacedMarker[];
}

const MARKER_TYPES: MarkerType[] = [
  "room",
  "exit",
  "assembly",
  "extinguisher",
  "pullAlarm",
  "elevatorL1",
  "elevatorL2",
  "elevatorL3",
  "firePanel",
  "fdc",
  "stairwell",
];

export function isMarkerType(value: unknown): value is MarkerType {
  return typeof value === "string" && (MARKER_TYPES as string[]).includes(value);
}

export function newMarkerId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `marker-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
