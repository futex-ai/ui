/** DOM helpers used by the web drag-select provider. */
import type { DragSelectableBounds } from "./dragSelectableModel";
import { DRAG_SELECTABLE_TARGET_ATTRIBUTE } from "./dragSelectableTargetNode";
import type {
  DragSelectableSelection,
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

export function dragSelectableSelectionForTargets(
  targets: readonly DragSelectableTargetSnapshot[],
): DragSelectableSelection {
  return {
    selectedCount: targets.length,
    selectedIds: targets.map((target) => target.id),
    selectedTargets: targets.map((target) => ({
      data: target.data,
      id: target.id,
    })),
  };
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
    return (
      !interactive ||
      interactive === registeredElement ||
      interactive.getAttribute?.(DRAG_SELECTABLE_TARGET_ATTRIBUTE) ===
        registeredTarget.id
    );
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
