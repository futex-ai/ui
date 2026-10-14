/**
 * The scrollbar start rule: a press on a classic scrollbar, or in the zone
 * where an overlay scrollbar appears, never starts a drag.
 */
import { HIDE_SCROLLBAR_ATTRIBUTE } from "../primitives/dom/css";

import type { DragSelectablePoint } from "./dragSelectableModel";
import {
  dragSelectableBorders,
  dragSelectableClientRect,
  dragSelectableRectContains,
  horizontalScrollbarSpace,
  verticalScrollbarSpace,
  type DragSelectableRect,
  type DragSelectableScrollContainer,
} from "./dragSelectableScrollContainer";

/** Pixels from the far edge where an overlay scrollbar can take a press. */
export const DRAG_SELECTABLE_OVERLAY_SCROLLBAR_ZONE = 16;

/**
 * Pixels by which a point must leave the client area to count as a press on
 * a classic scrollbar. It absorbs the rounding between the fractional border
 * box and the whole-pixel client size.
 */
const CLASSIC_SCROLLBAR_TOLERANCE = 1;

/** What the scrollbar rule reads from a scroll container. */
export type DragSelectableScrollbarMetrics = {
  /** The client area: the padding box without the scrollbars. */
  client: DragSelectableRect;
  /** The container hides its scrollbars. */
  hidesScrollbar: boolean;
  /** The content overflows horizontally and the style lets it scroll. */
  overflowsX: boolean;
  /** The content overflows vertically and the style lets it scroll. */
  overflowsY: boolean;
  /** The border box without the borders, or `null` for the document. */
  paddingBox: DragSelectableRect | null;
  /** A horizontal scrollbar takes layout space. */
  reservesX: boolean;
  /** A vertical scrollbar takes layout space. */
  reservesY: boolean;
  /** The container lays out right to left. */
  rtl: boolean;
};

/** Whether a press at `point` lands on a scrollbar of the container. */
export function dragSelectableScrollbarHit(
  metrics: DragSelectableScrollbarMetrics,
  point: DragSelectablePoint,
): boolean {
  const { client } = metrics;
  if (
    metrics.paddingBox &&
    dragSelectableRectContains(metrics.paddingBox, point) &&
    outsideClientArea(client, point)
  ) {
    return true;
  }
  if (metrics.hidesScrollbar) {
    return false;
  }
  const zone = DRAG_SELECTABLE_OVERLAY_SCROLLBAR_ZONE;
  const insideRows = point.y >= client.top && point.y <= client.bottom;
  const insideColumns = point.x >= client.left && point.x <= client.right;
  if (metrics.overflowsY && !metrics.reservesY && insideRows) {
    const inZone = metrics.rtl
      ? point.x >= client.left && point.x <= client.left + zone
      : point.x <= client.right && point.x >= client.right - zone;
    if (inZone) {
      return true;
    }
  }
  return (
    metrics.overflowsX &&
    !metrics.reservesX &&
    insideColumns &&
    point.y <= client.bottom &&
    point.y >= client.bottom - zone
  );
}

/** Reads the scrollbar metrics of a scroll container from the DOM. */
export function dragSelectableScrollbarMetrics(
  container: DragSelectableScrollContainer,
): DragSelectableScrollbarMetrics {
  const element = container.element as HTMLElement;
  const style = getComputedStyle(element);
  const client = dragSelectableClientRect(container);
  const shared = {
    client,
    hidesScrollbar:
      style.getPropertyValue("scrollbar-width") === "none" ||
      element.hasAttribute(HIDE_SCROLLBAR_ATTRIBUTE),
    rtl: style.direction === "rtl",
  };
  if (container.root) {
    const view = element.ownerDocument.defaultView;
    return {
      ...shared,
      overflowsX:
        rootAllowsScroll(style.overflowX) &&
        element.scrollWidth > element.clientWidth,
      overflowsY:
        rootAllowsScroll(style.overflowY) &&
        element.scrollHeight > element.clientHeight,
      paddingBox: null,
      reservesX: (view?.innerHeight ?? 0) - element.clientHeight > 0,
      reservesY: (view?.innerWidth ?? 0) - element.clientWidth > 0,
    };
  }
  const rect = element.getBoundingClientRect();
  const borders = dragSelectableBorders(style);
  return {
    ...shared,
    overflowsX:
      scrollingOverflow(style.overflowX) &&
      element.scrollWidth > element.clientWidth,
    overflowsY:
      scrollingOverflow(style.overflowY) &&
      element.scrollHeight > element.clientHeight,
    paddingBox: {
      bottom: rect.bottom - borders.bottom,
      left: rect.left + borders.left,
      right: rect.right - borders.right,
      top: rect.top + borders.top,
    },
    reservesX: horizontalScrollbarSpace(element, borders) > 0,
    reservesY: verticalScrollbarSpace(element, borders) > 0,
  };
}

function outsideClientArea(
  client: DragSelectableRect,
  point: DragSelectablePoint,
): boolean {
  const tolerance = CLASSIC_SCROLLBAR_TOLERANCE;
  return (
    point.x < client.left - tolerance ||
    point.x > client.right + tolerance ||
    point.y < client.top - tolerance ||
    point.y > client.bottom + tolerance
  );
}

function scrollingOverflow(value: string): boolean {
  return value === "auto" || value === "scroll" || value === "overlay";
}

function rootAllowsScroll(value: string): boolean {
  return value !== "hidden" && value !== "clip";
}
