/**
 * Helpers shared by the library's pointer drags: the click swallow after a
 * drag (the sortable list and the drag-select provider) and the edge
 * auto-scroll step (the data grid and the drag-select provider).
 *
 * `suppressNextClick` no-ops outside the browser and `autoScrollDelta` is
 * pure, so a component may import this module on any platform.
 */

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
