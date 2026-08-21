/**
 * DOM measuring for the web timeline drag (`useTimelineDrag.web.ts`).
 *
 * Only the lane stack itself is measured. Everything else — which clip is under
 * the pointer, which lane, whether the grab landed on an edge — is derived from
 * the model with the resulting content coordinates, so the hit testing agrees
 * with what was rendered rather than re-reading the DOM per clip. Only the web
 * hook imports this; the native hook never runs it.
 */

/** The minimal DOM surface of the lane container we touch. */
export type LanesNode = {
  contains?: (other: unknown) => boolean;
  getBoundingClientRect?: () => { left: number; top: number };
} | null;

/** A pointer position expressed in the lane stack's own coordinate space. */
export type ContentPoint = { x: number; y: number };

/**
 * Converts a viewport pointer position into lane-stack coordinates. The lane
 * stack lives inside the horizontal scroller, so its own rect already carries
 * the scroll offset and no separate scroll bookkeeping is needed.
 */
export function toContentPoint(
  lanes: LanesNode,
  clientX: number,
  clientY: number,
): ContentPoint | null {
  const rect = lanes?.getBoundingClientRect?.();
  if (!rect) {
    return null;
  }
  return { x: clientX - rect.left, y: clientY - rect.top };
}

/** Whether the event started inside the lane stack. */
export function isInsideLanes(lanes: LanesNode, target: unknown): boolean {
  return Boolean(lanes?.contains?.(target));
}

/** Which part of a clip a grab at `x` landed on. */
export type ClipGrabZone = "body" | "end" | "start";

/**
 * Classifies a grab against a clip's horizontal span. The edge zones shrink on
 * a narrow clip so a short clip is still draggable rather than being entirely
 * trim handle — at a third of the width each, the middle third always remains.
 */
export function clipGrabZone(
  x: number,
  left: number,
  width: number,
  handleWidth: number,
): ClipGrabZone {
  const zone = Math.min(handleWidth, width / 3);
  if (x - left <= zone) {
    return "start";
  }
  if (left + width - x <= zone) {
    return "end";
  }
  return "body";
}
