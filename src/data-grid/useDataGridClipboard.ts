/**
 * Clipboard wiring for the grid: stable `onCopy` / `onPaste` handed to the
 * controller, plus a `bind` that supplies the latest state each render (so the
 * handlers can be created before the controller they read from). Web-only — the
 * pure serialization lives in {@link dataGridClipboard}.
 */
import { useCallback, useRef } from "react";

import {
  buildClipboardText,
  coerceCellValue,
  parseClipboardGrid,
} from "./dataGridClipboard";
import type { DataGridController } from "./useDataGridController";
import type { DataGridCellRef, DataGridCellValue, DataGridRow } from "./types";

type ClipboardDeps = {
  controller: DataGridController;
  rows: DataGridRow[];
  onCellChange?: (
    ref: DataGridCellRef,
    value: DataGridCellValue,
  ) => void | Promise<void>;
};

function clipboard(): Clipboard | undefined {
  return typeof navigator !== "undefined" ? navigator.clipboard : undefined;
}

export function useDataGridClipboard() {
  const depsRef = useRef<ClipboardDeps | null>(null);
  const bind = useCallback((deps: ClipboardDeps) => {
    depsRef.current = deps;
  }, []);

  const onCopy = useCallback(() => {
    const deps = depsRef.current;
    const api = clipboard();
    if (!deps || !deps.controller.rect || !api?.writeText) {
      return;
    }
    const { controller, rows } = deps;
    const text = buildClipboardText(
      controller.rect!,
      controller.rowIds,
      controller.columnIds,
      controller.visibleColumns,
      rows,
    );
    void api.writeText(text).catch(() => undefined);
  }, []);

  const onPaste = useCallback(() => {
    const deps = depsRef.current;
    const api = clipboard();
    const active = deps?.controller.activeCell ?? null;
    if (!deps || !deps.onCellChange || !api?.readText || !active) {
      return;
    }
    const { controller, onCellChange } = deps;
    const startRow = controller.rowIds.indexOf(active.rowId);
    const startCol = controller.columnIds.indexOf(active.columnId);
    if (startRow < 0 || startCol < 0) {
      return;
    }
    void api
      .readText()
      .then((text) => {
        parseClipboardGrid(text).forEach((cols, i) => {
          cols.forEach((cellText, j) => {
            const rowId = controller.rowIds[startRow + i];
            const columnId = controller.columnIds[startCol + j];
            const column = controller.visibleColumns.find(
              (col) => col.id === columnId,
            );
            if (!rowId || !column || column.editable === false) {
              return;
            }
            void onCellChange(
              { rowId, columnId },
              coerceCellValue(column, cellText),
            );
          });
        });
      })
      .catch(() => undefined);
  }, []);

  return { onCopy, onPaste, bind };
}
