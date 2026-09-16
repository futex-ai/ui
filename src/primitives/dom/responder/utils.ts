/**
 * Walking the DOM event path in responder terms.
 *
 * Transcribed from `react-native-web` 0.21.2's
 * `modules/useResponderEvents/utils.js` and `modules/isSelectionValid`. Every
 * node that registers with the system is tagged with a numeric id under
 * `__reactResponderId`; an event's path is then filtered down to the tagged
 * nodes, which is the list the capture/bubble negotiation walks.
 *
 * The pure half (`getLowestCommonAncestor`, `isPrimaryPointerDown`) is pinned
 * by `tests/unit/domResponder.test.ts`.
 */

/** Property a registered node carries its responder id under. */
const RESPONDER_ID_KEY = "__reactResponderId";

/** A DOM node with the fields the responder system reads off it. */
type ResponderNode = Node & {
  [RESPONDER_ID_KEY]?: number;
  contains?: (other: Node | null) => boolean;
};

/** The tagged nodes on an event's path, innermost first. */
export type ResponderPaths = {
  idPath: number[];
  nodePath: ResponderNode[];
};

function composedPathFallback(target: Node | null): Node[] {
  const path: Node[] = [];
  let node = target;
  while (node != null && node !== document.body) {
    path.push(node);
    node = node.parentNode;
  }
  return path;
}

function getEventPath(domEvent: Event): Node[] {
  // A `selectionchange` always targets the document, so the path is rebuilt
  // from the selection's anchor instead. Only the first responder node on it
  // is ever needed in practice.
  if (domEvent.type === "selectionchange") {
    const selection = window.getSelection();
    return composedPathFallback(
      selection == null ? null : selection.anchorNode,
    );
  }
  return typeof domEvent.composedPath === "function"
    ? (domEvent.composedPath() as unknown as Node[])
    : composedPathFallback(domEvent.target as Node | null);
}

/** Tags a host node so events through it can find its responder config. */
export function setResponderId(node: unknown, id: number): void {
  if (node != null) {
    (node as ResponderNode)[RESPONDER_ID_KEY] = id;
  }
}

function getResponderId(node: Node): number | undefined {
  return (node as ResponderNode)[RESPONDER_ID_KEY];
}

/** Filters an event's path down to the nodes attached to the system. */
export function getResponderPaths(domEvent: Event): ResponderPaths {
  const idPath: number[] = [];
  const nodePath: ResponderNode[] = [];
  for (const node of getEventPath(domEvent)) {
    const id = node == null ? undefined : getResponderId(node);
    if (id != null) {
      idPath.push(id);
      nodePath.push(node as ResponderNode);
    }
  }
  return { idPath, nodePath };
}

/**
 * The first entry both paths share, or `null` when they are unrelated.
 *
 * Paths run innermost-first, so this walks them from the outside in after
 * trimming whichever is deeper.
 */
export function getLowestCommonAncestor<T>(
  pathA: readonly T[],
  pathB: readonly T[],
): T | null {
  let pathALength = pathA.length;
  let pathBLength = pathB.length;
  if (
    pathALength === 0 ||
    pathBLength === 0 ||
    // Different roots mean no ancestor is connected to the responder system.
    pathA[pathALength - 1] !== pathB[pathBLength - 1]
  ) {
    return null;
  }

  let itemA = pathA[0];
  let indexA = 0;
  let itemB = pathB[0];
  let indexB = 0;

  if (pathALength - pathBLength > 0) {
    indexA = pathALength - pathBLength;
    itemA = pathA[indexA];
    pathALength = pathBLength;
  }
  if (pathBLength - pathALength > 0) {
    indexB = pathBLength - pathALength;
    itemB = pathB[indexB];
    pathBLength = pathALength;
  }

  let depth = pathALength;
  while (depth--) {
    if (itemA === itemB) {
      return itemA;
    }
    itemA = pathA[indexA++];
    itemB = pathB[indexB++];
  }
  return null;
}

/** A touch list entry, as the DOM reports it. */
type TouchLike = { target?: Node | null };

/**
 * Whether any active touch is inside `target`.
 *
 * `targetTouches` would answer this, but neither IE11 nor Safari implement it,
 * which is why that backend scanned `touches` by hand.
 */
export function hasTargetTouches(
  target: ResponderNode,
  touches: ArrayLike<TouchLike> | null | undefined,
): boolean {
  if (touches == null || touches.length === 0) {
    return false;
  }
  for (let index = 0; index < touches.length; index++) {
    const node = touches[index].target;
    if (node != null && target.contains?.(node) === true) {
      return true;
    }
  }
  return false;
}

/** Whether a selection looks like a person deliberately selecting text. */
export function isSelectionValid(): boolean {
  const selection =
    typeof window === "undefined" ? null : window.getSelection();
  if (selection == null) {
    return false;
  }
  const text = selection.toString();
  const { anchorNode, focusNode } = selection;
  const isTextNode =
    anchorNode?.nodeType === Node.TEXT_NODE ||
    focusNode?.nodeType === Node.TEXT_NODE;
  return text.length >= 1 && text !== "\n" && isTextNode;
}

/** Ignores `selectionchange` events that are not a real text selection. */
export function hasValidSelection(domEvent: Event): boolean {
  if (domEvent.type === "selectionchange") {
    return isSelectionValid();
  }
  return domEvent.type === "select";
}

/** The fields {@link isPrimaryPointerDown} reads off a DOM event. */
export type PrimaryPointerEvent = {
  altKey?: boolean;
  button?: number;
  buttons?: number;
  ctrlKey?: boolean;
  type?: string;
};

/**
 * Whether an event was the primary button with no modifier held.
 *
 * A right-click, a middle-click or a Control-click never starts a gesture; a
 * touch always does. `metaKey` is deliberately not checked, matching that
 * backend.
 */
export function isPrimaryPointerDown(domEvent: PrimaryPointerEvent): boolean {
  const { altKey, button, buttons, ctrlKey, type } = domEvent;
  const isTouch = type === "touchstart" || type === "touchmove";
  const isPrimaryMouseDown =
    type === "mousedown" && (button === 0 || buttons === 1);
  const isPrimaryMouseMove = type === "mousemove" && buttons === 1;
  const noModifiers = altKey === false && ctrlKey === false;
  return (
    isTouch ||
    (isPrimaryMouseDown && noModifiers) ||
    (isPrimaryMouseMove && noModifiers)
  );
}
