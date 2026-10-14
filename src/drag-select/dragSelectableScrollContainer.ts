/**
 * The scroll container of a drag-select press: the element that scrolls the
 * content under the press, or the document scrolling element. The scrollbar
 * rule, the anchor, auto-scroll, and the box clip all use it.
 */
import type {
  DragSelectableBox,
  DragSelectablePoint,
} from "./dragSelectableModel";

/** The element that scrolls the content under a press. */
export type DragSelectableScrollContainer = {
  element: Element;
  /** `true` for the document scrolling element, which the window scrolls. */
  root: boolean;
};

/** A rectangle in viewport coordinates. */
export type DragSelectableRect = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

const SCROLLING_OVERFLOW = new Set(["auto", "scroll", "overlay"]);

/**
 * The pressed element if it scrolls, else its nearest scrolling ancestor,
 * else the document scrolling element.
 */
export function dragSelectableScrollContainer(
  element: Element,
): DragSelectableScrollContainer {
  const ownerDocument = element.ownerDocument;
  const root = ownerDocument.scrollingElement ?? ownerDocument.documentElement;
  for (
    let node: Element | null = element;
    node && node !== root && node !== ownerDocument.body;
    node = node.parentElement
  ) {
    if (dragSelectableElementScrolls(node)) {
      return { element: node, root: false };
    }
  }
  return { element: root, root: true };
}

/**
 * Whether an element scrolls on an axis: its computed `overflow` on that axis
 * is `auto`, `scroll`, or `overlay`, and its content overflows on that axis or
 * it reserves scrollbar space on that axis.
 */
export function dragSelectableElementScrolls(element: Element): boolean {
  const style = getComputedStyle(element);
  const html = element as HTMLElement;
  const borders = dragSelectableBorders(style);
  const scrollsY =
    SCROLLING_OVERFLOW.has(style.overflowY) &&
    (element.scrollHeight > element.clientHeight ||
      verticalScrollbarSpace(html, borders) > 0);
  const scrollsX =
    SCROLLING_OVERFLOW.has(style.overflowX) &&
    (element.scrollWidth > element.clientWidth ||
      horizontalScrollbarSpace(html, borders) > 0);
  return scrollsX || scrollsY;
}

/** The client area of a scroll container in viewport coordinates. */
export function dragSelectableClientRect(
  container: DragSelectableScrollContainer,
): DragSelectableRect {
  const element = container.element;
  if (container.root) {
    return {
      bottom: element.clientHeight,
      left: 0,
      right: element.clientWidth,
      top: 0,
    };
  }
  const rect = element.getBoundingClientRect();
  const left = rect.left + element.clientLeft;
  const top = rect.top + element.clientTop;
  return {
    bottom: top + element.clientHeight,
    left,
    right: left + element.clientWidth,
    top,
  };
}

/**
 * The part of the container that the user can see: its client area clipped
 * to the viewport. The document scrolling element shows the viewport.
 */
export function dragSelectableVisibleRect(
  container: DragSelectableScrollContainer,
): DragSelectableRect {
  const client = dragSelectableClientRect(container);
  const viewport = container.element.ownerDocument.documentElement;
  return {
    bottom: Math.min(client.bottom, viewport.clientHeight),
    left: Math.max(client.left, 0),
    right: Math.min(client.right, viewport.clientWidth),
    top: Math.max(client.top, 0),
  };
}

/** The part of a box inside a rectangle, or `null` when they do not overlap. */
export function dragSelectableClipBox(
  box: DragSelectableBox,
  rect: DragSelectableRect,
): DragSelectableBox | null {
  const left = Math.max(box.left, rect.left);
  const right = Math.min(box.right, rect.right);
  const top = Math.max(box.top, rect.top);
  const bottom = Math.min(box.bottom, rect.bottom);
  if (right <= left || bottom <= top) {
    return null;
  }
  return {
    bottom,
    height: bottom - top,
    left,
    right,
    top,
    width: right - left,
  };
}

/** Whether a point lies inside a rectangle, edges included. */
export function dragSelectableRectContains(
  rect: DragSelectableRect,
  point: DragSelectablePoint,
): boolean {
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
}

/** The computed border widths of an element, in pixels. */
export type DragSelectableBorders = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

const BORDER_SIDES = ["bottom", "left", "right", "top"] as const;

/** Reads the four computed border widths of an element. */
export function dragSelectableBorders(
  style: CSSStyleDeclaration,
): DragSelectableBorders {
  const borders: DragSelectableBorders = {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  };
  for (const side of BORDER_SIDES) {
    borders[side] = cssPixels(style.getPropertyValue(`border-${side}-width`));
  }
  return borders;
}

/** The width that a vertical scrollbar takes from an element's layout. */
export function verticalScrollbarSpace(
  element: HTMLElement,
  borders: DragSelectableBorders,
): number {
  return (
    element.offsetWidth - element.clientWidth - borders.left - borders.right
  );
}

/** The height that a horizontal scrollbar takes from an element's layout. */
export function horizontalScrollbarSpace(
  element: HTMLElement,
  borders: DragSelectableBorders,
): number {
  return (
    element.offsetHeight - element.clientHeight - borders.top - borders.bottom
  );
}

/** A computed CSS length in pixels, or `0` when it is not a number. */
function cssPixels(value: string): number {
  const pixels = Number.parseFloat(value);
  return Number.isFinite(pixels) ? pixels : 0;
}
