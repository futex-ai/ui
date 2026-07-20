/**
 * Web pointer + keyboard column resizing for the data grid.
 *
 * A resize handle on each header cell's right edge drives this hook: a pointer
 * drag (or the Left/Right arrow keys on the focused handle) changes the dragged
 * column's width, clamped to its `[minWidth, maxWidth]` bounds. It mirrors the
 * drag-select pattern — the move/up listeners live on the document, so the drag
 * follows the pointer past the header and outside the grid.
 *
 * The grid owns the widths in an internal override map; `onColumnResize` (when
 * given) fires as a *change notification* so a consumer can persist the width.
 * Starting a resize first freezes every still-flexing column to its current
 * pixel width, so dragging one column changes only that column (the handle
 * tracks the pointer and neighbors stay put) instead of re-sharing the flex
 * space. No-op outside the browser; native renders no resize handle.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

import {
  clampColumnWidth,
  type ColumnWidthOverrides,
} from "./dataGridColumnWidths";
import { attachDataGridDragListeners } from "./dataGridDragDom";
import type { DataGridColumn } from "./types";

/** Width change (px) per arrow-key press on a focused resize handle. */
const KEYBOARD_STEP = 16;

export type UseDataGridColumnResizeOptions = {
  /** Visible columns, used to resolve each column's resize bounds + flex state. */
  columns: DataGridColumn[];
  /** Current resolved pixel width per column id (used to freeze flex columns). */
  resolvedWidthsRef: MutableRefObject<Record<string, number>>;
  /** Change notification fired as a column resizes (the grid still owns widths). */
  onColumnResize?: (columnId: string, width: number) => void;
};

export type DataGridColumnResize = {
  /** Per-column widths from user resizes, keyed by column id. */
  columnWidthOverrides: ColumnWidthOverrides;
  /** The column currently being pointer-dragged, for handle styling. */
  resizingColumnId: string | null;
  /** Start a pointer resize of `columnId` from its current `startWidth`. */
  beginColumnResize: (
    columnId: string,
    startWidth: number,
    event: unknown,
  ) => void;
  /** Nudge `columnId`'s width by one keyboard step in `direction` (±1). */
  resizeColumnByStep: (
    columnId: string,
    direction: 1 | -1,
    currentWidth: number,
  ) => void;
};

type Session = { columnId: string; startX: number; startWidth: number };

export function useDataGridColumnResize({
  columns,
  resolvedWidthsRef,
  onColumnResize,
}: UseDataGridColumnResizeOptions): DataGridColumnResize {
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [resizingColumnId, setResizingColumnId] = useState<string | null>(null);

  // Latest columns / callback read at drag time without re-binding listeners.
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const onColumnResizeRef = useRef(onColumnResize);
  onColumnResizeRef.current = onColumnResize;

  const sessionRef = useRef<Session | null>(null);
  const removeRef = useRef<(() => void) | null>(null);

  const apply = useCallback((column: DataGridColumn, rawWidth: number) => {
    const width = clampColumnWidth(column, rawWidth);
    setOverrides((prev) =>
      prev[column.id] === width ? prev : { ...prev, [column.id]: width },
    );
    onColumnResizeRef.current?.(column.id, width);
  }, []);

  // Pin every still-flexing column (no fixed width / override) to its current
  // pixel width, so resizing one column no longer re-shares the flex space.
  const freezeFlexColumns = useCallback(() => {
    setOverrides((prev) => {
      let next = prev;
      for (const column of columnsRef.current) {
        const flexing =
          column.width === undefined && prev[column.id] === undefined;
        const resolved = resolvedWidthsRef.current[column.id];
        if (flexing && typeof resolved === "number") {
          if (next === prev) {
            next = { ...prev };
          }
          next[column.id] = clampColumnWidth(column, resolved);
        }
      }
      return next;
    });
  }, [resolvedWidthsRef]);

  const endResize = useCallback(() => {
    removeRef.current?.();
    removeRef.current = null;
    sessionRef.current = null;
    setResizingColumnId(null);
    if (typeof document !== "undefined") {
      document.body.style.cursor = "";
    }
  }, []);

  const beginColumnResize = useCallback(
    (columnId: string, startWidth: number, rawEvent: unknown) => {
      if (typeof document === "undefined") {
        return;
      }
      const event = rawEvent as {
        button?: number;
        clientX?: number;
        pointerType?: string;
        nativeEvent?: {
          button?: number;
          clientX?: number;
          pointerType?: string;
        };
      };
      const button = event.button ?? event.nativeEvent?.button;
      if (button !== undefined && button !== 0) {
        return; // primary button only
      }
      if ((event.pointerType ?? event.nativeEvent?.pointerType) === "touch") {
        return; // touch scrolls; no resize on touch (matches drag-select)
      }
      // Freeze flex neighbors first so only this column's edge moves.
      freezeFlexColumns();
      const startX = event.clientX ?? event.nativeEvent?.clientX ?? 0;
      sessionRef.current = { columnId, startX, startWidth };
      setResizingColumnId(columnId);
      // A grid-wide resize cursor while dragging, even off the 8px handle.
      document.body.style.cursor = "col-resize";
      removeRef.current?.();
      removeRef.current = attachDataGridDragListeners({
        onMove: (clientX) => {
          const session = sessionRef.current;
          if (!session) {
            return;
          }
          const column = columnsRef.current.find(
            (candidate) => candidate.id === session.columnId,
          );
          if (column) {
            apply(column, session.startWidth + (clientX - session.startX));
          }
        },
        onEnd: endResize,
      });
    },
    [apply, endResize, freezeFlexColumns],
  );

  const resizeColumnByStep = useCallback(
    (columnId: string, direction: 1 | -1, currentWidth: number) => {
      const column = columnsRef.current.find(
        (candidate) => candidate.id === columnId,
      );
      if (!column) {
        return;
      }
      freezeFlexColumns();
      apply(column, currentWidth + direction * KEYBOARD_STEP);
    },
    [apply, freezeFlexColumns],
  );

  // Tear down any in-flight drag (and the body cursor) on unmount.
  useEffect(() => () => endResize(), [endResize]);

  return useMemo(
    () => ({
      columnWidthOverrides: overrides,
      resizingColumnId,
      beginColumnResize,
      resizeColumnByStep,
    }),
    [overrides, resizingColumnId, beginColumnResize, resizeColumnByStep],
  );
}
