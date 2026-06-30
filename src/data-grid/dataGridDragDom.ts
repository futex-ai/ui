/**
 * Web-only DOM helpers for cell-range drag selection.
 *
 * Hit-testing uses `document.elementFromPoint` against the grid's registered cell
 * nodes, so it follows flex column widths and scroll offset without any geometry
 * math. The pattern mirrors the drag-select primitive's document-level pointer
 * listeners. All functions no-op outside the browser.
 */
import type { DataGridCellRef } from "./types";

/** A registered cell host node paired with its cell ref. */
export type DataGridCellNode = {
  node: { contains?: (other: Node) => boolean; focus?: () => void };
  ref: DataGridCellRef;
};

/** The cell ref under the viewport point, or `null` when none is registered. */
export function cellRefFromPoint(
  nodes: Iterable<DataGridCellNode>,
  clientX: number,
  clientY: number,
): DataGridCellRef | null {
  if (typeof document === "undefined") {
    return null;
  }
  const element = document.elementFromPoint(clientX, clientY);
  if (!element) {
    return null;
  }
  for (const { node, ref } of nodes) {
    if (node.contains?.(element)) {
      return ref;
    }
  }
  return null;
}

export type DataGridDragHandlers = {
  onMove: (clientX: number, clientY: number) => void;
  onEnd: () => void;
};

/**
 * Attach document-level pointer listeners for the duration of a drag and return
 * a disposer. Move events `preventDefault` to suppress native text selection.
 */
export function attachDataGridDragListeners(
  handlers: DataGridDragHandlers,
): () => void {
  if (typeof document === "undefined") {
    return () => undefined;
  }
  const move = (event: PointerEvent) => {
    event.preventDefault();
    handlers.onMove(event.clientX, event.clientY);
  };
  const end = () => handlers.onEnd();
  const cancel = () => handlers.onEnd();
  document.addEventListener("pointermove", move, true);
  document.addEventListener("pointerup", end, true);
  document.addEventListener("pointercancel", cancel, true);
  window.addEventListener("blur", cancel, true);
  return () => {
    document.removeEventListener("pointermove", move, true);
    document.removeEventListener("pointerup", end, true);
    document.removeEventListener("pointercancel", cancel, true);
    window.removeEventListener("blur", cancel, true);
  };
}
