/**
 * Web pointer-drag selection for the data grid, in three modes:
 * - cell   — drag from a cell paints a rectangular range + a marquee box;
 * - row    — drag from the gutter selects whole rows (all columns);
 * - column — drag from a header selects whole columns (all rows).
 *
 * The cell under the pointer is hit-tested via `elementFromPoint`, so it follows
 * flex widths + scroll. Dragging into an edge zone auto-scrolls the body and
 * keeps extending. No-op outside the browser; native uses tap + keyboard.
 */
import { useCallback, useEffect, useRef, type MutableRefObject } from "react";

import { announceGrid } from "./dataGridAnnounce";
import {
  attachDataGridDragListeners,
  autoScrollDelta,
  findGridScrollers,
  hitTestDataGrid,
  selectionBoxRect,
  type DataGridCellNode,
  type DataGridNodeMap,
} from "./dataGridDragDom";
import {
  cellKey,
  cellRefEquals,
  selectionCount,
} from "./dataGridSelectionModel";
import type { DataGridCellRef, DataGridSelection } from "./types";

export type DataGridDragBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type DragMode = "cell" | "row" | "column";
type Session = {
  mode: DragMode;
  anchor: DataGridCellRef;
  lastFocus: DataGridCellRef;
  /** Pointer position at press, so any real movement counts as a drag. */
  startPoint: { x: number; y: number } | null;
  /** Set once the press becomes a drag: moved past the threshold, or reached
   * another cell (→ a range, not a tap-to-edit click). */
  extended: boolean;
  /** Fired on release if the press never became a drag — a plain click. */
  onTap?: () => void;
};

/** Pointer travel (px) beyond which a press is a drag, not a tap-to-edit click. */
const TAP_MOVE_THRESHOLD = 4;

/** Read the viewport point from a (synthetic or native) pointer event. */
function pointFromEvent(rawEvent: unknown): { x: number; y: number } | null {
  const event = rawEvent as {
    clientX?: number;
    clientY?: number;
    nativeEvent?: { clientX?: number; clientY?: number };
  };
  const x = event.clientX ?? event.nativeEvent?.clientX;
  const y = event.clientY ?? event.nativeEvent?.clientY;
  return typeof x === "number" && typeof y === "number" ? { x, y } : null;
}

type PointerLike = {
  button?: number;
  pointerType?: string;
  nativeEvent?: { button?: number; pointerType?: string };
};

export type UseDataGridDragOptions = {
  cellNodesRef: MutableRefObject<Map<string, DataGridCellNode>>;
  gutterNodesRef: MutableRefObject<DataGridNodeMap>;
  headerNodesRef: MutableRefObject<DataGridNodeMap>;
  gridNodeRef: MutableRefObject<Element | null>;
  setSelection: (selection: DataGridSelection) => void;
  selectionAnchor: DataGridCellRef | null;
  rowIds: readonly string[];
  columnIds: readonly string[];
  announceActive: (ref: DataGridCellRef) => void;
  onDragBox: (box: DataGridDragBox | null) => void;
};

export function useDataGridDrag(options: UseDataGridDragOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const sessionRef = useRef<Session | null>(null);
  const removeRef = useRef<(() => void) | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const announceCount = useCallback((selection: DataGridSelection) => {
    const { rowIds, columnIds } = optionsRef.current;
    const count = selectionCount(selection, rowIds, columnIds);
    announceGrid(`${count} cell${count === 1 ? "" : "s"} selected`);
  }, []);

  const updateBox = useCallback(() => {
    const { gridNodeRef, cellNodesRef, onDragBox } = optionsRef.current;
    const session = sessionRef.current;
    const grid = gridNodeRef.current;
    if (!session || session.mode !== "cell" || !grid) {
      onDragBox(null);
      return;
    }
    // Anchor and focus are opposite corners, so their union is the marquee.
    const anchor = cellNodesRef.current.get(cellKey(session.anchor))?.node;
    const focus = cellNodesRef.current.get(cellKey(session.lastFocus))?.node;
    if (anchor?.getBoundingClientRect && focus?.getBoundingClientRect) {
      const g = grid.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      const f = focus.getBoundingClientRect();
      const left = Math.min(a.left, f.left);
      const top = Math.min(a.top, f.top);
      onDragBox({
        left: left - g.left,
        top: top - g.top,
        width: Math.max(a.right, f.right) - left,
        height: Math.max(a.bottom, f.bottom) - top,
      });
    } else {
      onDragBox(selectionBoxRect(grid));
    }
  }, []);

  const focusFrom = useCallback(
    (mode: DragMode, hit: { rowId?: string; columnId?: string }) => {
      const { rowIds, columnIds } = optionsRef.current;
      if (mode === "cell" && hit.rowId && hit.columnId) {
        return { rowId: hit.rowId, columnId: hit.columnId };
      }
      if (mode === "row" && hit.rowId) {
        return { rowId: hit.rowId, columnId: columnIds[columnIds.length - 1] };
      }
      if (mode === "column" && hit.columnId) {
        return { rowId: rowIds[rowIds.length - 1], columnId: hit.columnId };
      }
      return null;
    },
    [],
  );

  const extend = useCallback(
    (point: { x: number; y: number }) => {
      const session = sessionRef.current;
      if (!session) {
        return;
      }
      lastPointRef.current = point;
      // Any travel past the threshold makes this a drag, not a click, so a
      // release no longer opens the editor (see the tap handling in beginSession)
      // — even when the pointer leaves the data cells (gutter / header / off-grid).
      if (
        !session.extended &&
        session.startPoint &&
        (Math.abs(point.x - session.startPoint.x) > TAP_MOVE_THRESHOLD ||
          Math.abs(point.y - session.startPoint.y) > TAP_MOVE_THRESHOLD)
      ) {
        session.extended = true;
      }
      const { cellNodesRef, gutterNodesRef, headerNodesRef, setSelection } =
        optionsRef.current;
      const hit = hitTestDataGrid(
        cellNodesRef.current.values(),
        gutterNodesRef.current,
        headerNodesRef.current,
        point.x,
        point.y,
      );
      const focus = focusFrom(session.mode, hit);
      if (focus && !cellRefEquals(focus, session.lastFocus)) {
        session.lastFocus = focus;
        // Reaching another cell is also a drag — covers a sub-threshold nudge
        // across a border and auto-scroll extension where the pointer barely
        // moves — so a release no longer opens the editor.
        session.extended = true;
        const next: DataGridSelection = { anchor: session.anchor, focus };
        setSelection(next);
        announceCount(next);
      }
      updateBox();
    },
    [announceCount, focusFrom, updateBox],
  );

  const stopAutoScroll = useCallback(() => {
    if (
      rafRef.current !== null &&
      typeof cancelAnimationFrame !== "undefined"
    ) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = null;
  }, []);

  const startAutoScroll = useCallback(() => {
    if (
      rafRef.current !== null ||
      typeof requestAnimationFrame === "undefined"
    ) {
      return;
    }
    const step = () => {
      rafRef.current = null;
      const point = lastPointRef.current;
      const grid = optionsRef.current.gridNodeRef.current;
      if (!sessionRef.current || !point || !grid) {
        return;
      }
      const { horizontal, vertical } = findGridScrollers(grid);
      const scroller = vertical ?? grid;
      const { dx, dy } = autoScrollDelta(
        point,
        scroller.getBoundingClientRect(),
      );
      if (dx === 0 && dy === 0) {
        return; // out of the edge zone — stop until the next move restarts it
      }
      if (horizontal && dx !== 0) {
        horizontal.scrollLeft += dx;
      }
      if (vertical && dy !== 0) {
        vertical.scrollTop += dy;
      }
      extend(point);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [extend]);

  const endDrag = useCallback(() => {
    removeRef.current?.();
    removeRef.current = null;
    stopAutoScroll();
    sessionRef.current = null;
    lastPointRef.current = null;
    optionsRef.current.onDragBox(null);
  }, [stopAutoScroll]);

  const beginSession = useCallback(
    (
      mode: DragMode,
      anchor: DataGridCellRef,
      focus: DataGridCellRef,
      rawEvent: unknown,
      onTap?: () => void,
    ) => {
      if (typeof document === "undefined") {
        return;
      }
      const event = rawEvent as PointerLike;
      const button = event.button ?? event.nativeEvent?.button;
      if (button !== undefined && button !== 0) {
        return; // primary button only
      }
      if ((event.pointerType ?? event.nativeEvent?.pointerType) === "touch") {
        return; // touch scrolls; no marquee on touch in Phase 1
      }
      const next: DataGridSelection = { anchor, focus };
      optionsRef.current.setSelection(next);
      sessionRef.current = {
        mode,
        anchor,
        lastFocus: focus,
        startPoint: pointFromEvent(rawEvent),
        extended: false,
        onTap,
      };
      if (mode === "cell" && cellRefEquals(anchor, focus)) {
        optionsRef.current.announceActive(focus);
      } else {
        announceCount(next);
      }
      updateBox();
      removeRef.current?.();
      removeRef.current = attachDataGridDragListeners({
        onMove: (x, y) => {
          extend({ x, y });
          startAutoScroll();
        },
        // A cell press released in place (never dragged) is a plain click; fire
        // its tap callback (opens the editor on a click of the active cell).
        // `committed` is true only for a real pointerup — a pointercancel or
        // window blur ends the drag without editing (the press was aborted).
        onEnd: (committed) => {
          const session = sessionRef.current;
          const tap =
            committed && session && session.mode === "cell" && !session.extended
              ? session.onTap
              : undefined;
          endDrag();
          tap?.();
        },
      });
    },
    [announceCount, endDrag, extend, startAutoScroll, updateBox],
  );

  const beginCellDrag = useCallback(
    (ref: DataGridCellRef, rawEvent: unknown, onTap?: () => void) => {
      const { selectionAnchor } = optionsRef.current;
      const event = rawEvent as {
        shiftKey?: boolean;
        nativeEvent?: { shiftKey?: boolean };
      };
      const shift = event.shiftKey ?? event.nativeEvent?.shiftKey ?? false;
      const anchor = shift && selectionAnchor ? selectionAnchor : ref;
      // Shift is a range modifier, so a shift-press never taps-to-edit.
      beginSession("cell", anchor, ref, rawEvent, shift ? undefined : onTap);
    },
    [beginSession],
  );

  const beginRowDrag = useCallback(
    (rowId: string, rawEvent: unknown) => {
      const { columnIds } = optionsRef.current;
      const anchor = { rowId, columnId: columnIds[0] };
      const focus = { rowId, columnId: columnIds[columnIds.length - 1] };
      beginSession("row", anchor, focus, rawEvent);
    },
    [beginSession],
  );

  const beginColumnDrag = useCallback(
    (columnId: string, rawEvent: unknown) => {
      const { rowIds } = optionsRef.current;
      const anchor = { rowId: rowIds[0], columnId };
      const focus = { rowId: rowIds[rowIds.length - 1], columnId };
      beginSession("column", anchor, focus, rawEvent);
    },
    [beginSession],
  );

  useEffect(() => () => endDrag(), [endDrag]);

  return { beginCellDrag, beginRowDrag, beginColumnDrag };
}
