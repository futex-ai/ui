/** Keyboard navigation helpers for dropdown option lists. */

export type DropdownNavigationItem = {
  disabled?: boolean;
  id: string;
  selectable?: boolean;
};

export type DropdownKeyAction =
  | "close"
  | "moveDown"
  | "moveUp"
  | "select"
  | "toggle";
export type DropdownTriggerKeyAction = "close" | "moveDown" | "moveUp";

export type DropdownValueOption = {
  disabled?: boolean;
  value: string;
};

export function dropdownKeyAction(key: string): DropdownKeyAction | null {
  if (key === "ArrowDown") return "moveDown";
  if (key === "ArrowUp") return "moveUp";
  if (key === "Enter") return "select";
  if (key === "Escape") return "close";
  if (key === " ") return "toggle";
  return null;
}

export function dropdownTriggerKeyAction(
  key: string,
): DropdownTriggerKeyAction | null {
  const action = dropdownKeyAction(key);
  return action === "select" || action === "toggle" ? null : action;
}

export function firstSelectableId(
  items: DropdownNavigationItem[],
): string | null {
  return items.find(isSelectable)?.id ?? null;
}

export function nextSelectableId(
  items: DropdownNavigationItem[],
  currentId: string | null,
  delta: -1 | 1,
): string | null {
  const selectable = items.filter(isSelectable);
  if (selectable.length === 0) {
    return null;
  }
  if (!currentId) {
    return delta > 0 ? selectable[0].id : selectable[selectable.length - 1].id;
  }
  const currentIndex = selectable.findIndex((item) => item.id === currentId);
  if (currentIndex < 0) {
    return delta > 0 ? selectable[0].id : selectable[selectable.length - 1].id;
  }
  const nextIndex =
    (currentIndex + delta + selectable.length) % selectable.length;
  return selectable[nextIndex].id;
}

export function navigationResetKey(items: DropdownNavigationItem[]): string {
  return items
    .map(
      (item) =>
        `${item.id}:${item.selectable === false ? "0" : "1"}:${item.disabled ? "1" : "0"}`,
    )
    .join("|");
}

export function selectedOrFirstId(
  items: DropdownNavigationItem[],
  selectedId?: string | null,
): string | null {
  if (
    selectedId &&
    items.some((item) => item.id === selectedId && isSelectable(item))
  ) {
    return selectedId;
  }
  return firstSelectableId(items);
}

export function shouldResetDropdownListActiveId(
  controlledActiveId: string | null | undefined,
): boolean {
  return controlledActiveId === undefined;
}

export function nextDropdownValue(
  options: DropdownValueOption[],
  value: string,
  delta: -1 | 1,
): string | null {
  const items = options.map((option) => ({
    disabled: option.disabled,
    id: option.value,
  }));
  const currentId = items.some(
    (item) => item.id === value && isSelectable(item),
  )
    ? value
    : null;
  return nextSelectableId(items, currentId, delta);
}

function isSelectable(item: DropdownNavigationItem): boolean {
  return item.selectable !== false && !item.disabled;
}
