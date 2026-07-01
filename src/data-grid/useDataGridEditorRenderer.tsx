/**
 * Builds the `renderEditor(ref)` callback for an editing cell: looks up the
 * column + value, renders the typed {@link CellEditor}, and wires commit/cancel
 * to the editing hook + controller (advance on commit, re-focus the cell after).
 */
import { type ReactNode, useCallback } from "react";

import type { SharedUiTheme } from "../theme";

import { CellEditor } from "./dataGridCellEditors";
import type { DataGridController } from "./useDataGridController";
import type {
  DataGridCellRef,
  DataGridCellValue,
  DataGridColumn,
  DataGridRow,
} from "./types";

type Editing = {
  cancelEdit: () => void;
  commitEdit: (
    ref: DataGridCellRef,
    value: DataGridCellValue,
  ) => Promise<boolean>;
};

export function useDataGridEditorRenderer({
  columns,
  rows,
  controller,
  editing,
  onCellChange,
  fontSize,
  theme,
}: {
  columns: DataGridColumn[];
  rows: DataGridRow[];
  controller: DataGridController;
  editing: Editing;
  onCellChange?: (
    ref: DataGridCellRef,
    value: DataGridCellValue,
  ) => void | Promise<void>;
  fontSize: number;
  theme: SharedUiTheme;
}): (ref: DataGridCellRef) => ReactNode {
  const refocus = useCallback(
    (ref: DataGridCellRef) => {
      if (typeof requestAnimationFrame !== "undefined") {
        requestAnimationFrame(() => controller.focusCell(ref));
      }
    },
    [controller],
  );

  return useCallback(
    (ref: DataGridCellRef) => {
      const column = columns.find((col) => col.id === ref.columnId);
      if (!column) {
        return null;
      }
      const value = rows.find((row) => row.id === ref.rowId)?.cells[
        ref.columnId
      ];
      return (
        <CellEditor
          column={column}
          fontSize={fontSize}
          onCancel={() => {
            editing.cancelEdit();
            refocus(ref);
          }}
          onChange={(next) => void onCellChange?.(ref, next)}
          onCommit={async (next, moveNext) => {
            // Only advance/refocus once the commit succeeds — a rejected
            // onCellChange keeps the editor open (see useDataGridEditing).
            if (!(await editing.commitEdit(ref, next))) {
              return;
            }
            if (moveNext) {
              controller.moveActiveDown();
            } else {
              refocus(ref);
            }
          }}
          theme={theme}
          value={value ?? null}
        />
      );
    },
    [
      columns,
      controller,
      editing,
      fontSize,
      onCellChange,
      refocus,
      rows,
      theme,
    ],
  );
}
