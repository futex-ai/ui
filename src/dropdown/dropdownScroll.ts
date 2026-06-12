/** Scroll helpers for keeping keyboard-active dropdown rows visible. */
import type { DropdownClientRect } from "./dropdownGeometry";

export type DropdownScrollBounds = {
  activeBottom: number;
  activeTop: number;
  viewportBottom: number;
  viewportTop: number;
};

export function dropdownScrollOffsetForActiveRow(
  bounds: DropdownScrollBounds,
): number {
  if (bounds.activeTop < bounds.viewportTop) {
    return bounds.activeTop - bounds.viewportTop;
  }
  if (bounds.activeBottom > bounds.viewportBottom) {
    return bounds.activeBottom - bounds.viewportBottom;
  }
  return 0;
}

export function scrollDropdownActiveRowIntoView(
  scrollRef: unknown,
  activeRowRef: unknown,
): void {
  const scrollNode = dropdownScrollableNode(scrollRef);
  const activeRowNode = dropdownRowNode(activeRowRef);
  const viewportRect = scrollNode?.getBoundingClientRect?.();
  const activeRect = activeRowNode?.getBoundingClientRect?.();
  if (!scrollNode || !viewportRect || !activeRect) {
    activeRowNode?.scrollIntoView?.({ block: "nearest" });
    return;
  }

  const offset = dropdownScrollOffsetForActiveRow({
    activeBottom: activeRect.bottom,
    activeTop: activeRect.top,
    viewportBottom: viewportRect.bottom,
    viewportTop: viewportRect.top,
  });
  if (offset === 0) {
    return;
  }
  if (scrollNode.scrollBy) {
    scrollNode.scrollBy({ behavior: "auto", top: offset });
    return;
  }
  if (typeof scrollNode.scrollTop === "number") {
    scrollNode.scrollTop += offset;
  }
}

type DropdownScrollNode = {
  getBoundingClientRect?: () => DropdownClientRect;
  getScrollableNode?: () => DropdownScrollNode | null;
  scrollBy?: (options: { behavior: "auto"; top: number }) => void;
  scrollTop?: number;
};

type DropdownRowNode = {
  getBoundingClientRect?: () => DropdownClientRect;
  scrollIntoView?: (options: { block: "nearest" }) => void;
};

function dropdownScrollableNode(scrollRef: unknown): DropdownScrollNode | null {
  if (!isDropdownScrollNode(scrollRef)) {
    return null;
  }
  return scrollRef.getScrollableNode?.() ?? scrollRef;
}

function dropdownRowNode(activeRowRef: unknown): DropdownRowNode | null {
  if (!isDropdownRowNode(activeRowRef)) {
    return null;
  }
  return activeRowRef;
}

function isDropdownScrollNode(value: unknown): value is DropdownScrollNode {
  return typeof value === "object" && value !== null;
}

function isDropdownRowNode(value: unknown): value is DropdownRowNode {
  return typeof value === "object" && value !== null;
}
