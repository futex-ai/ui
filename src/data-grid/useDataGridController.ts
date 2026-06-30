/**
 * The data grid's interaction brain: selection state (controlled or internal),
 * the active cell, keyboard navigation + range extension, roving focus, and edit
 * entry. Pointer-drag selection is composed from {@link useDataGridDrag}.
 *
 * The view layer (`DataGrid` and its cells) stays thin — it reads `isActiveCell`
 * / `isTabStop` and forwards pointer + key events to the handlers here. The pure
 * math lives in {@link dataGridSelectionModel} / {@link dataGridKeyboardModel}.
 */
import { useCallback, useMemo, useRef, useState } from "react";

import { announceGrid } from "./dataGridAnnounce";

import type { DataGridCellNode } from "./dataGridDragDom";
import {
  cellKey,
  cellRefEquals,
  rangeRect,
  selectionCount,
  singleCell,
} from "./dataGridSelectionModel";
import { useDataGridDrag } from "./useDataGridDrag";
import { useDataGridKeyboard } from "./useDataGridKeyboard";
import type {
  DataGridCellRef,
  DataGridColumn,
  DataGridRow,
  DataGridSelection,
} from "./types";

const EMPTY_SELECTION: DataGridSelection = { anchor: null, focus: null };

export type DataGridControllerOptions = {
  columns: DataGridColumn[];
  rows: DataGridRow[];
  selection?: DataGridSelection;
  onSelectionChange?: (selection: DataGridSelection) => void;
  /** Called when a cell should start editing (Enter / double-press). */
  onRequestEdit?: (ref: DataGridCellRef) => void;
  /** Scroll a row index into view (wired to the virtualized body on keyboard nav). */
  onNavigateToRow?: (rowIndex: number) => void;
};

export function useDataGridController({
  columns,
  rows,
  selection: controlledSelection,
  onSelectionChange,
  onRequestEdit,
  onNavigateToRow,
}: DataGridControllerOptions) {
  const visibleColumns = useMemo(
    () => columns.filter((column) => !column.hidden),
    [columns],
  );
  const columnIds = useMemo(
    () => visibleColumns.map((column) => column.id),
    [visibleColumns],
  );
  const rowIds = useMemo(() => rows.map((row) => row.id), [rows]);

  const [internalSelection, setInternalSelection] =
    useState<DataGridSelection>(EMPTY_SELECTION);
  const controlled = controlledSelection !== undefined;
  const selection = controlled ? controlledSelection : internalSelection;

  const setSelection = useCallback(
    (next: DataGridSelection) => {
      if (!controlled) {
        setInternalSelection(next);
      }
      onSelectionChange?.(next);
    },
    [controlled, onSelectionChange],
  );

  const rect = useMemo(
    () => rangeRect(selection, rowIds, columnIds),
    [selection, rowIds, columnIds],
  );
  const activeCell = selection.focus;
  // The first visible cell is the fallback Tab stop so the grid is keyboard
  // reachable before anything is selected; once a cell is active it becomes the
  // single Tab stop (roving tabindex).
  const firstCell = useMemo<DataGridCellRef | null>(
    () =>
      rowIds.length > 0 && columnIds.length > 0
        ? { rowId: rowIds[0], columnId: columnIds[0] }
        : null,
    [rowIds, columnIds],
  );
  const tabStop = activeCell ?? firstCell;

  // Roving focus + drag hit-testing: each rendered cell registers its host node
  // (with its ref) so the controller can move DOM focus to the next active cell
  // and resolve the cell under a drag pointer via `elementFromPoint`.
  const cellNodesRef = useRef(new Map<string, DataGridCellNode>());
  const registerCellNode = useCallback(
    (ref: DataGridCellRef, node: { focus?: () => void } | null) => {
      const key = cellKey(ref);
      if (node) {
        cellNodesRef.current.set(key, { node, ref });
      } else {
        cellNodesRef.current.delete(key);
      }
    },
    [],
  );
  const focusCell = useCallback((ref: DataGridCellRef) => {
    cellNodesRef.current.get(cellKey(ref))?.node?.focus?.();
  }, []);

  const announceActive = useCallback(
    (ref: DataGridCellRef) => {
      const column = visibleColumns.find((col) => col.id === ref.columnId);
      const rowNumber = rowIds.indexOf(ref.rowId) + 1;
      if (column && rowNumber > 0) {
        announceGrid(`${column.label}, row ${rowNumber}`);
      }
    },
    [visibleColumns, rowIds],
  );

  const requestEdit = useCallback(
    (ref: DataGridCellRef) => onRequestEdit?.(ref),
    [onRequestEdit],
  );

  const activate = useCallback(
    (
      ref: DataGridCellRef,
      options?: { extend?: boolean; silent?: boolean },
    ) => {
      if (options?.extend && selection.anchor) {
        const next = { anchor: selection.anchor, focus: ref };
        setSelection(next);
        const count = selectionCount(next, rowIds, columnIds);
        announceGrid(`${count} cell${count === 1 ? "" : "s"} selected`);
        return;
      }
      setSelection(singleCell(ref));
      if (!options?.silent) {
        announceActive(ref);
      }
    },
    [announceActive, columnIds, rowIds, selection.anchor, setSelection],
  );

  const beginDrag = useDataGridDrag({
    cellNodesRef,
    setSelection,
    selectionAnchor: selection.anchor,
    rowIds,
    columnIds,
    announceActive,
  });

  const refAt = useCallback(
    (row: number, col: number): DataGridCellRef | null => {
      const rowId = rowIds[row];
      const columnId = columnIds[col];
      if (rowId === undefined || columnId === undefined) {
        return null;
      }
      return { rowId, columnId };
    },
    [columnIds, rowIds],
  );

  const { handleCellKeyDown, moveActiveDown } = useDataGridKeyboard({
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
  });

  return {
    visibleColumns,
    columnIds,
    rowIds,
    selection,
    activeCell,
    tabStop,
    rect,
    activate,
    beginDrag,
    moveActiveDown,
    requestEdit,
    setSelection,
    handleCellKeyDown,
    registerCellNode,
    focusCell,
    isActiveCell: (ref: DataGridCellRef) => cellRefEquals(ref, activeCell),
    isTabStop: (ref: DataGridCellRef) => cellRefEquals(ref, tabStop),
  };
}

export type DataGridController = ReturnType<typeof useDataGridController>;
