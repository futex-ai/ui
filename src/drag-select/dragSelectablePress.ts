/**
 * The start rules for a `pointerdown` that reaches a web provider: the check
 * that the provider element contains the pressed element, the claim that
 * gives a press to the innermost active provider, the fixed rules, and the
 * default rules with the app's final answer.
 */
import type { DragSelectablePoint } from "./dragSelectableModel";
import type { DragSelectableResolvedOptions } from "./dragSelectableOptions";
import type { DragSelectableDragMode } from "./dragSelectableOptionTypes";
import {
  dragSelectableScrollContainer,
  type DragSelectableScrollContainer,
} from "./dragSelectableScrollContainer";
import {
  dragSelectableScrollbarHit,
  dragSelectableScrollbarMetrics,
} from "./dragSelectableScrollbar";
import { dragSelectableStartDecision } from "./dragSelectableStartRules";
import type { DragSelectableTargetRegistration } from "./dragSelectableTypes";

/**
 * The property that marks a native `pointerdown` as taken by a provider, so
 * an enclosing provider leaves it alone.
 */
export const DRAG_SELECTABLE_PRESS_CLAIM = "__firnaDragSelectClaimed";

/** The fields of a native `pointerdown` that the rules read. */
export type DragSelectablePressEvent = {
  altKey?: boolean;
  button?: number;
  clientX: number;
  clientY: number;
  ctrlKey?: boolean;
  metaKey?: boolean;
  pointerId?: number;
  pointerType?: string;
  shiftKey?: boolean;
  target: EventTarget | null;
};

/** What the provider knows when a press arrives. */
export type DragSelectablePressContext = {
  hasEnabledTarget: () => boolean;
  options: DragSelectableResolvedOptions;
  /** The provider element, whose `pointerdown` handler received the press. */
  provider: Element;
  targets: () => Iterable<DragSelectableTargetRegistration>;
};

/** An accepted press. */
export type DragSelectableAcceptedPress = {
  container: DragSelectableScrollContainer;
  mode: DragSelectableDragMode;
  point: DragSelectablePoint;
  pointerId: number | undefined;
  threshold: number;
};

/**
 * Claims the press for this provider when it is active. Returns `false` when
 * an inner provider already claimed it, or when this provider is disabled or
 * has no enabled target, so that an outer provider can take it.
 */
export function dragSelectableClaimPress(
  event: object,
  active: boolean,
): boolean {
  const marks = event as Record<string, unknown>;
  if (marks[DRAG_SELECTABLE_PRESS_CLAIM] === true || !active) {
    return false;
  }
  marks[DRAG_SELECTABLE_PRESS_CLAIM] = true;
  return true;
}

/** The element a press landed on, or `null` outside the DOM. */
export function dragSelectablePressedElement(
  target: EventTarget | null,
): Element | null {
  if (typeof Element === "undefined" || typeof Node === "undefined") {
    return null;
  }
  if (target instanceof Element) {
    return target;
  }
  return target instanceof Node ? target.parentElement : null;
}

/**
 * Applies the start rules to a `pointerdown`. Returns the accepted press, or
 * `null` when the press must not arm the provider. The provider element must
 * contain the pressed element: React sends a press inside a portal through
 * the portal's React parents, so a press in a modal that a page opens reaches
 * a provider whose element does not contain it. Such a press, and a press
 * without an element, returns `null` before the claim, so the provider never
 * takes it.
 */
export function dragSelectableAcceptPress(
  event: DragSelectablePressEvent,
  context: DragSelectablePressContext,
): DragSelectableAcceptedPress | null {
  const element = dragSelectablePressedElement(event.target);
  if (!element || !context.provider.contains(element)) {
    return null;
  }
  const { options } = context;
  const active = !options.disabled && context.hasEnabledTarget();
  if (!dragSelectableClaimPress(event, active)) {
    return null;
  }
  if (event.pointerType === "touch") {
    return null;
  }
  if (event.button !== undefined && event.button !== 0) {
    return null;
  }
  const point = { x: event.clientX, y: event.clientY };
  const container = dragSelectableScrollContainer(element);
  if (
    dragSelectableScrollbarHit(dragSelectableScrollbarMetrics(container), point)
  ) {
    return null;
  }
  const decision = dragSelectableStartDecision({
    element,
    event: event as unknown as PointerEvent,
    keys: {
      altKey: event.altKey === true,
      ctrlKey: event.ctrlKey === true,
      metaKey: event.metaKey === true,
      shiftKey: event.shiftKey === true,
    },
    options,
    provider: context.provider,
    targets: context.targets(),
  });
  if (!decision.allowed || decision.mode === null) {
    return null;
  }
  return {
    container,
    mode: decision.mode,
    point,
    pointerId: event.pointerId,
    threshold: decision.onControl
      ? Math.max(
          options.minimumDragDistance,
          options.minimumControlDragDistance,
        )
      : options.minimumDragDistance,
  };
}
