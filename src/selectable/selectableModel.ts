import {
  SELECTABLE_ELEMENT_ID_ATTRIBUTE,
  emptySelectableSelection,
  type SelectableElementIdGetter,
  type SelectableSelection,
} from "./selectableTypes";

export type SelectableRangeLike = {
  collapsed?: boolean;
  intersectsNode: (node: Node) => boolean;
};

export type MatchingSelectableElementsInput = {
  elements: readonly Element[];
  getElementId?: SelectableElementIdGetter;
  ranges: readonly SelectableRangeLike[];
  text?: string;
};

export type SelectionSnapshotInput = {
  getElementId?: SelectableElementIdGetter;
  root: Document | Element;
  selection: Selection | null;
  selector: string;
};

export function defaultSelectableElementId(
  element: Element,
  _index: number,
): string | null {
  return element.getAttribute(SELECTABLE_ELEMENT_ID_ATTRIBUTE) || element.id;
}

export function selectableElements(
  root: Document | Element,
  selector: string,
): Element[] {
  const trimmedSelector = selector.trim();
  if (!trimmedSelector) {
    return [];
  }

  const elements =
    "matches" in root && root.matches(trimmedSelector) ? [root] : [];
  elements.push(...Array.from(root.querySelectorAll(trimmedSelector)));
  return elements;
}

export function selectedMatchingElements({
  elements,
  getElementId = defaultSelectableElementId,
  ranges,
  text = "",
}: MatchingSelectableElementsInput): SelectableSelection {
  const activeRanges = ranges.filter((range) => !range.collapsed);
  if (activeRanges.length === 0) {
    return emptySelectableSelection;
  }

  const selectedElements = elements.flatMap((element, index) => {
    if (!activeRanges.some((range) => rangeIntersectsElement(range, element))) {
      return [];
    }

    return [
      {
        element,
        id: getElementId(element, index),
        index,
        text: element.textContent ?? "",
      },
    ];
  });

  if (selectedElements.length === 0) {
    return emptySelectableSelection;
  }

  return {
    active: true,
    selectedCount: selectedElements.length,
    selectedElements,
    selectedIds: selectedElements.flatMap((element) =>
      element.id ? [element.id] : [],
    ),
    text,
  };
}

export function selectableSelectionFromSelection({
  getElementId,
  root,
  selection,
  selector,
}: SelectionSnapshotInput): SelectableSelection {
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return emptySelectableSelection;
  }

  const ranges = Array.from({ length: selection.rangeCount }, (_value, index) =>
    selection.getRangeAt(index),
  );

  return selectedMatchingElements({
    elements: selectableElements(root, selector),
    getElementId,
    ranges,
    text: selection.toString(),
  });
}

export function selectableSelectionsEqual(
  left: SelectableSelection,
  right: SelectableSelection,
): boolean {
  if (
    left === right ||
    (left.active === right.active &&
      left.selectedCount === right.selectedCount &&
      left.text === right.text &&
      selectableIdsEqual(left.selectedIds, right.selectedIds) &&
      selectableElementsEqual(left.selectedElements, right.selectedElements))
  ) {
    return true;
  }

  return false;
}

function rangeIntersectsElement(
  range: SelectableRangeLike,
  element: Element,
): boolean {
  try {
    return range.intersectsNode(element);
  } catch {
    return false;
  }
}

function selectableIdsEqual(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every((id, index) => id === right[index])
  );
}

function selectableElementsEqual(
  left: SelectableSelection["selectedElements"],
  right: SelectableSelection["selectedElements"],
): boolean {
  return (
    left.length === right.length &&
    left.every((item, index) => {
      const rightItem = right[index];
      return (
        item.element === rightItem?.element &&
        item.id === rightItem.id &&
        item.index === rightItem.index &&
        item.text === rightItem.text
      );
    })
  );
}
