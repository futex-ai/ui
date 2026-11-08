/**
 * Helpers shared by the library's pointer drags: the document listeners of a
 * drag (the data grid and the panel resize handle), the click swallow after a
 * drag (the sortable list and the drag-select provider), and the edge
 * auto-scroll step (the data grid and the drag-select provider).
 *
 * `attachPointerDragListeners` and `suppressNextClick` no-op outside the
 * browser and `autoScrollDelta` is pure, so a component may import this module
 * on any platform.
 */

/** The callbacks of one pointer drag. */
export type PointerDragHandlers = {
  onMove: (clientX: number, clientY: number) => void;
  /** `committed` is true only for a real pointerup (not pointercancel / blur). */
  onEnd: (committed: boolean) => void;
};

/**
 * Attach document-level pointer listeners for the duration of a drag and return
 * a disposer, so the drag follows the pointer outside the element that started
 * it. Move events `preventDefault` to suppress native text selection.
 */
export function attachPointerDragListeners(
  handlers: PointerDragHandlers,
): () => void {
  if (typeof document === "undefined") {
    return () => undefined;
  }
  const move = (event: PointerEvent) => {
    event.preventDefault();
    handlers.onMove(event.clientX, event.clientY);
  };
  // Only a genuine pointerup is a completed gesture; pointercancel and window
  // blur are aborts, so they end the drag without committing a tap-to-edit.
  const end = (event: Event) => handlers.onEnd(event.type === "pointerup");
  document.addEventListener("pointermove", move, true);
  document.addEventListener("pointerup", end, true);
  document.addEventListener("pointercancel", end, true);
  // The window `blur` listener must NOT be capture — a capture listener also
  // catches element blur events, which fire when a drag's pointer-down focuses a
  // new cell (blurring the previously-focused one), cancelling the drag.
  window.addEventListener("blur", end, false);
  return () => {
    document.removeEventListener("pointermove", move, true);
    document.removeEventListener("pointerup", end, true);
    document.removeEventListener("pointercancel", end, true);
    window.removeEventListener("blur", end, false);
  };
}

/**
 * Swallow the click a committed drag produces, so a drag-release does not
 * activate whatever sits under the pointer. The click fires synchronously after
 * pointerup, before the next frame, so a one-shot capture listener eats exactly
 * it and is removed on the next frame.
 */
export function suppressNextClick(): void {
  if (typeof document === "undefined") {
    return;
  }
  const eat = (event: Event) => {
    event.stopPropagation();
    event.preventDefault();
  };
  document.addEventListener("click", eat, true);
  const remove = () => document.removeEventListener("click", eat, true);
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(remove);
  } else {
    setTimeout(remove, 0);
  }
}

/**
 * The scroll step for one animation frame while the pointer sits within
 * `edge` pixels of a scroll rect's visible edge, or beyond it: `speed`
 * pixels toward that edge on each axis, else `0`.
 */
export function autoScrollDelta(
  point: { x: number; y: number },
  rect: { left: number; right: number; top: number; bottom: number },
  edge = 36,
  speed = 16,
): { dx: number; dy: number } {
  let dx = 0;
  let dy = 0;
  if (point.x < rect.left + edge) {
    dx = -speed;
  } else if (point.x > rect.right - edge) {
    dx = speed;
  }
  if (point.y < rect.top + edge) {
    dy = -speed;
  } else if (point.y > rect.bottom - edge) {
    dy = speed;
  }
  return { dx, dy };
}
