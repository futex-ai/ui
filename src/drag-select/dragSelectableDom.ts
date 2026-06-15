/** DOM helpers used by the web drag-select provider. */
import type { DragSelectableBounds } from "./dragSelectableModel";
import { dragSelectablePointFromEvent } from "./dragSelectableModel";
import type { DragSelectablePoint } from "./dragSelectableModel";
import type {
  DragSelectableTargetRegistration,
  DragSelectableTargetSnapshot,
} from "./dragSelectableTypes";

export type DragSelectableMeasuredTarget = DragSelectableBounds &
  DragSelectableTargetSnapshot;

export const dragSelectableInteractiveSelector = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "[contenteditable]:not([contenteditable='false'])",
  "[contenteditable='true']",
  "[role='button']",
  "[role='checkbox']",
  "[role='combobox']",
  "[role='link']",
  "[role='menuitem']",
  "[role='menuitemcheckbox']",
  "[role='menuitemradio']",
  "[role='option']",
  "[role='radio']",
  "[role='slider']",
  "[role='spinbutton']",
  "[role='switch']",
  "[role='tab']",
  "[role='textbox']",
].join(",");

export function dragSelectableRegistrationInvalidatesRegistry(
  previous: DragSelectableTargetRegistration | undefined,
  next: DragSelectableTargetRegistration,
): boolean {
  if (!previous) {
    return true;
  }
  return (
    previous.id !== next.id ||
    previous.node !== next.node ||
    previous.disabled !== next.disabled
  );
}

export function measureDragSelectableTargets(
  targets: Iterable<DragSelectableTargetRegistration>,
): DragSelectableMeasuredTarget[] {
  const measurements: DragSelectableMeasuredTarget[] = [];
  for (const target of targets) {
    if (target.disabled) {
      continue;
    }
    const rectNode = target.node as unknown as {
      getBoundingClientRect?: () => DOMRect;
    };
    const rect = rectNode.getBoundingClientRect?.();
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      continue;
    }
    measurements.push({
      bottom: rect.bottom,
      data: target.data,
      id: target.id,
      left: rect.left,
      right: rect.right,
      top: rect.top,
    });
  }
  return measurements;
}

export function dragSelectableSnapshotsForIds(
  ids: readonly string[],
  targets: ReadonlyMap<string, DragSelectableTargetRegistration>,
): DragSelectableTargetSnapshot[] {
  return ids.map((id) => {
    const target = targets.get(id);
    return { data: target?.data, id };
  });
}

export function dragSelectablePointFromUnknownEvent(
  event: unknown,
): DragSelectablePoint | null {
  return dragSelectablePointFromEvent(
    event as Parameters<typeof dragSelectablePointFromEvent>[0],
    dragSelectableViewportScrollPoint(),
  );
}

export function dragSelectableViewportScrollPoint(): DragSelectablePoint {
  if (typeof window === "undefined") {
    return { x: 0, y: 0 };
  }
  return {
    x: window.scrollX ?? window.pageXOffset ?? 0,
    y: window.scrollY ?? window.pageYOffset ?? 0,
  };
}

export function dragSelectableEventTarget(event: unknown): Node | null {
  if (typeof Node === "undefined") {
    return null;
  }
  const source = event as {
    nativeEvent?: { target?: unknown };
    target?: unknown;
  };
  const target = source.nativeEvent?.target ?? source.target;
  return target instanceof Node ? target : null;
}

export function dragSelectablePointerSource(event: unknown) {
  const source = event as {
    button?: number;
    nativeEvent?: { button?: number; pointerType?: string };
    pointerType?: string;
  };
  return source.nativeEvent ?? source;
}

export function dragSelectableShouldStartFromTarget(
  target: Node | null,
  targets: Iterable<DragSelectableTargetRegistration>,
): boolean {
  if (!target) {
    return false;
  }
  const registeredTarget = dragSelectableRegisteredTargetForNode(
    target,
    targets,
  );
  if (registeredTarget && !registeredTarget.disabled) {
    const interactive = dragSelectableClosestInteractive(target);
    const registeredElement = registeredTarget.node as unknown as Element;
    if (interactive && interactive !== registeredElement) {
      return false;
    }
    return true;
  }
  const interactive = dragSelectableClosestInteractive(target);
  return !interactive;
}

function dragSelectableRegisteredTargetForNode(
  target: Node,
  targets: Iterable<DragSelectableTargetRegistration>,
): DragSelectableTargetRegistration | null {
  for (const candidate of targets) {
    const element = candidate.node as unknown as Element;
    if (element === target || element.contains(target)) {
      return candidate;
    }
  }
  return null;
}

function dragSelectableClosestInteractive(target: Node): Element | null {
  if (!(target instanceof Element)) {
    return (
      target.parentElement?.closest(dragSelectableInteractiveSelector) ?? null
    );
  }
  return target.closest(dragSelectableInteractiveSelector);
}
