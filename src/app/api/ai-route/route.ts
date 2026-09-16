import { NextResponse } from "next/server";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = process.env.EVACPLAN_AI_MODEL || "claude-sonnet-5";

const SYSTEM_PROMPT = `You are the "Smart Route" assistant inside an emergency evacuation floor-plan tool. You are shown a screenshot of the planner's canvas (the uploaded floor plan plus any markers and painted routing cells already placed on it). The canvas is always exactly 1200x760 pixels (origin top-left, x right, y down) — coordinates you return must be in that space regardless of the screenshot's own pixel size, which is given to you explicitly.

The user describes what they want in plain English, for example:
- "Put an exit at the double doors on the top right."
- "Mark the front lobby as the assembly point."
- "I'm in the room on the left, mark that as You Are Here."
- "The hallway running along the bottom is walkable."
- "Block off the storage closet in the corner."

Marker types you may place: room (You Are Here), exit, assembly, extinguisher, pullAlarm, elevatorL1, elevatorL2, elevatorL3, firePanel, fdc, stairwell.
Paint tools for the routing layer: walkable, blocked, balcony, stairs, door, erase. Routes are only computed through walkable/stairs/door cells, so when you place a "room" and an "exit" you should usually also paint_rect the corridor between them as "walkable" unless it's already painted (visible as a tinted color in the screenshot) — green means walkable, red blocked, orange balcony/no-go, blue stairs, yellow door.

Reply with ONLY a single fenced \`\`\`json code block and nothing else outside of it, shaped exactly like this:
{
  "reply": "one or two short, friendly sentences describing what you did or what you need clarified",
  "actions": [
    {"action": "add_marker", "type": "room|exit|assembly|extinguisher|pullAlarm|elevatorL1|elevatorL2|elevatorL3|firePanel|fdc|stairwell", "x": 123, "y": 456, "label": "optional short label"},
    {"action": "remove_marker", "id": "marker-id"},
    {"action": "paint_rect", "x1": 100, "y1": 100, "x2": 300, "y2": 140, "tool": "walkable|blocked|balcony|stairs|door"}
  ]
}

Rules:
- Never invent coordinates outside 0-1200 (x) or 0-760 (y).
- If you cannot confidently locate the described feature in the screenshot, return an empty "actions" list and ask a clarifying question in "reply" instead of guessing wildly.
- Keep paint_rect regions modest and only covering the path actually described — don't paint the whole canvas walkable unless asked to.`;

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicMessageResponse {
  content?: AnthropicContentBlock[];
}

interface HistoryTurn {
  role?: string;
  content?: string;
}

interface IncomingBody {
  image?: string;
  message?: string;
  markers?: unknown;
  history?: HistoryTurn[];
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "The AI Smart Route assistant isn't configured yet. Set ANTHROPIC_API_KEY on the server." },
      { status: 503 }
    );
  }

  let body: IncomingBody;
  try {
    body = (await req.json()) as IncomingBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { image, message, markers, history } = body;
  if (typeof image !== "string" || !image.startsWith("data:image/") || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Missing canvas screenshot or message." }, { status: 400 });
  }

  const commaIdx = image.indexOf(",");
  const mediaType = image.startsWith("data:image/png") ? "image/png" : "image/jpeg";
  const base64 = commaIdx >= 0 ? image.slice(commaIdx + 1) : "";
  if (!base64) {
    return NextResponse.json({ error: "Malformed image data." }, { status: 400 });
  }

  const contextText =
    `The screenshot shows the full 1200x760 canvas (it may be scaled down as an image, but your coordinates must always be in the original 1200x760 space).\n` +
    `Existing markers (JSON): ${JSON.stringify(markers ?? [])}\n` +
    `User request: ${message}`;

  const historyMessages = Array.isArray(history)
    ? history.slice(-6).map((turn) => ({
        role: turn?.role === "assistant" ? "assistant" : "user",
        content: String(turn?.content ?? ""),
      }))
    : [];

  const messages = [
    ...historyMessages,
    {
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
        { type: "text", text: contextText },
      ],
    },
  ];

  let upstream: Response;
  try {
    upstream = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Could not reach the AI service: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    const text = await upstream.text();
    return NextResponse.json({ error: `AI service error (${upstream.status}): ${text.slice(0, 300)}` }, { status: 502 });
  }

  const data = (await upstream.json()) as AnthropicMessageResponse;
  const fullText = (data.content ?? [])
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!fullText) {
    return NextResponse.json({ error: "The AI assistant returned an empty response." }, { status: 502 });
  }

  const match = fullText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
  const raw = match ? match[1] : fullText;

  try {
    const parsed = JSON.parse(raw) as { reply?: unknown; actions?: unknown };
    return NextResponse.json({
      reply: typeof parsed.reply === "string" ? parsed.reply : fullText,
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    });
  } catch {
    return NextResponse.json({ reply: fullText, actions: [] });
  }
}
