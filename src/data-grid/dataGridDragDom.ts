/**
 * Web-only DOM helpers for cell-range drag selection.
 *
 * Hit-testing uses `document.elementFromPoint` against the grid's registered cell
 * nodes, so it follows flex column widths and scroll offset without any geometry
 * math. The pattern mirrors the drag-select primitive's document-level pointer
 * listeners. All functions no-op outside the browser.
 */
import type { DataGridCellRef } from "./types";

/** A registered cell host node paired with its cell ref. */
export type DataGridCellNode = {
  node: {
    contains?: (other: Node) => boolean;
    focus?: () => void;
    getBoundingClientRect?: () => DOMRect;
  };
  ref: DataGridCellRef;
};

/** A registry of gutter (rowId) or header (columnId) nodes, keyed by id. */
export type DataGridNodeMap = Map<string, { contains?: (n: Node) => boolean }>;

/** The row / column under the point, hit-testing cells, then gutter + headers. */
export function hitTestDataGrid(
  cellNodes: Iterable<DataGridCellNode>,
  gutterNodes: DataGridNodeMap,
  headerNodes: DataGridNodeMap,
  clientX: number,
  clientY: number,
): { rowId?: string; columnId?: string } {
  if (typeof document === "undefined") {
    return {};
  }
  const element = document.elementFromPoint(clientX, clientY);
  if (!element) {
    return {};
  }
  for (const { node, ref } of cellNodes) {
    if (node.contains?.(element)) {
      return { rowId: ref.rowId, columnId: ref.columnId };
    }
  }
  for (const [rowId, node] of gutterNodes) {
    if (node.contains?.(element)) {
      return { rowId };
    }
  }
  for (const [columnId, node] of headerNodes) {
    if (node.contains?.(element)) {
      return { columnId };
    }
  }
  return {};
}

/** Whether a pointer event started on an interactive control (button/input). */
export function isInteractiveDragTarget(event: unknown): boolean {
  const target = (event as { target?: unknown }).target;
  if (typeof Element === "undefined" || !(target instanceof Element)) {
    return false;
  }
  return Boolean(target.closest("button, a, input, [role='button']"));
}

/** The first horizontally- and vertically-scrollable descendants of the grid. */
export function findGridScrollers(gridNode: Element): {
  horizontal: HTMLElement | null;
  vertical: HTMLElement | null;
} {
  let horizontal: HTMLElement | null = null;
  let vertical: HTMLElement | null = null;
  for (const element of gridNode.querySelectorAll<HTMLElement>("*")) {
    if (!horizontal && element.scrollWidth > element.clientWidth + 1) {
      horizontal = element;
    }
    if (!vertical && element.scrollHeight > element.clientHeight + 1) {
      vertical = element;
    }
    if (horizontal && vertical) {
      break;
    }
  }
  return { horizontal, vertical };
}

/** Scroll delta while the pointer sits in the edge zone of a scroll rect. */
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

/** Grid-relative bounding box of the rendered selected cells (the marquee). */
export function selectionBoxRect(
  gridNode: Element,
): { left: number; top: number; width: number; height: number } | null {
  const selected = gridNode.querySelectorAll<HTMLElement>(
    '[role="gridcell"][aria-selected="true"]',
  );
  if (selected.length === 0) {
    return null;
  }
  const grid = gridNode.getBoundingClientRect();
  let minL = Infinity;
  let minT = Infinity;
  let maxR = -Infinity;
  let maxB = -Infinity;
  for (const element of selected) {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0) {
      continue;
    }
    minL = Math.min(minL, rect.left);
    minT = Math.min(minT, rect.top);
    maxR = Math.max(maxR, rect.right);
    maxB = Math.max(maxB, rect.bottom);
  }
  if (minL === Infinity) {
    return null;
  }
  return {
    left: minL - grid.left,
    top: minT - grid.top,
    width: maxR - minL,
    height: maxB - minT,
  };
}

/** The cell ref under the viewport point, or `null` when none is registered. */
export function cellRefFromPoint(
  nodes: Iterable<DataGridCellNode>,
  clientX: number,
  clientY: number,
): DataGridCellRef | null {
  if (typeof document === "undefined") {
    return null;
  }
  const element = document.elementFromPoint(clientX, clientY);
  if (!element) {
    return null;
  }
  for (const { node, ref } of nodes) {
    if (node.contains?.(element)) {
      return ref;
    }
  }
  return null;
}

export type DataGridDragHandlers = {
  onMove: (clientX: number, clientY: number) => void;
  onEnd: () => void;
};

/**
 * Attach document-level pointer listeners for the duration of a drag and return
 * a disposer. Move events `preventDefault` to suppress native text selection.
 */
export function attachDataGridDragListeners(
  handlers: DataGridDragHandlers,
): () => void {
  if (typeof document === "undefined") {
    return () => undefined;
  }
  const move = (event: PointerEvent) => {
    event.preventDefault();
    handlers.onMove(event.clientX, event.clientY);
  };
  const end = () => handlers.onEnd();
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
