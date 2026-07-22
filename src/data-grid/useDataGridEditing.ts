/**
 * Cell-edit state for the data grid: which cell is editing, plus commit/cancel.
 *
 * The grid is controlled, so committing just calls the consumer's `onCellChange`
 * and closes the editor (optimistic). A rejected promise keeps the editor open so
 * the consumer can surface an error. Movement + re-focus after commit/cancel is
 * orchestrated by `DataGrid` (it owns the controller), keeping this hook free of
 * any dependency on selection state.
 */
import { useCallback, useState } from "react";

import { hasCellEditor } from "./dataGridCellEditors";
import type {
  DataGridCellRef,
  DataGridCellValue,
  DataGridColumn,
} from "./types";

export type UseDataGridEditingOptions = {
  /** Visible columns (used to check whether a cell is editable). */
  columns: DataGridColumn[];
  /** Resolve whether a cell is busy and must not start another edit. */
  cellLoading?: (ref: DataGridCellRef) => boolean;
  onCellChange?: (
    ref: DataGridCellRef,
    value: DataGridCellValue,
  ) => void | Promise<void>;
};

export function useDataGridEditing({
  columns,
  cellLoading,
  onCellChange,
}: UseDataGridEditingOptions) {
  const [editingCell, setEditingCell] = useState<DataGridCellRef | null>(null);

  const beginEdit = useCallback(
    (ref: DataGridCellRef) => {
      const column = columns.find((col) => col.id === ref.columnId);
      if (
        !column ||
        cellLoading?.(ref) ||
        column.editable === false ||
        !hasCellEditor(column.fieldType)
      ) {
        return;
      }
      setEditingCell(ref);
    },
    [cellLoading, columns],
  );

  const cancelEdit = useCallback(() => setEditingCell(null), []);

  const commitEdit = useCallback(
    async (ref: DataGridCellRef, value: DataGridCellValue) => {
      if (cellLoading?.(ref)) {
        return false;
      }
      try {
        await onCellChange?.(ref, value);
        setEditingCell(null);
        return true;
      } catch {
        // Keep the editor open so the consumer can show an error.
        return false;
      }
    },
    [cellLoading, onCellChange],
  );

  return { editingCell, beginEdit, cancelEdit, commitEdit };
}
