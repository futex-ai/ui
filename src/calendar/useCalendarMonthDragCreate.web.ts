/**
 * Web drag-to-create for the month grid. Dragging across day cells sweeps out an
 * all-day date range — highlighted live as a `draft` and, on release, handed to
 * `onCreateEvent` as a normalized `CalendarDraftRange`. A plain click (no
 * cross-cell movement) is left to the cell's own press handler so it still
 * creates a single-day event, on web and native alike.
 *
 * The drag starts from a **capture-phase** `pointerdown` listener on the
 * document, not a per-cell handler: RNW's `Pressable` runs `stopPropagation()`
 * in its press responder, so a bubble-phase `onPointerDown` on the cell (or an
 * ancestor) never fires. A document capture listener fires before the responder;
 * it is scoped to this grid via the container ref, and the start/hovered cell is
 * found by hit-testing the cells' DOM rects (each carries its date in
 * `data-testid`). Touch and non-left buttons are ignored, and everything is
 * guarded by `typeof document`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { compareIso } from "../date/dateMath";
import type { CalendarDraftRange } from "./types";

/** Prefix of each day cell's `testID`; the ISO date is the remainder. */
const CELL_TESTID_PREFIX = "calendar-month-cell-";

/** The live drag-to-create state + grid-container binder returned by the hook. */
export type CalendarMonthDragCreate = {
  /** The in-progress all-day date range to highlight, or null when idle. */
  draft: { start: string; end: string } | null;
  /** Spread onto the month grid container View to enable drag-to-create. */
  bindGrid: { ref: (node: unknown) => void };
  /** True exactly once after a drag created a range, to swallow the cell press. */
  consumePressSuppression: () => boolean;
};

/** The minimal DOM surface of the grid container node we touch. */
type GridNode = {
  contains?: (other: unknown) => boolean;
  querySelectorAll?: (selector: string) => ArrayLike<CellNode>;
} | null;

/** The minimal DOM surface of a day cell node we measure. */
type CellNode = {
  getBoundingClientRect: () => DOMRect;
  getAttribute: (name: string) => string | null;
};

/** A day cell measured at drag start, for pointer hit-testing during the drag. */
type MeasuredCell = {
  date: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

/** An in-flight drag: the start/current cell dates + whether it has moved. */
type DragSession = {
  startDate: string;
  endDate: string;
  moved: boolean;
  cells: MeasuredCell[];
};

/** Order two ISO dates into an inclusive `{ start, end }` range. */
function normalizeRange(a: string, b: string): { start: string; end: string } {
  return compareIso(a, b) <= 0 ? { start: a, end: b } : { start: b, end: a };
}

/** Measure every day cell inside the grid (rect + its date from `data-testid`). */
function measureCells(grid: GridNode): MeasuredCell[] {
  const out: MeasuredCell[] = [];
  const nodes = grid?.querySelectorAll?.(
    `[data-testid^="${CELL_TESTID_PREFIX}"]`,
  );
  if (!nodes) {
    return out;
  }
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    const testid = node.getAttribute("data-testid") ?? "";
    const rect = node.getBoundingClientRect();
    out.push({
      date: testid.slice(CELL_TESTID_PREFIX.length),
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
    });
  }
  return out;
}

/** The date of the measured cell under `(x, y)`, or null when outside the grid. */
function cellDateAt(
  cells: MeasuredCell[],
  x: number,
  y: number,
): string | null {
  for (const cell of cells) {
    if (
      x >= cell.left &&
      x <= cell.right &&
      y >= cell.top &&
      y <= cell.bottom
    ) {
      return cell.date;
    }
  }
  return null;
}

export function useCalendarMonthDragCreate(opts: {
  onCreateEvent?: (range: CalendarDraftRange) => void;
}): CalendarMonthDragCreate {
  // Keep the latest callback in a ref so the listeners (attached once) always
  // call through without re-binding.
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const gridRef = useRef<GridNode>(null);
  const sessionRef = useRef<DragSession | null>(null);
  const removeDocListenersRef = useRef<(() => void) | null>(null);
  // Set on a drag commit so the cell press that may follow does not also create
  // a single-day event; cleared at the next pointerdown so a stale flag from a
  // drag that produced no press can never suppress a later click.
  const suppressRef = useRef(false);
  const [draft, setDraft] = useState<CalendarMonthDragCreate["draft"]>(null);

  const finish = useCallback((commit: boolean) => {
    removeDocListenersRef.current?.();
    removeDocListenersRef.current = null;
    const session = sessionRef.current;
    sessionRef.current = null;
    setDraft(null);
    // Only a real cross-cell drag creates here; a plain click is handled by the
    // cell's own press so single-day create still works on web and native.
    if (!session || !commit || !session.moved) {
      return;
    }
    const { start, end } = normalizeRange(session.startDate, session.endDate);
    suppressRef.current = true;
    optsRef.current.onCreateEvent?.({ start, end, allDay: true });
  }, []);

  const attachDocListeners = useCallback(() => {
    if (typeof document === "undefined") {
      return;
    }
    const handleMove = (event: PointerEvent) => {
      const session = sessionRef.current;
      if (!session) {
        return;
      }
      event.preventDefault();
      const hovered = cellDateAt(session.cells, event.clientX, event.clientY);
      if (hovered && hovered !== session.startDate) {
        session.moved = true;
      }
      if (hovered) {
        session.endDate = hovered;
      }
      if (session.moved) {
        setDraft(normalizeRange(session.startDate, session.endDate));
      }
    };
    const handleUp = () => finish(true);
    const handleCancel = () => finish(false);
    document.addEventListener("pointermove", handleMove, true);
    document.addEventListener("pointerup", handleUp, true);
    document.addEventListener("pointercancel", handleCancel, true);
    // Non-capture so this only fires for a real *window* blur (alt-tab) — with
    // capture it would also catch element blur as focus moves between the
    // focusable day-cell pressables, cancelling the drag the instant it starts.
    window.addEventListener("blur", handleCancel);
    removeDocListenersRef.current = () => {
      document.removeEventListener("pointermove", handleMove, true);
      document.removeEventListener("pointerup", handleUp, true);
      document.removeEventListener("pointercancel", handleCancel, true);
      window.removeEventListener("blur", handleCancel);
    };
  }, [finish]);

  const setGridNode = useCallback((node: unknown) => {
    gridRef.current = (node as GridNode) ?? null;
  }, []);

  const consumePressSuppression = useCallback(() => {
    if (suppressRef.current) {
      suppressRef.current = false;
      return true;
    }
    return false;
  }, []);

  // A capture-phase `pointerdown` on the document reliably fires before RNW's
  // Pressable runs `stopPropagation()` in its press responder. The press is
  // scoped to this grid via the container ref, and the start cell is found by
  // hit-testing the cells' rects.
  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }
    const handlePointerDown = (event: PointerEvent) => {
      // A fresh interaction clears any stale suppression from a prior drag that
      // ended without a following cell press.
      suppressRef.current = false;
      if (event.button !== undefined && event.button !== 0) {
        return;
      }
      if (event.pointerType === "touch") {
        return;
      }
      const grid = gridRef.current;
      if (!grid?.contains?.(event.target)) {
        return;
      }
      const cells = measureCells(grid);
      const startDate = cellDateAt(cells, event.clientX, event.clientY);
      if (!startDate) {
        return;
      }
      sessionRef.current = {
        startDate,
        endDate: startDate,
        moved: false,
        cells,
      };
      attachDocListeners();
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      removeDocListenersRef.current?.();
    };
  }, [attachDocListeners]);

  const bindGrid = useMemo(() => ({ ref: setGridNode }), [setGridNode]);

  return { draft, bindGrid, consumePressSuppression };
}
