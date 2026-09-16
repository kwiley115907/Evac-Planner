import { isMarkerType, type PlacedMarker } from "./plannerTypes";
import type { MarkerType } from "./planner-config";
import type { PaintTool } from "./planner-config";

const PAINT_TOOL_VALUES: PaintTool[] = ["walkable", "blocked", "balcony", "stairs", "door", "erase"];

export interface AddMarkerAction {
  action: "add_marker";
  type: MarkerType;
  x: number;
  y: number;
  label?: string;
}

export interface RemoveMarkerAction {
  action: "remove_marker";
  id: string;
}

export interface PaintRectAction {
  action: "paint_rect";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  tool: PaintTool;
}

export type AiAction = AddMarkerAction | RemoveMarkerAction | PaintRectAction;

export interface AiChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AiResult {
  reply: string;
  actions: AiAction[];
}

function parseActions(raw: unknown): AiAction[] {
  if (!Array.isArray(raw)) return [];
  const out: AiAction[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    if (obj.action === "add_marker" && isMarkerType(obj.type) && typeof obj.x === "number" && typeof obj.y === "number") {
      out.push({
        action: "add_marker",
        type: obj.type,
        x: obj.x,
        y: obj.y,
        label: typeof obj.label === "string" ? obj.label : undefined,
      });
    } else if (obj.action === "remove_marker" && typeof obj.id === "string") {
      out.push({ action: "remove_marker", id: obj.id });
    } else if (
      obj.action === "paint_rect" &&
      typeof obj.x1 === "number" &&
      typeof obj.y1 === "number" &&
      typeof obj.x2 === "number" &&
      typeof obj.y2 === "number" &&
      typeof obj.tool === "string" &&
      (PAINT_TOOL_VALUES as string[]).includes(obj.tool)
    ) {
      out.push({ action: "paint_rect", x1: obj.x1, y1: obj.y1, x2: obj.x2, y2: obj.y2, tool: obj.tool as PaintTool });
    }
  }
  return out;
}

export interface AskAiParams {
  canvasElement: HTMLElement;
  message: string;
  markers: PlacedMarker[];
  history: AiChatTurn[];
}

export async function askAi({ canvasElement, message, markers, history }: AskAiParams): Promise<AiResult> {
  const html2canvas = (await import("html2canvas")).default;
  const shot = await html2canvas(canvasElement, {
    backgroundColor: "#ffffff",
    scale: 0.75,
    useCORS: true,
    logging: false,
  });
  const image = shot.toDataURL("image/jpeg", 0.82);

  const res = await fetch("/api/ai-route", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      image,
      message,
      markers: markers.map(({ id, type, x, y, label }) => ({ id, type, x, y, label })),
      history: history.slice(-6),
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { reply?: unknown; actions?: unknown; error?: unknown };

  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : `AI request failed (${res.status}).`);
  }

  return {
    reply: typeof data.reply === "string" ? data.reply : "",
    actions: parseActions(data.actions),
  };
}
