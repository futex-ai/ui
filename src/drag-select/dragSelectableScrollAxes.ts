/**
 * The axes on which a scroll container's overflow lets it scroll. Auto-scroll
 * and the scrollbar rule use them; a script can still scroll an axis whose
 * overflow is `hidden`, so the provider must check them first.
 */
import type { DragSelectableScrollContainer } from "./dragSelectableScrollContainer";
import { dragSelectableViewportOverflowElement } from "./dragSelectableViewportOverflow";

/** The axes on which a scroll container's overflow lets it scroll. */
export type DragSelectableScrollAxes = { x: boolean; y: boolean };

const SCROLLING_OVERFLOW = new Set(["auto", "scroll", "overlay"]);

/**
 * Which axes scroll for computed `overflow` values. An element scrolls on an
 * axis whose overflow is `auto`, `scroll`, or `overlay`. The viewport (`root`)
 * scrolls on every axis whose overflow is not `hidden` or `clip`.
 */
export function dragSelectableOverflowAxes(
  overflowX: string,
  overflowY: string,
  root: boolean,
): DragSelectableScrollAxes {
  const scrolls = root
    ? (value: string) => value !== "hidden" && value !== "clip"
    : (value: string) => SCROLLING_OVERFLOW.has(value);
  return { x: scrolls(overflowX), y: scrolls(overflowY) };
}

/**
 * Reads the axes on which a scroll container's overflow lets it scroll. The
 * document reads the overflow that the viewport takes.
 */
export function dragSelectableScrollAxes(
  container: DragSelectableScrollContainer,
): DragSelectableScrollAxes {
  const style = getComputedStyle(
    container.root
      ? dragSelectableViewportOverflowElement(container.element.ownerDocument)
      : container.element,
  );
  return dragSelectableOverflowAxes(
    style.overflowX,
    style.overflowY,
    container.root,
  );
}
