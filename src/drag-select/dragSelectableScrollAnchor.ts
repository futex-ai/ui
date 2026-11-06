/**
 * Keeps the start point of a drag attached to the scrolled content: a scroll
 * of the press's container, or of an ancestor that moves the container, moves
 * the start point with the content.
 */
import type { DragSelectablePoint } from "./dragSelectableModel";
import type { DragSelectableScrollContainer } from "./dragSelectableScrollContainer";

/** Where a scroll container sits and how far it has scrolled. */
export type DragSelectableAnchorFrame = {
  /** The container's left edge in viewport coordinates. */
  left: number;
  scrollLeft: number;
  scrollTop: number;
  /** The container's top edge in viewport coordinates. */
  top: number;
};

/**
 * The viewport position of a press point after the content moved from
 * `origin` to `current`. A container that moves in the viewport moves the
 * point with it, and a container that scrolls moves the point the other way.
 */
export function dragSelectableAnchoredPoint(
  press: DragSelectablePoint,
  origin: DragSelectableAnchorFrame,
  current: DragSelectableAnchorFrame,
): DragSelectablePoint {
  return {
    x:
      press.x +
      (current.left - origin.left) -
      (current.scrollLeft - origin.scrollLeft),
    y:
      press.y +
      (current.top - origin.top) -
      (current.scrollTop - origin.scrollTop),
  };
}

/**
 * Reads the frame of a scroll container. The document scrolling element is
 * the viewport, so only its scroll offsets move.
 */
export function dragSelectableAnchorFrame(
  container: DragSelectableScrollContainer,
): DragSelectableAnchorFrame {
  const element = container.element;
  if (container.root) {
    const view = element.ownerDocument.defaultView;
    return {
      left: 0,
      scrollLeft: view?.scrollX ?? element.scrollLeft,
      scrollTop: view?.scrollY ?? element.scrollTop,
      top: 0,
    };
  }
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left,
    scrollLeft: element.scrollLeft,
    scrollTop: element.scrollTop,
    top: rect.top,
  };
}
