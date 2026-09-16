"use client";

import { useRef, useState } from "react";
import { askAi, type AiAction, type AiChatTurn } from "@/lib/aiClient";
import type { PlacedMarker } from "@/lib/plannerTypes";

interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AiChatDrawerProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  markers: PlacedMarker[];
  onActions: (actions: AiAction[]) => void;
}

export function AiChatDrawer({ canvasRef, markers, onActions }: AiChatDrawerProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const historyRef = useRef<AiChatTurn[]>([]);

  async function send() {
    const message = input.trim();
    const canvasEl = canvasRef.current;
    if (!message || !canvasEl || busy) return;

    setInput("");
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", content: message }]);
    historyRef.current = [...historyRef.current, { role: "user", content: message }];
    setBusy(true);

    try {
      const result = await askAi({ canvasElement: canvasEl, message, markers, history: historyRef.current });
      onActions(result.actions);
      const reply = result.reply || "Done.";
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", content: reply }]);
      historyRef.current = [...historyRef.current, { role: "assistant", content: reply }];
    } catch (err) {
      const text = err instanceof Error ? err.message : "The AI assistant hit an unexpected error.";
      setMessages((m) => [...m, { id: `e-${Date.now()}`, role: "assistant", content: `⚠️ ${text}` }]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="ai-chat-toggle no-print" data-html2canvas-ignore="true" onClick={() => setOpen(true)}>
        {"\u{1F916}"} Smart Route AI
      </button>
    );
  }

  return (
    <div className="ai-chat-panel no-print" data-html2canvas-ignore="true">
      <div className="ai-chat-panel__header">
        <div>
          <strong>Smart Route Assistant</strong>
          <div>
            <span>Describe markers or routes in plain English</span>
          </div>
        </div>
        <button type="button" className="ai-chat-panel__close" onClick={() => setOpen(false)} aria-label="Close">
          {"×"}
        </button>
      </div>
      <div className="ai-chat-panel__messages">
        {messages.length === 0 && (
          <p className="ai-chat-panel__empty">
            Try: &quot;Put an exit at the door on the right&quot; or &quot;mark the hallway as walkable&quot;.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`ai-chat-message ai-chat-message--${m.role}`}>
            {m.content}
          </div>
        ))}
      </div>
      {busy && <div className="ai-chat-panel__status">Thinking…</div>}
      <div className="ai-chat-panel__input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Describe a marker or route..."
          disabled={busy}
        />
        <button type="button" onClick={send} disabled={busy || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
