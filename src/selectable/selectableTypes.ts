import type { ReactNode, RefObject } from "react";

export const SELECTABLE_ELEMENT_ID_ATTRIBUTE = "data-selectable-id";
export const DEFAULT_SELECTABLE_SELECTOR = `[${SELECTABLE_ELEMENT_ID_ATTRIBUTE}]`;

export type SelectableElementSnapshot = {
  element: Element;
  id: string | null;
  index: number;
  text: string;
};

export type SelectableSelection = {
  active: boolean;
  selectedCount: number;
  selectedElements: readonly SelectableElementSnapshot[];
  selectedIds: readonly string[];
  text: string;
};

export type SelectableElementIdGetter = (
  element: Element,
  index: number,
) => string | null;

export type SelectableRoot = Document | Element;

export type SelectableProviderProps = {
  children: ReactNode;
  disabled?: boolean;
  getElementId?: SelectableElementIdGetter;
  onChange?: (selection: SelectableSelection) => void;
  root?: SelectableRoot | null;
  rootRef?: RefObject<SelectableRoot | null>;
  selector?: string;
};

export type SelectableSelectionChangeOptions = {
  skipInitial?: boolean;
};

const emptySelectedElements = Object.freeze(
  [],
) as readonly SelectableElementSnapshot[];
const emptySelectedIds = Object.freeze([]) as readonly string[];

export const emptySelectableSelection: SelectableSelection = Object.freeze({
  active: false,
  selectedCount: 0,
  selectedElements: emptySelectedElements,
  selectedIds: emptySelectedIds,
  text: "",
});
