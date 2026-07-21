/**
 * Keyboard navigation for the data grid: arrow movement, Shift-extend, Home/End,
 * Tab, Ctrl/Cmd+A, Enter-to-edit, clipboard (Ctrl/Cmd+C/X/V), Delete/Backspace to
 * clear, and Escape to dismiss the copy marquee. Composed by
 * {@link useDataGridController}.
 *
 * Movement math is the pure {@link nextGridCell}; this hook wires it to the
 * controller's selection + focus, scrolling the target row into view (virtualized
 * body) and re-focusing the cell next frame after a scroll mounts it.
 */
import { useCallback } from "react";

import { announceGrid } from "./dataGridAnnounce";

import { isGridNavigationKey, nextGridCell } from "./dataGridKeyboardModel";
import { selectAll, selectionCount } from "./dataGridSelectionModel";
import type { DataGridCellRef, DataGridSelection } from "./types";

type GridKeyEvent = {
  key?: string;
  shiftKey?: boolean;
  metaKey?: boolean;
  ctrlKey?: boolean;
  nativeEvent?: {
    key?: string;
    shiftKey?: boolean;
    metaKey?: boolean;
    ctrlKey?: boolean;
  };
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

export type UseDataGridKeyboardOptions = {
  rowIds: readonly string[];
  columnIds: readonly string[];
  activeCell: DataGridCellRef | null;
  tabStop: DataGridCellRef | null;
  activate: (ref: DataGridCellRef, options?: { extend?: boolean }) => void;
  setSelection: (selection: DataGridSelection) => void;
  refAt: (row: number, col: number) => DataGridCellRef | null;
  focusCell: (ref: DataGridCellRef) => void;
  onRequestEdit?: (ref: DataGridCellRef) => void;
  onNavigateToRow?: (rowIndex: number) => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  /** Clear the selected cells (Delete / Backspace). */
  onClearSelection?: () => void;
  /** Dismiss the copy/cut marquee (Escape). */
  onCancelCopy?: () => void;
};

export function useDataGridKeyboard({
  rowIds,
  columnIds,
  activeCell,
  tabStop,
  activate,
  setSelection,
  refAt,
  focusCell,
  onRequestEdit,
  onNavigateToRow,
  onCopy,
  onCut,
  onPaste,
  onClearSelection,
  onCancelCopy,
}: UseDataGridKeyboardOptions) {
  // Focus a cell, scrolling its row into view (virtualized body) and re-focusing
  // next frame for a cell the scroll just mounted.
  const focusWithScroll = useCallback(
    (ref: DataGridCellRef, rowIndex: number) => {
      onNavigateToRow?.(rowIndex);
      focusCell(ref);
      if (typeof requestAnimationFrame !== "undefined") {
        requestAnimationFrame(() => focusCell(ref));
      }
    },
    [focusCell, onNavigateToRow],
  );

  // Advance the active cell down one row (used after committing an edit).
  const moveActiveDown = useCallback(() => {
    if (!activeCell) {
      return;
    }
    const row = rowIds.indexOf(activeCell.rowId);
    const col = columnIds.indexOf(activeCell.columnId);
    if (row < 0 || col < 0) {
      return;
    }
    const next = nextGridCell({
      key: "ArrowDown",
      position: { row, col },
      rowCount: rowIds.length,
      colCount: columnIds.length,
    });
    const ref = next && refAt(next.row, next.col);
    if (!ref || !next) {
      return;
    }
    activate(ref);
    focusWithScroll(ref, next.row);
  }, [activate, activeCell, columnIds, focusWithScroll, refAt, rowIds]);

  const handleCellKeyDown = useCallback(
    (raw: unknown) => {
      const event = raw as GridKeyEvent;
      const key = event.nativeEvent?.key ?? event.key ?? "";
      const shift = event.shiftKey ?? event.nativeEvent?.shiftKey ?? false;
      const ctrl =
        (event.ctrlKey ?? event.nativeEvent?.ctrlKey ?? false) ||
        (event.metaKey ?? event.nativeEvent?.metaKey ?? false);

      if (ctrl && (key === "a" || key === "A")) {
        event.preventDefault?.();
        const all = selectAll(rowIds, columnIds);
        setSelection(all);
        announceGrid(
          `${selectionCount(all, rowIds, columnIds)} cells selected`,
        );
        return;
      }
      if (ctrl && (key === "c" || key === "C")) {
        event.preventDefault?.();
        onCopy?.();
        return;
      }
      if (ctrl && (key === "x" || key === "X")) {
        event.preventDefault?.();
        onCut?.();
        return;
      }
      if (ctrl && (key === "v" || key === "V")) {
        event.preventDefault?.();
        onPaste?.();
        return;
      }
      // Delete / Backspace clear the selected cells (like a spreadsheet). Only
      // reachable when not editing — the open editor owns its own key handling.
      if (!ctrl && (key === "Delete" || key === "Backspace")) {
        event.preventDefault?.();
        onClearSelection?.();
        return;
      }
      // Escape dismisses the copy/cut marquee.
      if (key === "Escape") {
        onCancelCopy?.();
        return;
      }

      // Navigate from the active cell, or the fallback Tab stop when the grid was
      // tabbed into without a selection.
      const origin = activeCell ?? tabStop;
      if (!origin) {
        return;
      }
      const row = rowIds.indexOf(origin.rowId);
      const col = columnIds.indexOf(origin.columnId);
      if (row < 0 || col < 0) {
        return;
      }

      if (key === "Enter") {
        event.preventDefault?.();
        onRequestEdit?.(origin);
        return;
      }

      if (!isGridNavigationKey(key)) {
        return;
      }
      const nextPosition = nextGridCell({
        key,
        position: { row, col },
        rowCount: rowIds.length,
        colCount: columnIds.length,
        ctrl,
        shiftTab: shift && key === "Tab",
      });
      if (!nextPosition) {
        return;
      }
      const nextRef = refAt(nextPosition.row, nextPosition.col);
      if (!nextRef) {
        return;
      }
      event.preventDefault?.();
      event.stopPropagation?.();
      activate(nextRef, { extend: shift && key !== "Tab" });
      focusWithScroll(nextRef, nextPosition.row);
    },
    [
      activate,
      activeCell,
      columnIds,
      focusWithScroll,
      onCopy,
      onCut,
      onPaste,
      onClearSelection,
      onCancelCopy,
      onRequestEdit,
      refAt,
      rowIds,
      setSelection,
      tabStop,
    ],
  );

  return { handleCellKeyDown, moveActiveDown };
}
