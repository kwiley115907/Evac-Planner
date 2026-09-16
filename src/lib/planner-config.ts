export type MarkerType =
  | "room"
  | "exit"
  | "assembly"
  | "extinguisher"
  | "pullAlarm"
  | "elevatorL1"
  | "elevatorL2"
  | "elevatorL3"
  | "firePanel"
  | "fdc"
  | "stairwell";

export interface MarkerDef {
  label: string;
  short: string;
  symbol: string;
  color: string;
  description: string;
}

export const MARKER_DEFS: Record<MarkerType, MarkerDef> = {
  room: { label: "You Are Here", short: "HERE", symbol: "\u{1F9CD}", color: "#ca8a04", description: "Current occupant location." },
  exit: { label: "Exit", short: "EXIT", symbol: "EXIT", color: "#16a34a", description: "Primary or secondary egress point used to leave the building safely." },
  assembly: { label: "Assembly Point", short: "AP", symbol: "\u{1F4CD}", color: "#0f84ff", description: "Outdoor gathering area where occupants report after evacuation." },
  extinguisher: { label: "Fire Extinguisher", short: "FE", symbol: "\u{1F9EF}", color: "#d32f2f", description: "Portable extinguisher location." },
  pullAlarm: { label: "Pull Down Alarm", short: "PULL", symbol: "\u{1F6A8}", color: "#dc2626", description: "Manual pull alarm station location." },
  elevatorL1: { label: "Elevator L1", short: "L1", symbol: "L1", color: "#7c3aed", description: "Elevator identifier for Lift 1." },
  elevatorL2: { label: "Elevator L2", short: "L2", symbol: "L2", color: "#c026d3", description: "Elevator identifier for Lift 2." },
  elevatorL3: { label: "Elevator L3", short: "L3", symbol: "L3", color: "#4338ca", description: "Elevator identifier for Lift 3." },
  firePanel: { label: "Fire Panel", short: "FP", symbol: "\u{1F514}", color: "#b91c1c", description: "Fire alarm panel or annunciator location." },
  fdc: { label: "FDC", short: "FDC", symbol: "\u{1F692}", color: "#7f1d1d", description: "Fire department connection for sprinkler or standpipe system." },
  stairwell: { label: "Stairwell", short: "ST", symbol: "\u{1FA9C}", color: "#374151", description: "Protected stairwell used for evacuation and emergency access." },
};

export const MARKER_TYPE_ORDER: MarkerType[] = [
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

export function isElevator(type: MarkerType): boolean {
  return type === "elevatorL1" || type === "elevatorL2" || type === "elevatorL3";
}

export const FLOOR_OPTIONS = ["Ground Floor", "Level 1", "Level 2", "Level 3", "Roof", "Site Plan"];

export type PaintTool = "walkable" | "blocked" | "balcony" | "stairs" | "door" | "erase";

export interface PaintToolDef {
  value: PaintTool;
  label: string;
  color: string;
  swatch: string;
  description: string;
}

export const PAINT_TOOLS: PaintToolDef[] = [
  { value: "walkable", label: "Walkable", color: "rgba(34,197,94,0.25)", swatch: "W", description: "Use for hallways, corridors, room interiors, and any safe walking path." },
  { value: "blocked", label: "Blocked", color: "rgba(239,68,68,0.30)", swatch: "B", description: "Use for walls, locked rooms, fixed barriers, shafts, or non-passable areas." },
  { value: "balcony", label: "Balcony / No-Go", color: "rgba(249,115,22,0.30)", swatch: "NG", description: "Use for balconies, edges, no-go spaces, and unsafe traversals." },
  { value: "stairs", label: "Stairs Path", color: "rgba(59,130,246,0.30)", swatch: "ST", description: "Use for stair travel paths that are part of egress." },
  { value: "door", label: "Door Opening", color: "rgba(250,204,21,0.45)", swatch: "DR", description: "Use for openings through blocked walls where the route is allowed to pass." },
  { value: "erase", label: "Erase", color: "rgba(148,163,184,0.18)", swatch: "E", description: "Remove paint from the routing layer cell by cell." },
];

export function paintToolColor(tool: PaintTool): string {
  const found = PAINT_TOOLS.find((t) => t.value === tool);
  return found ? found.color : "transparent";
}

export const LOGO_POSITIONS: { value: string; label: string }[] = [
  { value: "top-left", label: "Top Left" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "top-center", label: "Top Center" },
  { value: "bottom-center", label: "Bottom Center" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-right", label: "Bottom Right" },
];

export const EMERGENCY_NOTES_EN = [
  "In case of fire, medical emergency, hazardous spill, or any life-safety incident, remain calm and activate the nearest alarm if needed.",
  "Use the nearest safe exit. Do not use elevators unless directed by emergency personnel.",
  "Proceed to the designated assembly point and stay clear of building entrances, drive lanes, and fire department access areas.",
  "Supervisors should account for team members and immediately report missing or injured persons to emergency responders.",
  "Only re-enter the building after the fire department or authorized safety personnel give an official all-clear.",
];

export const EMERGENCY_NOTES_ES = [
  "En caso de incendio, emergencia médica, derrame peligroso o cualquier incidente de seguridad, mantenga la calma y active la alarma más cercana si es necesario.",
  "Use la salida segura más cercana. No use los elevadores a menos que el personal de emergencia lo autorice.",
  "Diríjase al punto de reunión designado y manténgase alejado de las entradas del edificio, carriles de acceso y zonas de acceso para bomberos.",
  "Los supervisores deben verificar a sus equipos e informar de inmediato a los socorristas sobre personas desaparecidas o lesionadas.",
  "No vuelva a entrar al edificio hasta que el departamento de bomberos o el personal de seguridad autorizado emita la autorización oficial.",
];

export const DEFAULT_LOGO_DATA_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200">
  <rect width="1200" height="1200" fill="#0f172a"/>
  <circle cx="600" cy="420" r="220" fill="none" stroke="#cbd5e1" stroke-width="24" opacity="0.7"/>
  <path d="M450 470 L600 300 L750 470" fill="none" stroke="#e2e8f0" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M545 560 L545 430 L655 430 L655 560" fill="none" stroke="#f8fafc" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="600" y="880" text-anchor="middle" fill="#e2e8f0" font-size="76" font-family="Arial, Helvetica, sans-serif" font-weight="700" opacity="0.65">
    COMPANY LOGO
  </text>
</svg>
`)}`;

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 760;
export const GRID_CELL_SIZE = 6;
export const GRID_COLS = Math.floor(CANVAS_WIDTH / GRID_CELL_SIZE);
export const GRID_ROWS = Math.floor(CANVAS_HEIGHT / GRID_CELL_SIZE);
