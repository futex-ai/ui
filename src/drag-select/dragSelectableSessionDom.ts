/** The DOM side of a drag-select session: listeners and measurements. */
import { suppressNextClick } from "../dragGesture";
import { pushEscapeLayer, removeEscapeLayer } from "../escapeLayer";
import { endPointerPresses } from "../primitives/webPress/usePress";

import { startDragSelectableAutoScroll } from "./dragSelectableAutoScroll";
import { measureDragSelectableTargets } from "./dragSelectableDom";
import { dragSelectableAnchorFrame } from "./dragSelectableScrollAnchor";
import {
  dragSelectableClipBox,
  dragSelectableVisibleRect,
  type DragSelectableScrollContainer,
} from "./dragSelectableScrollContainer";
import type {
  DragSelectableActiveDrag,
  DragSelectableSessionEnv,
  DragSelectableSessionHandlers,
} from "./dragSelectableSession";
import { dragSelectableDocumentOrder } from "./dragSelectableTargetOrder";
import { blockDragSelectableTextSelection } from "./dragSelectableTextSelection";
import type { DragSelectableTargetRegistration } from "./dragSelectableTypes";

/** What the provider hands to the DOM side of one session. */
export type DragSelectableSessionDomOptions = {
  commit: (hitIds: string[]) => void;
  container: DragSelectableScrollContainer;
  end: () => void;
  provider: Element;
  render: (drag: DragSelectableActiveDrag | null) => void;
  /** The live registrations, read at call time. */
  targets: () => Iterable<DragSelectableTargetRegistration>;
};

type ClaimResponder = (event: {
  nativeEvent: object;
  target: unknown;
}) => boolean;

/**
 * Builds the session environment for the browser. The listeners record each
 * `pointermove` before the session handles it. The session ends the presses
 * while it handles the move that starts the drag, so the presses end with
 * that move: the pointer event that took the pointer over.
 */
export function dragSelectableSessionDom(
  options: DragSelectableSessionDomOptions,
): DragSelectableSessionEnv & { claimResponder: ClaimResponder } {
  let lastMove: PointerEvent | null = null;
  let takeoverMove: MouseEvent | null = null;

  const copyStartingMove = (event: MouseEvent) => {
    if (
      takeoverMove?.type !== "pointermove" ||
      event.target !== takeoverMove.target
    ) {
      return;
    }

    const copy = new MouseEvent("mousemove", {
      altKey: event.altKey,
      bubbles: true,
      button: event.button,
      buttons: event.buttons,
      cancelable: true,
      clientX: event.clientX,
      clientY: event.clientY,
      composed: event.composed,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      screenX: event.screenX,
      screenY: event.screenY,
      shiftKey: event.shiftKey,
      view: event.view,
    });
    // Send the move through the provider before a child can stop the original.
    takeoverMove = copy;
    options.provider.dispatchEvent(copy);
    takeoverMove = null;
  };

  return {
    blockTextSelection: blockDragSelectableTextSelection,
    claimResponder: ({ nativeEvent, target }) => {
      // Both responder systems negotiate on the mousemove that follows pointermove.
      if (
        !takeoverMove ||
        target !== takeoverMove.target ||
        !("type" in nativeEvent) ||
        nativeEvent.type !== "mousemove"
      ) {
        return false;
      }
      takeoverMove = null;
      return true;
    },
    clipBox: (box) =>
      dragSelectableClipBox(box, dragSelectableVisibleRect(options.container)),
    commit: options.commit,
    end: () => {
      takeoverMove = null;
      options.end();
    },
    endPresses: () => {
      if (lastMove) {
        takeoverMove = lastMove;
        endPointerPresses(lastMove);
      }
    },
    listen: (handlers) =>
      listenToDragSelectableSession(
        handlers,
        (event) => {
          lastMove = event;
          takeoverMove = null;
        },
        copyStartingMove,
      ),
    measureTargets: () => measureDragSelectableTargets(options.targets()),
    measureTargetsInOrder: () =>
      measureDragSelectableTargets(
        dragSelectableDocumentOrder(
          [...options.targets()].filter((target) => !target.disabled),
        ),
      ),
    pushEscape: (onEscape) => {
      const layer = { onEscape };
      pushEscapeLayer(layer);
      return () => removeEscapeLayer(layer);
    },
    readAnchor: () => dragSelectableAnchorFrame(options.container),
    render: options.render,
    startAutoScroll: (readPointer) =>
      startDragSelectableAutoScroll(options.container, readPointer),
    suppressClick: suppressNextClick,
  };
}

/**
 * Attaches the document and window listeners of a session. Each
 * `pointermove` goes to `recordMove` before the session handles it. From the
 * accepted press to the release, native `dragstart` is blocked, so a link,
 * an image, or highlighted text cannot start a native drag. Only a `blur`
 * of the window itself interrupts: the capture phase would also deliver the
 * blur of a focused element when the press moves focus.
 */
export function listenToDragSelectableSession(
  handlers: DragSelectableSessionHandlers,
  recordMove: (event: PointerEvent) => void,
  onMouseMove: (event: MouseEvent) => void,
): () => void {
  const point = (event: PointerEvent) => ({
    x: event.clientX,
    y: event.clientY,
  });
  const move = (event: PointerEvent) => {
    recordMove(event);
    handlers.move(point(event), event.pointerId);
  };
  const release = (event: PointerEvent) =>
    handlers.release(point(event), event.pointerId);
  const cancel = () => handlers.cancel();
  const blur = (event: FocusEvent) => {
    if (event.target === window) {
      handlers.interrupt();
    }
  };
  const visibility = () => {
    if (document.visibilityState === "hidden") {
      handlers.interrupt();
    }
  };
  const blockNativeDrag = (event: DragEvent) => event.preventDefault();
  const scroll = () => handlers.scroll();
  document.addEventListener("pointermove", move, true);
  document.addEventListener("mousemove", onMouseMove, true);
  document.addEventListener("pointerup", release, true);
  document.addEventListener("pointercancel", cancel, true);
  document.addEventListener("dragstart", blockNativeDrag, true);
  document.addEventListener("scroll", scroll, true);
  document.addEventListener("visibilitychange", visibility, true);
  window.addEventListener("blur", blur);
  return () => {
    document.removeEventListener("pointermove", move, true);
    document.removeEventListener("mousemove", onMouseMove, true);
    document.removeEventListener("pointerup", release, true);
    document.removeEventListener("pointercancel", cancel, true);
    document.removeEventListener("dragstart", blockNativeDrag, true);
    document.removeEventListener("scroll", scroll, true);
    document.removeEventListener("visibilitychange", visibility, true);
    window.removeEventListener("blur", blur);
  };
}
