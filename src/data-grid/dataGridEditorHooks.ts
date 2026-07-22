/** Shared props + hooks for the in-cell editors. */
import { type RefObject, useEffect, useRef } from "react";

import type { SharedUiTheme } from "../theme";

import type { DataGridCellValue, DataGridColumn } from "./types";

export type CellEditorProps = {
  column: DataGridColumn;
  value: DataGridCellValue;
  fontSize: number;
  theme: SharedUiTheme;
  /** Commit a value; `moveNext` (Enter) advances the active cell down + closes. */
  onCommit: (value: DataGridCellValue, moveNext: boolean) => void;
  /** Live value update that does NOT close the editor (multi-select toggles). */
  onChange?: (value: DataGridCellValue) => void;
  onCancel: () => void;
};

/**
 * Autofocus a freshly-mounted editor input and guard against the spurious blur
 * that the opening double-press pointer-up fires before focus settles: returns
 * `shouldCommitOnBlur()` (false during the ~250ms settle window) so the editor
 * re-focuses instead of committing the unchanged value and closing immediately.
 */
export function useEditorAutofocus<T>(inputRef: RefObject<T | null>) {
  const mountAtRef = useRef(0);
  useEffect(() => {
    mountAtRef.current = Date.now();
    const focus = () => {
      const focusable = inputRef.current as { focus?: () => void } | null;
      focusable?.focus?.();
    };
    focus();
    if (typeof requestAnimationFrame === "undefined") {
      return;
    }
    // The pointer-up that completes edit entry can land after this effect and
    // move focus back to the cell that is being replaced. Re-focus after that
    // event frame so button-backed editors settle like text inputs do.
    const frame = requestAnimationFrame(focus);
    return () => cancelAnimationFrame(frame);
  }, [inputRef]);
  return () => Date.now() - mountAtRef.current >= 250;
}

/** Cancel the editor on Escape via a document listener (RNW swallows onKeyDown). */
export function useEscapeKey(onCancel: () => void) {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [onCancel]);
}
