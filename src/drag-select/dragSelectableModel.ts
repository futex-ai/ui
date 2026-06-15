/** Pure geometry helpers for drag-selectable web targets. */

export type DragSelectablePoint = {
  x: number;
  y: number;
};

export type DragSelectableBox = {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
};

export type DragSelectableBounds = {
  bottom: number;
  id: string;
  left: number;
  right: number;
  top: number;
};

export type DragSelectablePointerEventPoint = {
  clientX?: number;
  clientY?: number;
  nativeEvent?: DragSelectablePointerEventPoint;
  pageX?: number;
  pageY?: number;
};

export const dragSelectableDefaultThreshold = 4;

export function dragSelectableBox(
  start: DragSelectablePoint,
  current: DragSelectablePoint,
): DragSelectableBox {
  const left = Math.min(start.x, current.x);
  const right = Math.max(start.x, current.x);
  const top = Math.min(start.y, current.y);
  const bottom = Math.max(start.y, current.y);
  return {
    bottom,
    height: bottom - top,
    left,
    right,
    top,
    width: right - left,
  };
}

export function hasDragSelectableMoved(
  start: DragSelectablePoint,
  current: DragSelectablePoint,
  threshold = dragSelectableDefaultThreshold,
): boolean {
  return (
    Math.abs(start.x - current.x) >= threshold ||
    Math.abs(start.y - current.y) >= threshold
  );
}

export function dragSelectablePointFromEvent(
  event: DragSelectablePointerEventPoint,
  scroll: DragSelectablePoint = { x: 0, y: 0 },
): DragSelectablePoint | null {
  const source = event.nativeEvent ?? event;
  if (
    typeof source.clientX === "number" &&
    typeof source.clientY === "number"
  ) {
    return { x: source.clientX, y: source.clientY };
  }
  if (typeof source.pageX === "number" && typeof source.pageY === "number") {
    return { x: source.pageX - scroll.x, y: source.pageY - scroll.y };
  }
  return null;
}

export function dragSelectableBoundsForBox<Target extends DragSelectableBounds>(
  targets: readonly Target[],
  box: DragSelectableBox,
): Target[] {
  return targets.filter((target) => dragSelectableIntersectsBox(target, box));
}

export function dragSelectableIdsForBox(
  targets: readonly DragSelectableBounds[],
  box: DragSelectableBox,
): string[] {
  return dragSelectableBoundsForBox(targets, box).map((target) => target.id);
}

export function dragSelectableIdsEqual(
  left: readonly string[],
  right: readonly string[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((id, index) => id === right[index]);
}

export function dragSelectableIntersectsBox(
  target: DragSelectableBounds,
  box: DragSelectableBox,
): boolean {
  return (
    target.right >= box.left &&
    target.left <= box.right &&
    target.bottom >= box.top &&
    target.top <= box.bottom
  );
}
