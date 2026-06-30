/**
 * Web pointer-drag cell-range selection for the data grid.
 *
 * A cell's `onPointerDown` calls {@link useDataGridDrag}'s `beginDrag`, which sets
 * the anchor, attaches document-level pointer listeners, and extends the focus to
 * the cell under the pointer (hit-tested via `elementFromPoint`) as the drag
 * moves. No-op outside the browser; native uses tap + keyboard instead.
 */
import { useCallback, useEffect, useRef, type MutableRefObject } from "react";

import { announceGrid } from "./dataGridAnnounce";

import {
  attachDataGridDragListeners,
  cellRefFromPoint,
  type DataGridCellNode,
} from "./dataGridDragDom";
import { cellRefEquals, selectionCount } from "./dataGridSelectionModel";
import type { DataGridCellRef, DataGridSelection } from "./types";

export type UseDataGridDragOptions = {
  cellNodesRef: MutableRefObject<Map<string, DataGridCellNode>>;
  setSelection: (selection: DataGridSelection) => void;
  selectionAnchor: DataGridCellRef | null;
  rowIds: readonly string[];
  columnIds: readonly string[];
  announceActive: (ref: DataGridCellRef) => void;
};

export function useDataGridDrag({
  cellNodesRef,
  setSelection,
  selectionAnchor,
  rowIds,
  columnIds,
  announceActive,
}: UseDataGridDragOptions) {
  const dragRef = useRef<{
    anchor: DataGridCellRef;
    lastFocus: DataGridCellRef;
  } | null>(null);
  const removeDragListenersRef = useRef<(() => void) | null>(null);

  const beginDrag = useCallback(
    (ref: DataGridCellRef, rawEvent: unknown) => {
      if (typeof document === "undefined") {
        return;
      }
      const event = rawEvent as {
        button?: number;
        shiftKey?: boolean;
        pointerType?: string;
        nativeEvent?: {
          button?: number;
          shiftKey?: boolean;
          pointerType?: string;
        };
      };
      const button = event.button ?? event.nativeEvent?.button;
      if (button !== undefined && button !== 0) {
        return; // only the primary button starts a drag
      }
      if ((event.pointerType ?? event.nativeEvent?.pointerType) === "touch") {
        return; // touch scrolls; no marquee on touch in Phase 1
      }
      const shift = event.shiftKey ?? event.nativeEvent?.shiftKey ?? false;
      const anchor = shift && selectionAnchor ? selectionAnchor : ref;
      const next: DataGridSelection = { anchor, focus: ref };
      setSelection(next);
      if (shift && selectionAnchor) {
        const count = selectionCount(next, rowIds, columnIds);
        announceGrid(`${count} cell${count === 1 ? "" : "s"} selected`);
      } else {
        announceActive(ref);
      }
      dragRef.current = { anchor, lastFocus: ref };
      removeDragListenersRef.current?.();
      removeDragListenersRef.current = attachDataGridDragListeners({
        onMove: (x, y) => {
          const drag = dragRef.current;
          if (!drag) {
            return;
          }
          const cell = cellRefFromPoint(cellNodesRef.current.values(), x, y);
          if (!cell || cellRefEquals(cell, drag.lastFocus)) {
            return;
          }
          drag.lastFocus = cell;
          const nextSelection: DataGridSelection = {
            anchor: drag.anchor,
            focus: cell,
          };
          setSelection(nextSelection);
          const count = selectionCount(nextSelection, rowIds, columnIds);
          announceGrid(`${count} cell${count === 1 ? "" : "s"} selected`);
        },
        onEnd: () => {
          removeDragListenersRef.current?.();
          removeDragListenersRef.current = null;
          dragRef.current = null;
        },
      });
    },
    [
      announceActive,
      cellNodesRef,
      columnIds,
      rowIds,
      selectionAnchor,
      setSelection,
    ],
  );

  useEffect(() => () => removeDragListenersRef.current?.(), []);

  return beginDrag;
}
