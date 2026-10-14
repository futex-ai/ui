/** DOM helpers used by the web drag-select provider. */
import type { DragSelectableBounds } from "./dragSelectableModel";
import type {
  DragSelectableSelection,
  DragSelectableTargetRegistration,
  DragSelectableTargetSnapshot,
} from "./dragSelectableTypes";

export type DragSelectableMeasuredTarget = DragSelectableBounds &
  DragSelectableTargetSnapshot;

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
