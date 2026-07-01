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

import type { DataGridCellNode, DataGridNodeMap } from "./dataGridDragDom";
import {
  cellKey,
  cellRefEquals,
  rangeRect,
  selectionCount,
  singleCell,
} from "./dataGridSelectionModel";
import { useDataGridDrag, type DataGridDragBox } from "./useDataGridDrag";
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
  /** Copy the current selection to the clipboard (Ctrl/Cmd+C). */
  onCopy?: () => void;
  /** Paste clipboard content from the active cell (Ctrl/Cmd+V). */
  onPaste?: () => void;
};

export function useDataGridController({
  columns,
  rows,
  selection: controlledSelection,
  onSelectionChange,
  onRequestEdit,
  onNavigateToRow,
  onCopy,
  onPaste,
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
  // Only a single-cell selection shows the active-cell ring; a range/row/column
  // selection is conveyed by the fill alone (no extra border on one cell).
  const singleSelection =
    rect !== null && rect.minRow === rect.maxRow && rect.minCol === rect.maxCol;
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
  // Fall back to the first cell when the active cell is no longer visible (its
  // row filtered out or its column hidden/deleted) so the grid always keeps a
  // keyboard-reachable Tab stop.
  const activeVisible =
    activeCell !== null &&
    rowIds.includes(activeCell.rowId) &&
    columnIds.includes(activeCell.columnId);
  const tabStop = activeVisible ? activeCell : firstCell;

  // Roving focus + drag hit-testing: each rendered cell registers its host node
  // (with its ref) so the controller can move DOM focus to the next active cell
  // and resolve the cell under a drag pointer via `elementFromPoint`.
  const cellNodesRef = useRef(new Map<string, DataGridCellNode>());
  const gutterNodesRef = useRef<DataGridNodeMap>(new Map());
  const headerNodesRef = useRef<DataGridNodeMap>(new Map());
  const gridNodeRef = useRef<Element | null>(null);
  const [dragBox, setDragBox] = useState<DataGridDragBox | null>(null);

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
  const registerGutterNode = useCallback(
    (rowId: string, node: { contains?: (n: Node) => boolean } | null) => {
      if (node) {
        gutterNodesRef.current.set(rowId, node);
      } else {
        gutterNodesRef.current.delete(rowId);
      }
    },
    [],
  );
  const registerHeaderNode = useCallback(
    (columnId: string, node: { contains?: (n: Node) => boolean } | null) => {
      if (node) {
        headerNodesRef.current.set(columnId, node);
      } else {
        headerNodesRef.current.delete(columnId);
      }
    },
    [],
  );
  const registerGridNode = useCallback((node: Element | null) => {
    gridNodeRef.current = node;
  }, []);
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

  const { beginCellDrag, beginRowDrag, beginColumnDrag } = useDataGridDrag({
    cellNodesRef,
    gutterNodesRef,
    headerNodesRef,
    gridNodeRef,
    setSelection,
    selectionAnchor: selection.anchor,
    rowIds,
    columnIds,
    announceActive,
    onDragBox: setDragBox,
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
    onCopy,
    onPaste,
  });

  return {
    visibleColumns,
    columnIds,
    rowIds,
    selection,
    activeCell,
    tabStop,
    rect,
    singleSelection,
    dragBox,
    activate,
    beginDrag: beginCellDrag,
    beginRowDrag,
    beginColumnDrag,
    moveActiveDown,
    requestEdit,
    setSelection,
    handleCellKeyDown,
    registerCellNode,
    registerGutterNode,
    registerHeaderNode,
    registerGridNode,
    focusCell,
    isActiveCell: (ref: DataGridCellRef) => cellRefEquals(ref, activeCell),
    isTabStop: (ref: DataGridCellRef) => cellRefEquals(ref, tabStop),
  };
}

export type DataGridController = ReturnType<typeof useDataGridController>;
