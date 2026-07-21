/**
 * Clipboard wiring for the grid: stable copy / cut / paste / clear handlers handed
 * to the controller, plus a `bind` that supplies the latest state each render (so
 * the handlers can be created before the controller they read from). It also owns
 * the copy/cut marquee highlight (`copied`) shown over the source range. Web-only
 * — the pure serialization + paste planning live in {@link dataGridClipboard}.
 */
import { useCallback, useRef, useState } from "react";

import {
  buildClipboardText,
  clearCellsWrites,
  clearRectWrites,
  parseClipboardGrid,
  planPaste,
  type DataGridCellWrite,
} from "./dataGridClipboard";
import { rangeBetween } from "./dataGridSelectionModel";
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

/**
 * The cells on the clipboard, marked for the marquee. They are stored as
 * resolved refs (not a rectangle) so the marquee follows them through a
 * sort/filter and a `cut` clears exactly those cells — never a stale rectangle.
 */
export type DataGridCopyMark = {
  refs: DataGridCellRef[];
  mode: "copy" | "cut";
};

function clipboard(): Clipboard | undefined {
  return typeof navigator !== "undefined" ? navigator.clipboard : undefined;
}

export function useDataGridClipboard() {
  const depsRef = useRef<ClipboardDeps | null>(null);
  const bind = useCallback((deps: ClipboardDeps) => {
    depsRef.current = deps;
  }, []);

  // `copied` drives the marquee render; the ref lets the stable handlers read it
  // without depending on it (so their identity — and thus the controller — is
  // stable across a copy/cut).
  const [copied, setCopiedState] = useState<DataGridCopyMark | null>(null);
  const copiedRef = useRef<DataGridCopyMark | null>(null);
  const setCopied = useCallback((mark: DataGridCopyMark | null) => {
    copiedRef.current = mark;
    setCopiedState(mark);
  }, []);

  // Copy or cut: serialize the selected rectangle to the OS clipboard and mark
  // it for the marquee. A cut is completed (source cleared) by the next paste.
  const writeSelection = useCallback(
    (mode: "copy" | "cut") => {
      const deps = depsRef.current;
      const api = clipboard();
      if (!deps || !deps.controller.rect || !api?.writeText) {
        return;
      }
      const { controller } = deps;
      const text = buildClipboardText(
        controller.rect!,
        controller.rowIds,
        controller.columnIds,
        controller.visibleColumns,
        deps.rows,
      );
      void api.writeText(text).catch(() => undefined);
      const refs = rangeBetween(
        controller.selection,
        controller.rowIds,
        controller.columnIds,
      );
      setCopied({ refs, mode });
    },
    [setCopied],
  );

  const onCopy = useCallback(() => writeSelection("copy"), [writeSelection]);
  const onCut = useCallback(() => writeSelection("cut"), [writeSelection]);

  const onPaste = useCallback(() => {
    const api = clipboard();
    const deps = depsRef.current;
    if (
      !api?.readText ||
      !deps ||
      !deps.onCellChange ||
      !deps.controller.rect
    ) {
      return;
    }
    // Snapshot everything the paste needs at keypress time, so a selection change
    // while the async clipboard read is pending (e.g. a permission prompt) can't
    // relocate the paste.
    const { controller, onCellChange } = deps;
    const { rowIds, columnIds, visibleColumns, setSelection } = controller;
    const rect = controller.rect!;
    const mark = copiedRef.current;

    void api
      .readText()
      .then((text) => {
        const source = parseClipboardGrid(text);
        const { writes, target } = planPaste(
          source,
          { row: rect.minRow, col: rect.minCol },
          rect.maxRow - rect.minRow + 1,
          rect.maxCol - rect.minCol + 1,
          rowIds,
          columnIds,
          visibleColumns,
        );
        const commit = (write: DataGridCellWrite) =>
          void onCellChange(
            { rowId: write.rowId, columnId: write.columnId },
            write.value,
          );
        writes.forEach(commit);

        // Only act when something was actually pasted. An empty or non-text
        // clipboard must leave a pending cut untouched — never destroy its
        // source (or drop the marquee) with nothing pasted.
        if (source.length === 0) {
          return;
        }
        if (mark?.mode === "cut") {
          clearCellsWrites(
            mark.refs,
            rowIds,
            columnIds,
            visibleColumns,
            target, // don't blank cells the paste just overwrote
          ).forEach(commit);
        }
        // The paste consumed the clipboard, so drop the copy/cut marquee.
        setCopied(null);

        // Reselect the pasted block (Excel leaves the paste area selected).
        const anchor = {
          rowId: rowIds[target.minRow],
          columnId: columnIds[target.minCol],
        };
        const focus = {
          rowId: rowIds[target.maxRow],
          columnId: columnIds[target.maxCol],
        };
        if (anchor.rowId && anchor.columnId && focus.rowId && focus.columnId) {
          setSelection({ anchor, focus });
        }
      })
      .catch(() => undefined);
  }, [setCopied]);

  // Delete / Backspace: clear the contents of every editable selected cell.
  const onClearSelection = useCallback(() => {
    const deps = depsRef.current;
    if (!deps || !deps.onCellChange || !deps.controller.rect) {
      return;
    }
    const { controller, onCellChange } = deps;
    clearRectWrites(
      controller.rect!,
      controller.rowIds,
      controller.columnIds,
      controller.visibleColumns,
    ).forEach((write) =>
      onCellChange(
        { rowId: write.rowId, columnId: write.columnId },
        write.value,
      ),
    );
  }, []);

  // Escape: dismiss the copy/cut marquee (a no-op when nothing is marked).
  const onCancelCopy = useCallback(() => {
    if (copiedRef.current) {
      setCopied(null);
    }
  }, [setCopied]);

  return {
    onCopy,
    onCut,
    onPaste,
    onClearSelection,
    onCancelCopy,
    bind,
    /** The cells currently on the clipboard, for the marquee (or null). */
    copied,
  };
}
