/**
 * The web pointer drag of the panel resize handle. A primary-button press on
 * the handle starts a drag of any pointer type, and document listeners follow
 * the pointer until it is released, also outside the handle.
 *
 * | Event                      | Effect                                                        |
 * | -------------------------- | ------------------------------------------------------------- |
 * | Press                      | Own the press, block text selection, set the cursor, listen   |
 * | Move                       | Propose the clamped width; `onChange` only when it changes    |
 * | Release, cancel, or blur   | Detach and restore; `onChangeEnd` once if the width changed   |
 * | `disabled` during a drag   | End the drag as a release does                                |
 * | Unmount                    | Detach and restore, with no callbacks                         |
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { blockDragSelectableTextSelection } from "../drag-select/dragSelectableTextSelection";
import { attachPointerDragListeners } from "../dragGesture";

import { panelDragWidth } from "./panelResizeModel";
import type { PanelResizeEdge } from "./panelResizeModel";

type PanelResizeDragOptions = {
  disabled: boolean;
  edge: PanelResizeEdge;
  max: number;
  min: number;
  onChange: (width: number) => void;
  onChangeEnd?: (width: number) => void;
  value: number;
};

type PointerDownEvent = {
  button?: number;
  clientX?: number;
  nativeEvent?: { button?: number; clientX?: number };
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

type DragSession = {
  /** The last width that the drag proposed. */
  last: number;
  /** The page cursor before the drag, restored at its end. */
  previousCursor: string;
  /** Lifts the text-selection block of the drag. */
  restoreTextSelection: () => void;
  startWidth: number;
  startX: number;
};

export function usePanelResizeDrag(options: PanelResizeDragOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const sessionRef = useRef<DragSession | null>(null);
  const detachRef = useRef<(() => void) | null>(null);
  const [dragging, setDragging] = useState(false);

  const endDrag = useCallback((report: boolean) => {
    const session = sessionRef.current;
    detachRef.current?.();
    detachRef.current = null;
    sessionRef.current = null;
    if (!session) {
      return;
    }
    session.restoreTextSelection();
    document.body.style.cursor = session.previousCursor;
    setDragging(false);
    if (report && session.last !== session.startWidth) {
      optionsRef.current.onChangeEnd?.(session.last);
    }
  }, []);

  const onPointerDown = useCallback(
    (event: PointerDownEvent) => {
      const { disabled, value } = optionsRef.current;
      if (disabled || sessionRef.current || typeof document === "undefined") {
        return;
      }
      const button = event.button ?? event.nativeEvent?.button;
      if (button !== undefined && button !== 0) {
        return; // primary button only
      }
      // The resize owns this press, so an enclosing drag selection or
      // pressable does not also start. The press keeps its default, so it
      // still focuses the handle; the drag blocks text selection instead.
      event.stopPropagation?.();
      sessionRef.current = {
        last: value,
        previousCursor: document.body.style.cursor,
        restoreTextSelection: blockDragSelectableTextSelection(),
        startWidth: value,
        startX: event.clientX ?? event.nativeEvent?.clientX ?? 0,
      };
      // The resize cursor stays while the pointer is off the 9px handle.
      document.body.style.cursor = "col-resize";
      setDragging(true);
      detachRef.current = attachPointerDragListeners({
        onEnd: () => endDrag(true),
        onMove: (clientX) => {
          const session = sessionRef.current;
          if (!session) {
            return;
          }
          const { edge, max, min, onChange } = optionsRef.current;
          const next = panelDragWidth(
            session.startWidth,
            clientX - session.startX,
            edge,
            min,
            max,
          );
          if (next !== session.last) {
            session.last = next;
            onChange(next);
          }
        },
      });
    },
    [endDrag],
  );

  useEffect(() => {
    if (options.disabled) {
      endDrag(true);
    }
  }, [endDrag, options.disabled]);

  useEffect(() => () => endDrag(false), [endDrag]);

  return { dragging, onPointerDown };
}
