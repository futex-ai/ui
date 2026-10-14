/** The DOM side of a drag-select session: listeners and measurements. */
import { suppressNextClick } from "../dragGesture";
import { pushEscapeLayer, removeEscapeLayer } from "../escapeLayer";
import { endPointerPresses } from "../primitives/dom/usePress";

import { measureDragSelectableTargets } from "./dragSelectableDom";
import { dragSelectableAnchorFrame } from "./dragSelectableScrollAnchor";
import type { DragSelectableScrollContainer } from "./dragSelectableScrollContainer";
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
  render: (drag: DragSelectableActiveDrag | null) => void;
  /** The live registrations, read at call time. */
  targets: () => Iterable<DragSelectableTargetRegistration>;
};

/** Builds the session environment for the browser. */
export function dragSelectableSessionDom(
  options: DragSelectableSessionDomOptions,
): DragSelectableSessionEnv {
  return {
    blockTextSelection: blockDragSelectableTextSelection,
    commit: options.commit,
    end: options.end,
    endPresses: endPointerPresses,
    listen: listenToDragSelectableSession,
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
    suppressClick: suppressNextClick,
  };
}

/**
 * Attaches the document and window listeners of a session. From the
 * accepted press to the release, native `dragstart` is blocked, so a link,
 * an image, or highlighted text cannot start a native drag. Only a `blur`
 * of the window itself interrupts: the capture phase would also deliver the
 * blur of a focused element when the press moves focus.
 */
export function listenToDragSelectableSession(
  handlers: DragSelectableSessionHandlers,
): () => void {
  const point = (event: PointerEvent) => ({
    x: event.clientX,
    y: event.clientY,
  });
  const move = (event: PointerEvent) =>
    handlers.move(point(event), event.pointerId);
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
  document.addEventListener("pointerup", release, true);
  document.addEventListener("pointercancel", cancel, true);
  document.addEventListener("dragstart", blockNativeDrag, true);
  document.addEventListener("scroll", scroll, true);
  document.addEventListener("visibilitychange", visibility, true);
  window.addEventListener("blur", blur);
  return () => {
    document.removeEventListener("pointermove", move, true);
    document.removeEventListener("pointerup", release, true);
    document.removeEventListener("pointercancel", cancel, true);
    document.removeEventListener("dragstart", blockNativeDrag, true);
    document.removeEventListener("scroll", scroll, true);
    document.removeEventListener("visibilitychange", visibility, true);
    window.removeEventListener("blur", blur);
  };
}
