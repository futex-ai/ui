/**
 * Edge auto-scroll for a started drag: once per animation frame, the press's
 * scroll container scrolls toward each edge that the pointer is near or
 * beyond.
 */
import { autoScrollDelta } from "../dragGesture";

import type { DragSelectablePoint } from "./dragSelectableModel";
import {
  dragSelectableVisibleRect,
  type DragSelectableScrollContainer,
} from "./dragSelectableScrollContainer";

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
  let frame = requestAnimationFrame(function step() {
    const { dx, dy } = autoScrollDelta(
      readPointer(),
      dragSelectableVisibleRect(container),
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
