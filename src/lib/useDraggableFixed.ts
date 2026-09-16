"use client";

import { useCallback, useRef, useState } from "react";
import { clamp } from "./fileUtils";

interface Point {
  x: number;
  y: number;
}

/** Drag state for a `position:fixed` panel (floating toolbox, delete box) that
 * should stay fully within the browser viewport while being dragged by its header. */
export function useDraggableFixed(headerSelector: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const drag = useRef({ active: false, pointerId: -1, startX: 0, startY: 0, originX: 0, originY: 0 });

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (!target.closest(headerSelector)) return;
      if (target.closest(`${headerSelector} button`)) return;
      e.preventDefault();
      e.stopPropagation();
      drag.current = { active: true, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, originX: position.x, originY: position.y };
      ref.current?.setPointerCapture(e.pointerId);
    },
    [headerSelector, position.x, position.y]
  );

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active || drag.current.pointerId !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = ref.current?.getBoundingClientRect();
    const w = rect?.width ?? 240;
    const h = rect?.height ?? 140;
    setPosition({
      x: clamp(drag.current.originX + (e.clientX - drag.current.startX), 8, window.innerWidth - w - 8),
      y: clamp(drag.current.originY + (e.clientY - drag.current.startY), 8, window.innerHeight - h - 8),
    });
  }, []);

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current.pointerId !== e.pointerId) return;
    if (ref.current?.hasPointerCapture(e.pointerId)) ref.current.releasePointerCapture(e.pointerId);
    drag.current.active = false;
    drag.current.pointerId = -1;
  }, []);

  return { ref, position, setPosition, handlers: { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag } };
}
