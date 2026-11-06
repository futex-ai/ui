/**
 * The default start rules (modifier keys, ignored regions, fields, and
 * controls) and the app's final answer through `shouldStartDrag`.
 */
import { devWarn } from "../devWarn";

import { DRAG_SELECTABLE_IGNORE_ATTRIBUTE } from "./dragSelectableIgnore";
import type { DragSelectableResolvedOptions } from "./dragSelectableOptions";
import type {
  DragSelectableDragMode,
  DragSelectableModifierKeys,
  DragSelectableStartReason,
} from "./dragSelectableOptionTypes";
import { DRAG_SELECTABLE_TARGET_ATTRIBUTE } from "./dragSelectableTargetNode";
import type { DragSelectableTargetRegistration } from "./dragSelectableTypes";

const PRESS_INPUT_TYPES = [
  "button",
  "checkbox",
  "image",
  "radio",
  "reset",
  "submit",
];

/** Elements where a press edits or adjusts a value. */
export const DRAG_SELECTABLE_FIELD_SELECTOR = [
  `input${PRESS_INPUT_TYPES.map((type) => `:not([type='${type}' i])`).join("")}`,
  "textarea",
  "select",
  "[contenteditable]:not([contenteditable='false' i])",
  ...[
    "textbox",
    "searchbox",
    "combobox",
    "slider",
    "spinbutton",
    "scrollbar",
  ].map((role) => `[role='${role}']`),
  "[draggable='true']",
].join(",");

/** Elements where a press activates something. */
export const DRAG_SELECTABLE_CONTROL_SELECTOR = [
  "a[href]",
  "button",
  "summary",
  "label",
  ...PRESS_INPUT_TYPES.map((type) => `input[type='${type}' i]`),
  ...[
    "button",
    "link",
    "checkbox",
    "radio",
    "switch",
    "tab",
    "menuitem",
    "menuitemcheckbox",
    "menuitemradio",
    "option",
  ].map((role) => `[role='${role}']`),
].join(",");

/** What the default rules and `shouldStartDrag` read for one press. */
export type DragSelectableStartInput = {
  element: Element;
  event: PointerEvent;
  keys: DragSelectableModifierKeys;
  options: Pick<
    DragSelectableResolvedOptions,
    "dragMode" | "ignore" | "shouldStartDrag" | "startFromControls"
  >;
  /** The provider element: the rules search up to and including it. */
  provider: Element;
  targets: Iterable<DragSelectableTargetRegistration>;
};

/** The decision for one press. */
export type DragSelectableStartDecision = {
  allowed: boolean;
  mode: DragSelectableDragMode | null;
  /** Whether the press is on a control, whatever the decision. */
  onControl: boolean;
  reason: DragSelectableStartReason | null;
  targetId: string | null;
};

/** Runs the default rules, then `shouldStartDrag`, for one press. */
export function dragSelectableStartDecision(
  input: DragSelectableStartInput,
): DragSelectableStartDecision {
  const { element, options, provider } = input;
  const target = innermostTarget(element, provider, input.targets);
  const control = closestControl(element, provider, target);
  const mode = options.dragMode(input.keys);
  let reason: DragSelectableStartReason | null = null;
  if (mode === null) {
    reason = "modifier";
  } else if (insideIgnored(element, provider, options.ignore)) {
    reason = "ignored";
  } else if (insideWithin(element, provider, DRAG_SELECTABLE_FIELD_SELECTOR)) {
    reason = "field";
  } else if (
    control &&
    !(options.startFromControls && target && !target.disabled)
  ) {
    reason = "control";
  }
  const allowed = reason === null;
  const targetId = target?.id ?? null;
  const decided = options.shouldStartDrag
    ? options.shouldStartDrag({
        allowed,
        element,
        event: input.event,
        keys: input.keys,
        mode,
        reason,
        targetId,
      })
    : allowed;
  return {
    allowed: decided,
    mode: decided ? (mode ?? "replace") : mode,
    onControl: control !== null,
    reason,
    targetId,
  };
}

/** The registered target whose root contains the element, innermost first. */
function innermostTarget(
  element: Element,
  provider: Element,
  targets: Iterable<DragSelectableTargetRegistration>,
): DragSelectableTargetRegistration | null {
  const byNode = new Map<unknown, DragSelectableTargetRegistration>();
  for (const target of targets) {
    byNode.set(target.node, target);
  }
  for (const node of ancestors(element, provider)) {
    const target = byNode.get(node);
    if (target) {
      return target;
    }
  }
  return null;
}

/**
 * The nearest control between the element and the target root, or the
 * provider when the press is outside every target. The target root and the
 * element that carries the target's `a11yProps` count as the target.
 */
function closestControl(
  element: Element,
  provider: Element,
  target: DragSelectableTargetRegistration | null,
): Element | null {
  const root = target?.node as unknown as Element | undefined;
  for (const node of ancestors(element, root ?? provider)) {
    if (node === root) {
      return null;
    }
    const ownTarget =
      target !== null &&
      node.getAttribute(DRAG_SELECTABLE_TARGET_ATTRIBUTE) === target.id;
    if (!ownTarget && node.matches(DRAG_SELECTABLE_CONTROL_SELECTOR)) {
      return node;
    }
  }
  return null;
}

function insideIgnored(
  element: Element,
  provider: Element,
  selectors: readonly string[],
): boolean {
  if (
    insideWithin(element, provider, `[${DRAG_SELECTABLE_IGNORE_ATTRIBUTE}]`)
  ) {
    return true;
  }
  return selectors.some((selector) => {
    try {
      return insideWithin(element, provider, selector);
    } catch {
      warnInvalidSelector(selector);
      return false;
    }
  });
}

/** Whether the element or an ancestor up to the provider matches. */
function insideWithin(
  element: Element,
  provider: Element,
  selector: string,
): boolean {
  const match = element.closest(selector);
  return match !== null && (match === provider || provider.contains(match));
}

/** The element and its ancestors, up to and including `last`. */
function* ancestors(element: Element, last: Element): Generator<Element> {
  for (
    let node: Element | null = element;
    node;
    node = node === last ? null : node.parentElement
  ) {
    yield node;
  }
}

const warnedSelectors = new Set<string>();

function warnInvalidSelector(selector: string) {
  if (warnedSelectors.has(selector)) {
    return;
  }
  warnedSelectors.add(selector);
  devWarn(
    `DragSelectableProvider: the ignore selector "${selector}" is not a valid CSS selector, so it matches nothing.`,
  );
}
