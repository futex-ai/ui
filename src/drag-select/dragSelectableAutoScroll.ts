/**
 * Edge auto-scroll for a started drag: once per animation frame, the press's
 * scroll container scrolls toward each edge that the pointer is near or
 * beyond, on the axes where its overflow lets it scroll.
 */
import { autoScrollDelta } from "../dragGesture";

import type { DragSelectablePoint } from "./dragSelectableModel";
import {
  dragSelectableScrollAxes,
  type DragSelectableScrollAxes,
} from "./dragSelectableScrollAxes";
import {
  dragSelectableVisibleRect,
  type DragSelectableRect,
  type DragSelectableScrollContainer,
} from "./dragSelectableScrollContainer";

/**
 * The scroll step of one frame: `autoScrollDelta` on each axis where the
 * container can scroll, and `0` on an axis whose overflow is hidden.
 */
export function dragSelectableAutoScrollDelta(
  point: DragSelectablePoint,
  rect: DragSelectableRect,
  axes: DragSelectableScrollAxes,
): { dx: number; dy: number } {
  const { dx, dy } = autoScrollDelta(point, rect);
  return { dx: axes.x ? dx : 0, dy: axes.y ? dy : 0 };
}

/**
 * Starts the loop and returns the function that stops it. `readPointer`
 * gives the latest pointer position in viewport coordinates.
 */
export function startDragSelectableAutoScroll(
  container: DragSelectableScrollContainer,
  readPointer: () => DragSelectablePoint,
): () => void {
  if (
    typeof requestAnimationFrame !== "function" ||
    typeof cancelAnimationFrame !== "function"
  ) {
    return () => undefined;
  }
  const axes = dragSelectableScrollAxes(container);
  let frame = requestAnimationFrame(function step() {
    const { dx, dy } = dragSelectableAutoScrollDelta(
      readPointer(),
      dragSelectableVisibleRect(container),
      axes,
    );
    if (dx !== 0 || dy !== 0) {
      scrollContainerBy(container, dx, dy);
    }
    frame = requestAnimationFrame(step);
  });
  return () => cancelAnimationFrame(frame);
}

function scrollContainerBy(
  container: DragSelectableScrollContainer,
  dx: number,
  dy: number,
) {
  const options: ScrollToOptions = { behavior: "instant", left: dx, top: dy };
  if (container.root) {
    container.element.ownerDocument.defaultView?.scrollBy(options);
    return;
  }
  container.element.scrollBy(options);
}
