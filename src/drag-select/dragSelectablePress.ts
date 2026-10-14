/**
 * The start rules for a `pointerdown` inside a web provider: the claim that
 * gives a press to the innermost active provider, the fixed rules, and the
 * rules that decide whether the press may start a drag.
 */
import type { DragSelectablePoint } from "./dragSelectableModel";
import { dragSelectableThresholdForValue } from "./dragSelectableModel";
import { dragSelectableShouldStartFromTarget } from "./dragSelectableDom";
import {
  dragSelectableScrollContainer,
  type DragSelectableScrollContainer,
} from "./dragSelectableScrollContainer";
import {
  dragSelectableScrollbarHit,
  dragSelectableScrollbarMetrics,
} from "./dragSelectableScrollbar";
import type { DragSelectableTargetRegistration } from "./dragSelectableTypes";

/**
 * The property that marks a native `pointerdown` as taken by a provider, so
 * an enclosing provider leaves it alone.
 */
export const DRAG_SELECTABLE_PRESS_CLAIM = "__firnaDragSelectClaimed";

/** The fields of a native `pointerdown` that the rules read. */
export type DragSelectablePressEvent = {
  button?: number;
  clientX: number;
  clientY: number;
  pointerId?: number;
  pointerType?: string;
  target: EventTarget | null;
};

/** What the provider knows when a press arrives. */
export type DragSelectablePressContext = {
  disabled: boolean;
  hasEnabledTarget: () => boolean;
  minimumDragDistance?: number;
  targets: () => Iterable<DragSelectableTargetRegistration>;
};

/** An accepted press. */
export type DragSelectableAcceptedPress = {
  container: DragSelectableScrollContainer;
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
 * `null` when the press must not arm the provider.
 */
export function dragSelectableAcceptPress(
  event: DragSelectablePressEvent,
  context: DragSelectablePressContext,
): DragSelectableAcceptedPress | null {
  const active = !context.disabled && context.hasEnabledTarget();
  if (!dragSelectableClaimPress(event, active)) {
    return null;
  }
  if (event.pointerType === "touch") {
    return null;
  }
  if (event.button !== undefined && event.button !== 0) {
    return null;
  }
  const element = dragSelectablePressedElement(event.target);
  if (!element) {
    return null;
  }
  const point = { x: event.clientX, y: event.clientY };
  const container = dragSelectableScrollContainer(element);
  if (
    dragSelectableScrollbarHit(dragSelectableScrollbarMetrics(container), point)
  ) {
    return null;
  }
  if (!dragSelectableShouldStartFromTarget(element, context.targets())) {
    return null;
  }
  return {
    container,
    point,
    pointerId: event.pointerId,
    threshold: dragSelectableThresholdForValue(context.minimumDragDistance),
  };
}
