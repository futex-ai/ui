import { createContext, useContext, useEffect, useRef } from "react";

import {
  emptySelectableSelection,
  type SelectableSelection,
  type SelectableSelectionChangeOptions,
} from "./selectableTypes";

export const SelectableSelectionContext = createContext<SelectableSelection>(
  emptySelectableSelection,
);

export function useSelectableSelection(): SelectableSelection {
  return useContext(SelectableSelectionContext);
}

export function useSelectableSelectionChange(
  onChange: (selection: SelectableSelection) => void,
  options: SelectableSelectionChangeOptions = {},
): SelectableSelection {
  const selection = useSelectableSelection();
  const latestOnChange = useRef(onChange);
  const previousSelection = useRef<SelectableSelection | null>(null);

  useEffect(() => {
    latestOnChange.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (previousSelection.current === null && options.skipInitial) {
      previousSelection.current = selection;
      return;
    }

    if (previousSelection.current === selection) {
      return;
    }

    previousSelection.current = selection;
    latestOnChange.current(selection);
  }, [options.skipInitial, selection]);

  return selection;
}
